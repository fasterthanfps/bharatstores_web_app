// lib/scraper/stores/nammamarkt.ts
// Uses Shopify's built-in JSON API — zero browser needed

import { BaseScraper, ScrapedListing, ScraperResult } from '../base';

export class NammamarktScraper extends BaseScraper {
    storeId = 'nammamarkt';
    storeName = 'Namma Markt';
    private baseUrl = 'https://www.nammamarkt.com';

    async scrape(query: string): Promise<ScraperResult> {
        const start = Date.now();
        const errors: string[] = [];
        const listings: ScrapedListing[] = [];

        // Try 1: Shopify suggest.json API
        const endpoints = [
            `${this.baseUrl}/search/suggest.json?q=${encodeURIComponent(query)}&resources[type]=product&resources[limit]=50`,
            `${this.baseUrl}/search.json?q=${encodeURIComponent(query)}&type=product`,
        ];

        for (const url of endpoints) {
            try {
                const res = await fetch(url, {
                    headers: {
                        'Accept': 'application/json',
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    },
                    signal: AbortSignal.timeout(10000),
                });

                if (!res.ok) continue;

                const data = await res.json();

                const results =
                    data?.resources?.results?.products ??
                    data?.results ??
                    data?.products ??
                    [];

                for (const item of results.slice(0, 30)) {
                    let priceRaw = item.price || item.variants?.[0]?.price || '0';
                    let price = 0;

                    if (typeof priceRaw === 'string') {
                        price = parseFloat(priceRaw.replace(/[^0-9.]/g, ''));
                        // Shopify prices are often in cents if they don't have a decimal
                        if (!priceRaw.includes('.') && price > 100) {
                            price = price / 100;
                        }
                    } else {
                        price = priceRaw;
                    }

                    const name = item.title || item.name || '';
                    if (!name) continue;

                    const weightGrams = this.parseWeightToGrams(name);

                    const isUpcoming = name.toLowerCase().match(/(demn[aä]chst|upcoming|pre-order|vorbestellung|bald verf[uü]gbar)/i);
                    const availability = isUpcoming ? 'UPCOMING' : (item.available !== false ? 'IN_STOCK' : 'OUT_OF_STOCK');

                    listings.push({
                        storeName: this.storeName,
                        storeId: this.storeId,
                        productUrl: item.url?.startsWith('http') ? item.url : `${this.baseUrl}${item.url}`,
                        name,
                        price: isNaN(price) ? 0 : price,
                        imageUrl: item.image || item.featured_image?.url || item.thumbnail || '',
                        availability,
                        weightLabel: this.extractWeightLabel(name),
                        weightGrams,
                        pricePerKg: this.computePricePerKg(price, weightGrams),
                        scrapedAt: new Date(),
                    });
                }

                if (listings.length > 0) break;
            } catch (e: any) {
                // Silently try next endpoint
            }
        }

        // Try 2: HTML Fallback if JSON failed
        if (listings.length === 0) {
            try {
                const searchUrl = `${this.baseUrl}/search?q=${encodeURIComponent(query)}&type=product`;
                const res = await fetch(searchUrl, {
                    headers: { 'User-Agent': 'Mozilla/5.0' },
                    signal: AbortSignal.timeout(10000),
                });
                if (res.ok) {
                    const html = await res.text();
                    const { load } = await import('cheerio');
                    const $ = load(html);

                    const cards = $('.product-grid-item, .grid-view-item, [class*="product-card"]');
                    cards.slice(0, 15).each((_, el) => {
                        const $el = $(el);
                        const name = $el.find('.product-title, .grid-view-item__title, [class*="title"]').first().text().trim();
                        const priceText = $el.find('.price, .price-item, [class*="price"]').first().text().trim();
                        // Parse price like "€12,49"
                        const cleanedPrice = priceText.replace(/[^\d.,]/g, '').replace(',', '.');
                        const price = parseFloat(cleanedPrice);
                        const href = $el.find('a').first().attr('href') || '';

                        if (name && !isNaN(price)) {
                            const weightGrams = this.parseWeightToGrams(name);
                            const isUpcoming = name.toLowerCase().match(/(demn[aä]chst|upcoming|pre-order|vorbestellung|bald verf[uü]gbar)/i);
                            const availability = isUpcoming ? 'UPCOMING' : 'IN_STOCK';

                            listings.push({
                                storeName: this.storeName,
                                storeId: this.storeId,
                                productUrl: href.startsWith('http') ? href : `${this.baseUrl}${href}`,
                                name,
                                price,
                                imageUrl: $el.find('img').first().attr('src') || '',
                                availability,
                                weightLabel: this.extractWeightLabel(name),
                                weightGrams,
                                pricePerKg: this.computePricePerKg(price, weightGrams),
                                scrapedAt: new Date(),
                            });
                        }
                    });
                }
            } catch (e: any) {
                errors.push(`Namma Markt HTML fallback error: ${e.message}`);
            }
        }

        return this.buildResult(listings, start, errors);
    }

    private extractWeightLabel(name: string): string | undefined {
        const match = name.match(/\d+(?:[.,]\d+)?\s*(?:g|kg|ml|l|ltr)/i);
        return match?.[0];
    }
}

// lib/scraper/stores/jamoona.ts
// Uses Shopify's built-in JSON API — zero browser needed

import { BaseScraper, ScrapedListing, ScraperResult } from '../base';
import { findCategoryUrl } from '../categoryMap';

export class JamoonaScraper extends BaseScraper {
    storeId = 'jamoona';
    storeName = 'Jamoona';
    private baseUrl = 'https://www.jamoona.de';

    async scrape(query: string): Promise<ScraperResult> {
        const start = Date.now();
        const errors: string[] = [];
        const listings: ScrapedListing[] = [];

        const q = query.toLowerCase().trim();

        // ── 1. Term Normalization ─────────────────────────────────────────────
        // If query is "curd", we also want to try "dahi" and "yogurt"
        const queriesToTry = [query];
        if (q === 'curd' || q === 'curds') {
            queriesToTry.push('dahi', 'yogurt');
        } else if (q === 'yogurt' || q === 'yoghurts') {
            queriesToTry.push('dahi', 'curd');
        }

        for (const qTerm of queriesToTry) {
            // Shopify suggest.json API (often more consistent JSON than search.json)
            const endpoints = [
                `${this.baseUrl}/search/suggest.json?q=${encodeURIComponent(qTerm)}&resources[type]=product`,
                `${this.baseUrl}/search.json?q=${encodeURIComponent(qTerm)}&type=product`,
            ];

            for (const url of endpoints) {
                try {
                    const res = await fetch(url, {
                        headers: {
                            'Accept': 'application/json',
                            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                        },
                        signal: AbortSignal.timeout(8000),
                    });

                    if (!res.ok) continue;

                    const data = await res.json();
                    const results =
                        data?.resources?.results?.products ??
                        data?.results ??
                        data?.products ??
                        [];

                    for (const item of results.slice(0, 15)) {
                        let priceRaw = item.price || item.variants?.[0]?.price || '0';
                        let price = 0;

                        if (typeof priceRaw === 'string') {
                            price = parseFloat(priceRaw.replace(/[^0-9.]/g, ''));
                            if (!priceRaw.includes('.') && price > 100) {
                                price = price / 100;
                            }
                        } else {
                            price = priceRaw;
                        }

                        const name = item.title || item.name || '';
                        if (!name) continue;

                        // Filtering: if we're searching for curd/dahi, skip things like "Kurnool Rice"
                        if ((q === 'curd' || q === 'dahi') && name.toLowerCase().includes('rice')) continue;

                        const weightGrams = this.parseWeightToGrams(name);
                        const isUpcoming = name.toLowerCase().match(/(demn[aä]chst|upcoming|pre-order|vorbestellung|bald verf[uü]gbar)/i);
                        const availability = isUpcoming ? 'UPCOMING' : (item.available !== false ? 'IN_STOCK' : 'OUT_OF_STOCK');

                        listings.push({
                            storeName: this.storeName,
                            storeId: this.storeId,
                            productUrl: item.url?.startsWith('http') ? item.url : `${this.baseUrl}${item.url}`,
                            name,
                            price: isNaN(price) ? 0 : price,
                            imageUrl: item.featured_image?.url || item.thumbnail || item.image || '',
                            availability,
                            weightLabel: this.extractWeightLabel(name),
                            weightGrams,
                            pricePerKg: this.computePricePerKg(price, weightGrams),
                            scrapedAt: new Date(),
                        });
                    }

                    if (listings.length > 0) break;
                } catch { }
            }
            if (listings.length > 0) break;
        }

        // ── 2. Category Fallback ──────────────────────────────────────────────
        if (listings.length === 0) {
            const catPath = findCategoryUrl(q, 'jamoona');
            if (catPath) {
                try {
                    const url = `${this.baseUrl}${catPath}`;
                    const res = await fetch(url, {
                        headers: { 'User-Agent': 'Mozilla/5.0' },
                        signal: AbortSignal.timeout(10000),
                    });
                    if (res.ok) {
                        const html = await res.text();
                        const { load } = await import('cheerio');
                        const $ = load(html);

                        // Shopify default search result selectors
                        const cards = $('.product-grid-item, .grid-view-item, [class*="product-card"], .product-item');
                        cards.slice(0, 15).each((_, el) => {
                            const $el = $(el);
                            const name = $el.find('.grid-view-item__title, [class*="title"], .product-item__title').first().text().trim();
                            const priceText = $el.find('.price-item, [class*="price"], .product-item__price').first().text().trim();
                            const price = parseFloat(priceText.replace(/[^0-9,.]/g, '').replace(',', '.'));
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
                    errors.push(`Jamoona category fallback error: ${e.message}`);
                }
            }
        }

        return this.buildResult(listings, start, errors);
    }

    private extractWeightLabel(name: string): string | undefined {
        const match = name.match(/\d+(?:[.,]\d+)?\s*(?:g|kg|ml|l|ltr)/i);
        return match?.[0];
    }
}

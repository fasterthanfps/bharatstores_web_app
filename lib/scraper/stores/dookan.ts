// lib/scraper/stores/dookan.ts
// eu.dookan.com — Europe's #1 Indian grocery. Shopify store with excellent suggest.json API.

import { BaseScraper, ScrapedListing, ScraperResult } from '../base';
import { findCategoryUrl } from '../categoryMap';

export class DookanScraper extends BaseScraper {
    storeId = 'dookan';
    storeName = 'Dookan';
    private baseUrl = 'https://www.dookan.de';

    async scrape(query: string): Promise<ScraperResult> {
        const start = Date.now();
        const errors: string[] = [];
        const listings: ScrapedListing[] = [];
        const q = query.toLowerCase().trim();

        // Dookan's Shopify suggest.json returns excellent product JSON
        const endpoints = [
            `${this.baseUrl}/search/suggest.json?q=${encodeURIComponent(query)}&resources[type]=product&resources[limit]=20`,
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
                const products =
                    data?.resources?.results?.products ??
                    data?.results ??
                    data?.products ??
                    [];

                for (const item of products.slice(0, 20)) {
                    const name: string = item.title || item.name || '';
                    if (!name) continue;

                    const priceStr: string = String(item.price || '0');
                    let price = parseFloat(priceStr.replace(/[^0-9.]/g, ''));
                    // Shopify sometimes returns cents (e.g. 2099 = €20.99)
                    if (!priceStr.includes('.') && price > 100) price = price / 100;

                    const weightGrams = this.parseWeightToGrams(name);
                    const availability = item.available !== false ? 'IN_STOCK' : 'OUT_OF_STOCK';

                    listings.push({
                        storeName: this.storeName,
                        storeId: this.storeId,
                        productUrl: item.url?.startsWith('http') ? item.url : `${this.baseUrl}${item.url}`,
                        name,
                        price: isNaN(price) ? 0 : price,
                        imageUrl: item.featured_image?.url || item.image || '',
                        availability,
                        weightLabel: this.extractWeightLabel(name),
                        weightGrams,
                        pricePerKg: this.computePricePerKg(price, weightGrams),
                        scrapedAt: new Date(),
                    });
                }

                if (listings.length > 0) break;
            } catch (e: any) {
                errors.push(`Dookan API error: ${e.message}`);
            }
        }

        // Category fallback
        if (listings.length === 0) {
            const catPath = findCategoryUrl(q, 'dookan');
            if (catPath) {
                try {
                    // Try collection JSON endpoint
                    const collHandle = catPath.replace('/collections/', '');
                    const colUrl = `${this.baseUrl}/collections/${collHandle}/products.json?limit=20`;
                    const res = await fetch(colUrl, {
                        headers: { 'Accept': 'application/json', 'User-Agent': 'Mozilla/5.0' },
                        signal: AbortSignal.timeout(10000),
                    });
                    if (res.ok) {
                        const data = await res.json();
                        for (const item of (data?.products ?? []).slice(0, 20)) {
                            const name = item.title || '';
                            if (!name) continue;
                            const price = parseFloat(item.variants?.[0]?.price || '0');
                            const weightGrams = this.parseWeightToGrams(name);
                            listings.push({
                                storeName: this.storeName,
                                storeId: this.storeId,
                                productUrl: `${this.baseUrl}/products/${item.handle}`,
                                name,
                                price: isNaN(price) ? 0 : price,
                                imageUrl: item.images?.[0]?.src || '',
                                availability: 'IN_STOCK',
                                weightLabel: this.extractWeightLabel(name),
                                weightGrams,
                                pricePerKg: this.computePricePerKg(price, weightGrams),
                                scrapedAt: new Date(),
                            });
                        }
                    }
                } catch (e: any) {
                    errors.push(`Dookan category fallback error: ${e.message}`);
                }
            }
        }

        return this.buildResult(listings, start, errors);
    }

    private extractWeightLabel(name: string): string | undefined {
        return name.match(/\d+(?:[.,]\d+)?\s*(?:g|kg|ml|l|ltr)/i)?.[0];
    }
}

// lib/scraper/stores/swadesh.ts
// swadesh.eu — WooCommerce-based Indian grocery store (Germany/France/Netherlands)

import * as cheerio from 'cheerio';
import { BaseScraper, ScrapedListing, ScraperResult } from '../base';
import { findCategoryUrl } from '../categoryMap';

export class SwadeshScraper extends BaseScraper {
    storeId = 'swadesh';
    storeName = 'Swadesh';
    private baseUrl = 'https://www.swadesh.eu';

    async scrape(query: string): Promise<ScraperResult> {
        const start = Date.now();
        const errors: string[] = [];
        const listings: ScrapedListing[] = [];
        const q = query.toLowerCase().trim();

        // ── 1. WooCommerce Store API ──────────────────────────────────────────
        try {
            const apiUrl = `${this.baseUrl}/wp-json/wc/store/v1/products?search=${encodeURIComponent(query)}&per_page=20`;
            const res = await fetch(apiUrl, {
                headers: { 'Accept': 'application/json', 'User-Agent': 'Mozilla/5.0' },
                signal: AbortSignal.timeout(10000),
            });
            if (res.ok) {
                const contentType = res.headers.get('content-type') || '';
                if (contentType.includes('json')) {
                    const products = await res.json();
                    for (const item of (Array.isArray(products) ? products : []).slice(0, 20)) {
                        const name = item.name || '';
                        if (!name) continue;
                        
                        // WC store/v1 returns price in minor units (cents)
                        const priceStr = item.prices?.price || item.price || '0';
                        const price = parseFloat(priceStr) / (priceStr.length > 3 ? 100 : 1);
                        
                        const weightGrams = this.parseWeightToGrams(name);
                        listings.push({
                            storeName: this.storeName,
                            storeId: this.storeId,
                            productUrl: item.permalink || `${this.baseUrl}/?s=${encodeURIComponent(query)}&post_type=product`,
                            name,
                            price: isNaN(price) ? 0 : price,
                            imageUrl: item.images?.[0]?.src || '',
                            availability: item.is_in_stock !== false ? 'IN_STOCK' : 'OUT_OF_STOCK',
                            weightLabel: this.extractWeightLabel(name),
                            weightGrams,
                            pricePerKg: this.computePricePerKg(price, weightGrams),
                            scrapedAt: new Date(),
                        });
                    }
                }
            }
        } catch (e: any) {
            errors.push(`Swadesh API error: ${e.message}`);
        }

        // ── 2. HTML search fallback ───────────────────────────────────────────
        if (listings.length === 0) {
            const htmlUrls: string[] = [
                `${this.baseUrl}/?s=${encodeURIComponent(query)}&post_type=product`,
            ];
            const catPath = findCategoryUrl(q, 'swadesh');
            if (catPath) htmlUrls.push(`${this.baseUrl}${catPath}`);

            for (const url of htmlUrls) {
                try {
                    const res = await fetch(url, {
                        headers: {
                            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                            'Accept': 'text/html,application/xhtml+xml',
                        },
                        signal: AbortSignal.timeout(12000),
                    });
                    if (!res.ok) { errors.push(`Swadesh HTTP ${res.status}`); continue; }

                    const html = await res.text();
                    const $ = cheerio.load(html);
                    const found = this.parseHtml($);
                    listings.push(...found);
                    if (listings.length > 0) break;
                } catch (e: any) {
                    errors.push(`Swadesh HTML error: ${e.message}`);
                }
            }
        }

        return this.buildResult(listings, start, errors);
    }

    private parseHtml($: cheerio.CheerioAPI): ScrapedListing[] {
        const listings: ScrapedListing[] = [];

        $('li.product, .product-type-simple, .type-product').slice(0, 20).each((_, el) => {
            try {
                const $el = $(el);
                const name = $el.find('.woocommerce-loop-product__title, h2, h3').first().text().trim();
                if (!name) return;

                let priceText = $el.find('ins .woocommerce-Price-amount').first().text().trim();
                if (!priceText) priceText = $el.find('.woocommerce-Price-amount').first().text().trim();
                if (!priceText) return;

                const priceMatch = priceText.match(/(\d+)[,.](\d{2})/);
                if (!priceMatch) return;
                const price = parseFloat(`${priceMatch[1]}.${priceMatch[2]}`);

                const href = $el.find('a.woocommerce-LoopProduct-link, a').first().attr('href') || '';
                const imgSrc = $el.find('img').first().attr('src') || $el.find('img').first().attr('data-src') || '';

                const outOfStock = $el.find('[class*="out-of-stock"]').length > 0;
                const weightGrams = this.parseWeightToGrams(name);

                listings.push({
                    storeName: this.storeName,
                    storeId: this.storeId,
                    productUrl: href || this.baseUrl,
                    name,
                    price,
                    imageUrl: imgSrc,
                    availability: outOfStock ? 'OUT_OF_STOCK' : 'IN_STOCK',
                    weightLabel: this.extractWeightLabel(name),
                    weightGrams,
                    pricePerKg: this.computePricePerKg(price, weightGrams),
                    scrapedAt: new Date(),
                });
            } catch { }
        });

        return listings;
    }

    private extractWeightLabel(name: string): string | undefined {
        return name.match(/\d+(?:[.,]\d+)?\s*(?:g|kg|ml|l|ltr)/i)?.[0];
    }
}

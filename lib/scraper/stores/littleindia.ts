// lib/scraper/stores/littleindia.ts
// WooCommerce-based store — uses WC search endpoint + HTML fallback

import * as cheerio from 'cheerio';
import { BaseScraper, ScrapedListing, ScraperResult } from '../base';
import { findCategoryUrl } from '../categoryMap';

export class LittleIndiaScraper extends BaseScraper {
    storeId = 'littleindia';
    storeName = 'Little India';
    private baseUrl = 'https://littleindia.de';

    async scrape(query: string): Promise<ScraperResult> {
        const start = Date.now();
        const errors: string[] = [];
        const listings: ScrapedListing[] = [];

        const q = query.toLowerCase().trim();

        // ── 1. WooCommerce Store API (fastest, no HTML parsing needed) ─────────
        const apiUrls = [
            `${this.baseUrl}/wp-json/wc/store/v1/products?search=${encodeURIComponent(query)}&per_page=20`,
            `${this.baseUrl}/wp-json/wc/v3/products?search=${encodeURIComponent(query)}&per_page=20&status=publish&consumer_key=&consumer_secret=`,
        ];

        for (const apiUrl of apiUrls) {
            try {
                const res = await fetch(apiUrl, {
                    headers: {
                        'Accept': 'application/json',
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
                    },
                    signal: AbortSignal.timeout(8000),
                });

                if (!res.ok) continue;
                const contentType = res.headers.get('content-type') || '';
                if (!contentType.includes('json')) continue;

                const data = await res.json();
                const products = Array.isArray(data) ? data : (data?.products ?? []);

                for (const item of products.slice(0, 20)) {
                    const name = item.name || '';
                    if (!name) continue;

                    const priceRaw = item.price || item.regular_price || item.sale_price || '0';
                    const price = parseFloat(String(priceRaw).replace(/[^0-9.]/g, ''));
                    const permalink = item.permalink || '';
                    const imageUrl = item.images?.[0]?.src || '';
                    const inStock = item.stock_status === 'instock' || item.in_stock !== false;
                    const weightGrams = this.parseWeightToGrams(name);

                    listings.push({
                        storeName: this.storeName,
                        storeId: this.storeId,
                        productUrl: permalink || `${this.baseUrl}/?s=${encodeURIComponent(query)}&post_type=product`,
                        name,
                        price: isNaN(price) ? 0 : price,
                        imageUrl,
                        availability: inStock ? 'IN_STOCK' : 'OUT_OF_STOCK',
                        weightLabel: this.extractWeightLabel(name),
                        weightGrams,
                        pricePerKg: this.computePricePerKg(price, weightGrams),
                        scrapedAt: new Date(),
                    });
                }

                if (listings.length > 0) break;
            } catch {
                // Continue to HTML scraping
            }
        }

        // ── 2. WooCommerce HTML search (most reliable fallback) ────────────────
        if (listings.length === 0) {
            const htmlUrls: string[] = [
                `${this.baseUrl}/?s=${encodeURIComponent(query)}&post_type=product`,
            ];

            const catPath = findCategoryUrl(q, 'littleindia');
            if (catPath) htmlUrls.push(`${this.baseUrl}${catPath}`);

            for (const url of htmlUrls) {
                try {
                    const res = await fetch(url, {
                        headers: {
                            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0.0.0 Safari/537.36',
                            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
                            'Accept-Language': 'de-DE,de;q=0.9,en;q=0.8',
                            'Referer': 'https://littleindia.de/',
                            'DNT': '1',
                        },
                        signal: AbortSignal.timeout(12000),
                    });

                    if (!res.ok) { errors.push(`LittleIndia HTTP ${res.status} for ${url}`); continue; }

                    const html = await res.text();
                    const $ = cheerio.load(html);

                    // WooCommerce standard selectors
                    $('li.product, .type-product, .product-type-simple').slice(0, 20).each((_, el) => {
                        try {
                            const $el = $(el);
                            const name = $el.find('.woocommerce-loop-product__title, h2, h3').first().text().trim();
                            if (!name) return;

                            const href = $el.find('a.woocommerce-LoopProduct-link, a').first().attr('href') || '';

                            // WooCommerce sale price: prefer <ins> (sale), fallback to regular
                            let priceText = $el.find('ins .woocommerce-Price-amount').first().text().trim();
                            if (!priceText) priceText = $el.find('.woocommerce-Price-amount').first().text().trim();

                            const imgSrc = $el.find('img').first().attr('src') || $el.find('img').first().attr('data-src') || '';

                            const stockClass = $el.find('[class*="stock"]').attr('class') || '';
                            const textContent = $el.text().toLowerCase();
                            let availability: 'IN_STOCK' | 'OUT_OF_STOCK' | 'UPCOMING' | 'UNKNOWN' = 'IN_STOCK';
                            if (/demn[aä]chst|upcoming|pre-order|vorbestellung/i.test(name)) {
                                availability = 'UPCOMING';
                            } else if (stockClass.includes('out-of-stock') || textContent.includes('ausverkauft')) {
                                availability = 'OUT_OF_STOCK';
                            }

                            const price = this.parsePrice(priceText);
                            const weightGrams = this.parseWeightToGrams(name);

                            listings.push({
                                storeName: this.storeName,
                                storeId: this.storeId,
                                productUrl: href || this.baseUrl,
                                name,
                                price,
                                imageUrl: imgSrc.startsWith('//') ? `https:${imgSrc}` : imgSrc,
                                availability,
                                weightLabel: this.extractWeightLabel(name),
                                weightGrams,
                                pricePerKg: this.computePricePerKg(price, weightGrams),
                                scrapedAt: new Date(),
                            });
                        } catch { }
                    });

                    if (listings.length > 0) break;
                } catch (e: any) {
                    errors.push(`LittleIndia error: ${e.message}`);
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

// lib/scraper/stores/angaadi.ts
// angaadi-online.de — WooCommerce-based Indian/Sri Lankan grocery store in Germany

import * as cheerio from 'cheerio';
import { BaseScraper, ScrapedListing, ScraperResult } from '../base';
import { findCategoryUrl } from '../categoryMap';

export class AngaadiScraper extends BaseScraper {
    storeId = 'angaadi';
    storeName = 'Angaadi Online';
    private baseUrl = 'https://angaadi-online.de';

    async scrape(query: string): Promise<ScraperResult> {
        const start = Date.now();
        const errors: string[] = [];
        const listings: ScrapedListing[] = [];
        const q = query.toLowerCase().trim();

        // ── 1. WooCommerce Store API ──────────────────────────────────────────
        const apiUrls = [
            `${this.baseUrl}/wp-json/wc/store/v1/products?search=${encodeURIComponent(query)}&per_page=20`,
            `${this.baseUrl}/?s=${encodeURIComponent(query)}&post_type=product`,
        ];

        // Try WC Store API first
        try {
            const res = await this.fetchWithRetry(apiUrls[0], {
                headers: { 'Accept': 'application/json' },
                signal: AbortSignal.timeout(8000),
            });
            if (res.ok) {
                const contentType = res.headers.get('content-type') || '';
                if (contentType.includes('json')) {
                    const products = await res.json();
                    for (const item of (Array.isArray(products) ? products : []).slice(0, 20)) {
                        const name = item.name || '';
                        if (!name) continue;
                        const price = parseFloat(item.prices?.price || item.price || '0') / 100; // WC store API returns in minor units
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
        } catch { }

        // ── 2. HTML Search Fallback ───────────────────────────────────────────
        if (listings.length === 0) {
            const htmlUrls: string[] = [
                `${this.baseUrl}/?s=${encodeURIComponent(query)}&post_type=product`,
            ];
            const catPath = findCategoryUrl(q, 'angaadi');
            if (catPath) htmlUrls.push(`${this.baseUrl}${catPath}`);

            for (const url of htmlUrls) {
                try {
                    const res = await fetch(url, {
                        headers: {
                            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0.0.0',
                            'Accept': 'text/html,application/xhtml+xml',
                            'Accept-Language': 'de-DE,de;q=0.9,en;q=0.8',
                        },
                        signal: AbortSignal.timeout(12000),
                    });
                    if (!res.ok) { errors.push(`Angaadi HTTP ${res.status}`); continue; }

                    const html = await res.text();
                    const $ = cheerio.load(html);
                    const found = this.parseWooCommerceHtml($, res.url);
                    listings.push(...found);
                    if (listings.length > 0) break;
                } catch (e: any) {
                    errors.push(`Angaadi HTML error: ${e.message}`);
                }
            }
        }

        return this.buildResult(listings, start, errors);
    }

    private parseWooCommerceHtml($: cheerio.CheerioAPI, currentUrl?: string): ScrapedListing[] {
        const listings: ScrapedListing[] = [];

        // 1. Check if this is a single product page (redirected)
        const singleTitle = $('.product_title').first().text().trim();
        const singlePriceText = $('.woocommerce-Price-amount').first().text().trim();
        if (singleTitle && singlePriceText && currentUrl && currentUrl.includes('/product/')) {
            const priceMatch = singlePriceText.match(/(\d+)[,.](\d{2})/);
            if (priceMatch) {
                const price = parseFloat(`${priceMatch[1]}.${priceMatch[2]}`);
                const imgSrc = $('.woocommerce-product-gallery__image img').first().attr('src') || '';
                const outOfStock = $('.out-of-stock').length > 0;
                const weightGrams = this.parseWeightToGrams(singleTitle);

                listings.push({
                    storeName: this.storeName,
                    storeId: this.storeId,
                    productUrl: currentUrl,
                    name: singleTitle,
                    price,
                    imageUrl: imgSrc,
                    availability: outOfStock ? 'OUT_OF_STOCK' : 'IN_STOCK',
                    weightLabel: this.extractWeightLabel(singleTitle),
                    weightGrams,
                    pricePerKg: this.computePricePerKg(price, weightGrams),
                    scrapedAt: new Date(),
                });
                return listings; // Only one product on this page
            }
        }

        // 2. Otherwise parse as a list
        $('li.product, .product-type-simple, .type-product').slice(0, 20).each((_, el) => {
            try {
                const $el = $(el);
                const name = $el.find('.woocommerce-loop-product__title, h2, h3').first().text().trim();
                if (!name) return;

                // WooCommerce sale price: prefer <ins>, else regular
                let priceText = $el.find('ins .woocommerce-Price-amount').first().text().trim();
                if (!priceText) priceText = $el.find('.woocommerce-Price-amount').first().text().trim();
                if (!priceText) return;

                // Parse "€13,00" or "€12,49"
                const priceMatch = priceText.match(/(\d+)[,.](\d{2})/);
                if (!priceMatch) return;
                const price = parseFloat(`${priceMatch[1]}.${priceMatch[2]}`);

                const href = $el.find('a.woocommerce-LoopProduct-link, a').first().attr('href') || '';
                const imgSrc = $el.find('img').first().attr('src') || $el.find('img').first().attr('data-src') || '';

                const outOfStock = $el.find('[class*="out-of-stock"]').length > 0 || $el.text().toLowerCase().includes('out of stock');
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

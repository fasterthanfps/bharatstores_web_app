// lib/scraper/stores/grocera.ts
// Grocera is a Next.js site — its search page is client-rendered, so we use:
// 1. Their internal product API endpoint (/_next/data or /api/search if available)
// 2. Category page HTML scraping (server-rendered, has product data)
// 3. Wide net search across multiple relevant categories

import * as cheerio from 'cheerio';
import { BaseScraper, ScrapedListing, ScraperResult } from '../base';
import { findCategoryUrl } from '../categoryMap';

export class GroceraScraper extends BaseScraper {
    storeId = 'grocera';
    storeName = 'Grocera';
    private baseUrl = 'https://grocera.de';

    async scrape(query: string): Promise<ScraperResult> {
        const start = Date.now();
        const errors: string[] = [];
        const listings: ScrapedListing[] = [];

        const q = query.toLowerCase().trim();

        // ── 1. Term Normalization ─────────────────────────────────────────────
        // Grocera search for "curd" matches "Curry". We prioritize "dahi" or "yogurt".
        const queriesToTry = [query];
        if (q === 'curd' || q === 'curds') {
            queriesToTry.unshift('dahi', 'yogurt'); // Try better terms first
        }

        for (const qTerm of queriesToTry) {
            // Internal search API try
            const searchApiUrls = [
                `${this.baseUrl}/wp-json/wc/v3/products?search=${encodeURIComponent(qTerm)}&per_page=20&status=publish`,
                `${this.baseUrl}/wp-json/wc/store/v1/products?search=${encodeURIComponent(qTerm)}&per_page=20`,
                `${this.baseUrl}/products.json?q=${encodeURIComponent(qTerm)}`,
            ];

            for (const apiUrl of searchApiUrls) {
                try {
                    const res = await fetch(apiUrl, {
                        headers: {
                            'Accept': 'application/json',
                            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                        },
                        signal: AbortSignal.timeout(8000),
                    });

                    if (!res.ok) continue;

                    const contentType = res.headers.get('content-type') || '';
                    if (!contentType.includes('json')) continue;

                    const data = await res.json();
                    const products = Array.isArray(data) ? data : (data?.products ?? data?.results ?? []);

                    for (const item of products.slice(0, 20)) {
                        const name = item.name || item.title || '';
                        if (!name) continue;

                        // Filtering: if searching curd/dahi, skip Curry products
                        const nameLower = name.toLowerCase();
                        if ((q === 'curd' || q === 'dahi') && nameLower.includes('curry') && !nameLower.includes('curd')) continue;

                        const priceRaw = item.price || item.regular_price || item.sale_price || '0';
                        const price = parseFloat(String(priceRaw).replace(/[^0-9.]/g, ''));

                        const permalink = item.permalink || item.url || '';
                        const imageUrl = item.images?.[0]?.src || item.image?.src || '';
                        const inStock = item.stock_status === 'instock' || item.in_stock !== false;
                        const weightGrams = this.parseWeightToGrams(name);

                        if (name && !isNaN(price)) {
                            listings.push({
                                storeName: this.storeName,
                                storeId: this.storeId,
                                productUrl: permalink || `${this.baseUrl}/search?q=${encodeURIComponent(qTerm)}`,
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
                    }

                    if (listings.length > 0) break;
                } catch { }
            }
            if (listings.length > 0) break;
        }

        // ── 2. Category Fallback ──────────────────────────────────────────────
        if (listings.length === 0) {
            const urlsToTry: string[] = [];
            const categoryPath = findCategoryUrl(q, 'grocera');
            if (categoryPath) urlsToTry.push(`${this.baseUrl}${categoryPath}`);

            // Also infer broad categories
            const broadCategories = this.inferBroadCategories(q);
            for (const catPath of broadCategories) {
                if (!urlsToTry.includes(`${this.baseUrl}${catPath}`)) {
                    urlsToTry.push(`${this.baseUrl}${catPath}`);
                }
            }

            for (const url of urlsToTry) {
                try {
                    const html = await this.fetchHtml(url);
                    const found = this.parseHtml(html, query);
                    if (found.length > 0) {
                        listings.push(...found);
                        break;
                    }
                } catch (e: any) {
                    errors.push(`Grocera HTML error (${url}): ${e.message}`);
                }
            }
        }

        return this.buildResult(listings, start, errors);
    }

    private inferBroadCategories(q: string): string[] {
        const cats: string[] = [];
        if (/lemon|lime|citrus|nimbu/.test(q)) cats.push('/category/fresh-produce', '/category/pickles-condiments');
        if (/curd|yogurt|yoghurt|dahi|lassi|milk|dairy/.test(q)) cats.push('/category/cold-frozen');
        if (/rice|chawal/.test(q)) cats.push('/category/rice-products');
        if (/atta|flour|besan/.test(q)) cats.push('/category/flour-products');
        if (/dal|lentil|bean/.test(q)) cats.push('/category/lentils-beans');
        if (/spice|masala/.test(q)) cats.push('/category/spices');
        return cats;
    }

    private async fetchHtml(url: string): Promise<string> {
        const res = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            },
            signal: AbortSignal.timeout(12000),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
        return res.text();
    }

    private parseHtml(html: string, query: string): ScrapedListing[] {
        const $ = cheerio.load(html);
        const listings: ScrapedListing[] = [];
        const qLower = query.toLowerCase();

        const containerSelectors = ['li.product', 'article', '[class*="product-card"]', '.product'];
        let $cards = $();
        for (const sel of containerSelectors) {
            $cards = $(sel);
            if ($cards.length > 0) break;
        }

        $cards.slice(0, 20).each((_, el) => {
            try {
                const $el = $(el);
                let name = $el.find('h2, h3, h4, [class*="title"]').first().text().trim();
                if (!name) name = $el.find('span').first().text().trim();
                if (!name || name.length < 2) return;

                // Skip Curry for Curd searches in HTML too
                const nameLower = name.toLowerCase();
                if ((qLower === 'curd' || qLower === 'dahi') && nameLower.includes('curry') && !nameLower.includes('curd')) return;

                let priceRaw = '';
                const priceEl = $el.find('[class*="price"], span:contains("€")').first();
                const match = priceEl.text().match(/(\d+)[,.](\d{2})/);
                if (match) priceRaw = `${match[1]}.${match[2]}`;
                if (!priceRaw) return;

                const price = parseFloat(priceRaw);
                const href = $el.find('a[href*="/product/"]').first().attr('href') || $el.find('a').first().attr('href') || '';
                const imgSrc = $el.find('img').first().attr('src') ?? '';

                listings.push({
                    storeName: this.storeName,
                    storeId: this.storeId,
                    productUrl: href.startsWith('http') ? href : `${this.baseUrl}${href}`,
                    name,
                    price,
                    imageUrl: imgSrc,
                    availability: 'IN_STOCK',
                    weightLabel: this.extractWeightLabel(name),
                    weightGrams: this.parseWeightToGrams(name),
                    pricePerKg: this.computePricePerKg(price, this.parseWeightToGrams(name)),
                    scrapedAt: new Date(),
                });
            } catch { }
        });
        return listings;
    }

    private extractWeightLabel(name: string): string | undefined {
        const match = name.match(/\d+(?:[.,]\d+)?\s*(?:g|kg|ml|l|ltr)/i);
        return match?.[0];
    }
}

import { JamoonaScraper } from './stores/jamoona';
import { GroceraScraper } from './stores/grocera';
import { LittleIndiaScraper } from './stores/littleindia';
import { NammamarktScraper } from './stores/nammamarkt';
import { DookanScraper } from './stores/dookan';
import { SwadeshScraper } from './stores/swadesh';
import { AngaadiScraper } from './stores/angaadi';
import { SpiceVillageScraper } from './stores/spicevillage';
import type { ScraperResult } from '@/types/scraper';

export class ScraperOrchestrator {
    private scrapers = [
        new DookanScraper(),       // Shopify — fastest & best coverage
        new JamoonaScraper(),      // Shopify
        new SpiceVillageScraper(), // Shopify
        new NammamarktScraper(),   // Shopify
        new AngaadiScraper(),      // WooCommerce
        new SwadeshScraper(),      // WooCommerce
        new LittleIndiaScraper(),  // WooCommerce
        new GroceraScraper(),      // Custom/Next.js — slowest, last
    ];

    /**
     * Run all scrapers in parallel for a given query.
     * Never throws — errors are captured per-scraper.
     */
    async runAll(query: string): Promise<ScraperResult[]> {
        const results = await Promise.allSettled(
            this.scrapers.map((scraper) => scraper.scrape(query))
        );

        return results.map((result, index) => {
            if (result.status === 'fulfilled') {
                return result.value;
            }
            const scraper = this.scrapers[index];
            return {
                storeId: scraper.storeId,
                storeName: scraper.storeName,
                listings: [],
                durationMs: 0,
                errors: [
                    `Scraper crashed: ${result.reason instanceof Error ? result.reason.message : String(result.reason)}`,
                ],
            } satisfies ScraperResult;
        });
    }

    /**
     * Run a specific set of scrapers by storeId.
     */
    async runSelected(query: string, storeIds: string[]): Promise<ScraperResult[]> {
        const selected = this.scrapers.filter((s) => storeIds.includes(s.storeId));
        if (selected.length === 0) {
            return this.runAll(query);
        }

        const results = await Promise.allSettled(
            selected.map((scraper) => scraper.scrape(query))
        );

        return results.map((result, index) => {
            if (result.status === 'fulfilled') return result.value;
            const scraper = selected[index];
            return {
                storeId: scraper.storeId,
                storeName: scraper.storeName,
                listings: [],
                durationMs: 0,
                errors: [`Scraper crashed: ${String(result.reason)}`],
            } satisfies ScraperResult;
        });
    }
}

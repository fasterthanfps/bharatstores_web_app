import type { ScrapedListing, ScraperResult } from '@/types/scraper';

export type { ScrapedListing, ScraperResult };

export abstract class BaseScraper {
    abstract storeId: string;
    abstract storeName: string;
    abstract scrape(query: string): Promise<ScraperResult>;

    protected parsePrice(raw: string): number {
        // Remove currency symbols, spaces; normalize decimal separator
        const cleaned = raw.replace(/[€$£\s\u00a0]/g, '').replace(',', '.');
        const num = parseFloat(cleaned);
        return isNaN(num) ? 0 : num;
    }

    protected parseWeightToGrams(raw: string): number | undefined {
        if (!raw) return undefined;
        const match = raw.match(/(\d+(?:[.,]\d+)?)\s*(g|kg|ml|l)\b/i);
        if (!match) return undefined;
        const value = parseFloat(match[1].replace(',', '.'));
        const unit = match[2].toLowerCase();
        if (unit === 'kg' || unit === 'l') return Math.round(value * 1000);
        return Math.round(value);
    }

    protected computePricePerKg(price: number, weightGrams?: number): number | undefined {
        if (!weightGrams || weightGrams === 0) return undefined;
        return parseFloat(((price / weightGrams) * 1000).toFixed(2));
    }

    protected buildResult(
        listings: ScrapedListing[],
        start: number,
        errors: string[]
    ): ScraperResult {
        return {
            storeId: this.storeId,
            storeName: this.storeName,
            listings,
            durationMs: Date.now() - start,
            errors,
        };
    }
}

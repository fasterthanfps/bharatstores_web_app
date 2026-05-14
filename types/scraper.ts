export interface ScrapedListing {
    storeName: string;
    storeId: string;
    productUrl: string;
    name: string;
    price: number;
    comparePrice?: number;
    imageUrl?: string;
    availability: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK' | 'UPCOMING' | 'UNKNOWN';
    weightLabel?: string;
    weightGrams?: number;
    pricePerKg?: number;
    scrapedAt: Date;
}

export interface ScraperResult {
    storeId: string;
    storeName: string;
    listings: ScrapedListing[];
    durationMs: number;
    errors: string[];
}

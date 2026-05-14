import type { Tables } from './database';

export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: {
        code: string;
        message: string;
    };
}

export interface SearchResult {
    listings: ListingWithStore[];
    fresh: boolean;
    query: string;
    total: number;
}

export interface ListingWithStore extends Tables<'listings'> {
    store_logo_url?: string | null;
    product_name?: string | null;
    product_slug?: string | null;
    product_category?: string | null;
    search_terms?: string[];
    _score?: number;
}

export interface ComparisonGroup {
    product: Tables<'products'>;
    listings: ListingWithStore[];
    lowestPrice: number;
    highestPrice: number;
}

export interface ClickRequest {
    listingId: string;
    sessionId: string;
}

export interface AlertRequest {
    listingId: string;
    targetPrice: number;
}

export interface ScraperRunResponse {
    success: boolean;
    storesRan: number;
    totalListings: number;
    durationMs: number;
    errors: string[];
}

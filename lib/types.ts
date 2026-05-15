// lib/types.ts — Shared types for BharatStores.eu

export interface Product {
  id: string;
  name: string;
  brand: string;
  category: string;
  weight: string;
  imageUrl: string;
  tags: string[];
}

export interface StorePrice {
  storeName: string;
  storeSlug: string;
  storeInitials: string;
  storeColor: string; // hex
  price: number;
  currency: 'EUR';
  pricePerKg?: number;
  inStock: boolean;
  url: string;
  lastUpdated: Date;
  isBestPrice: boolean;
}

export interface ProductWithPrices extends Product {
  stores: StorePrice[];
  bestPrice: number;
  bestStore: string;
  savings?: number; // vs most expensive
}

export interface ScoredProduct extends ProductWithPrices {
  score: number;
  matchType: 'exact' | 'partial' | 'fuzzy';
}

export type SortOption = 'best' | 'price' | 'pricePerKg' | 'stock';
export type Language = 'en' | 'de';

// LivePricesCard types
export interface LiveStore {
  name: string;
  initials: string;
  color: string;
  price: number;
  isBest: boolean;
}

export interface LiveProduct {
  name: string;
  category: string;
  weight: string;
  image: string;
  stores: LiveStore[];
  isAdded: boolean;
}

// Scraper / Admin types
export type ScraperStatusType = 'online' | 'error' | 'slow';

export interface StoreHealth {
  id: string;
  name: string;
  logoInitials: string;
  color: string;
  status: ScraperStatusType;
  lastScraped: string;
  productCount: number;
  avgResponseMs: number;
  errorRate: number;
  lastErrorMsg?: string;
}

export interface ScraperLog {
  id: string;
  timestamp: string;
  store: string;
  status: 'success' | 'error' | 'warning';
  message: string;
  productCount?: number;
  durationMs?: number;
}

// Search API types
export interface SearchOptions {
  minScore?: number;
  limit?: number;
  storeFilter?: string[];
  inStockOnly?: boolean;
  sortBy?: SortOption;
}

export interface Suggestion {
  term: string;
  storeCount: number;
  category: string;
  topPrice: number;
}

export interface FilterMeta {
  stores: string[];
  priceRange: { min: number; max: number };
  categories: string[];
}

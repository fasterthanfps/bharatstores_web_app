// lib/search/index.ts — Main search engine (re-exports + new typed API)
// Wraps the existing engine.ts with the typed interface from Prompt 7.

import { normalizeQuery, removeStopWords } from './normalize';
import { scoreRelevance, sortByRelevance, splitExactVsRelated } from './engine';
import type { SearchOptions, ScoredProduct } from '@/lib/types';

export { normalizeQuery, removeStopWords };
export { scoreRelevance, sortByRelevance, splitExactVsRelated };
export { getSuggestions } from './suggest';

/**
 * Score a single product against a query.
 * Scoring rules (additive):
 *   +100 exact prefix match
 *   +80  full query substring
 *   +50  all query words found (any order)
 *   +30  brand match
 *   +20  category match
 *   +10  per query word anywhere
 *   -10  out of stock
 *   +5   updated in last 6h
 *   +15  fuzzy Levenshtein ≤2
 */
export function scoreProduct(product: any, query: string): number {
  const q = normalizeQuery(query);
  const SYNONYM_MAP: Record<string, string[]> = {};
  const synonyms = SYNONYM_MAP[q] ?? [];
  return scoreRelevance(product, q, synonyms);
}

/**
 * Search and rank products.
 * Normalises the query, scores all products, filters by minScore,
 * and applies sorting and pagination.
 */
export function searchProducts(
  products: any[],
  query: string,
  opts: SearchOptions = {}
): ScoredProduct[] {
  const { minScore = 1, limit = 100, storeFilter = [], inStockOnly = false, sortBy = 'best' } = opts;

  const q = normalizeQuery(query);
  const SYNONYM_MAP: Record<string, string[]> = {};
  const synonyms = SYNONYM_MAP[q] ?? [];

  // Determine sort column for price-based sorting
  const sortCol = sortBy === 'pricePerKg' ? 'price_per_kg' : 'price';

  let results = sortByRelevance(products, q, synonyms, sortCol)
    .filter((p: any) => (p._score ?? 0) >= minScore);

  // Apply store filter
  if (storeFilter.length > 0) {
    results = results.filter((p: any) =>
      storeFilter.some(s => (p.store_name ?? '').toLowerCase().includes(s.toLowerCase()))
    );
  }

  // Apply in-stock filter
  if (inStockOnly) {
    results = results.filter((p: any) => p.availability === 'IN_STOCK');
  }

  // Apply secondary sort
  if (sortBy === 'price') {
    results.sort((a: any, b: any) => (a.price ?? 0) - (b.price ?? 0));
  } else if (sortBy === 'pricePerKg') {
    results.sort((a: any, b: any) => (a.price_per_kg ?? 999) - (b.price_per_kg ?? 999));
  } else if (sortBy === 'stock') {
    results.sort((a: any, b: any) => {
      const aS = a.availability === 'IN_STOCK' ? 0 : 1;
      const bS = b.availability === 'IN_STOCK' ? 0 : 1;
      return aS - bS;
    });
  }

  return results.slice(0, limit).map((p: any) => ({
    ...p,
    score: p._score ?? 0,
    matchType: (p._score ?? 0) >= 80 ? 'exact' : (p._score ?? 0) >= 50 ? 'partial' : 'fuzzy',
  })) as ScoredProduct[];
}

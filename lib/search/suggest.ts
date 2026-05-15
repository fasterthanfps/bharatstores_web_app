// lib/search/suggest.ts — autocomplete / suggestion logic

import { normalizeQuery, tokenize } from './normalize';
import type { Suggestion } from '@/lib/types';

/**
 * Levenshtein distance between two strings (capped at maxDist for perf).
 */
function levenshtein(a: string, b: string, maxDist = 3): number {
  if (Math.abs(a.length - b.length) > maxDist) return maxDist + 1;
  const m = a.length, n = b.length;
  const dp: number[] = Array.from({ length: n + 1 }, (_, i) => i);
  for (let i = 1; i <= m; i++) {
    let prev = i;
    for (let j = 1; j <= n; j++) {
      const val = a[i - 1] === b[j - 1] ? dp[j - 1] : Math.min(dp[j - 1], dp[j], prev) + 1;
      dp[j - 1] = prev;
      prev = val;
    }
    dp[n] = prev;
  }
  return dp[n];
}

/**
 * Get autocomplete suggestions for a query.
 * Returns up to 6 deduplicated results ordered by match quality.
 */
export function getSuggestions(query: string, allProducts: any[]): Suggestion[] {
  const q = normalizeQuery(query.trim());
  if (!q || q.length < 2) return [];

  const qTokens = tokenize(q);

  type Candidate = { term: string; category: string; price: number; storeSet: Set<string>; priority: number };
  const seen = new Map<string, Candidate>();

  for (const product of allProducts) {
    const rawName: string = product.product_name ?? product.name ?? '';
    const norm = normalizeQuery(rawName);
    const category: string = product.product_category ?? product.category ?? 'general';
    const price: number = product.price ?? product.bestPrice ?? 0;
    const store: string = product.store_name ?? product.storeName ?? '';

    // Score the match
    let priority = 0;

    if (norm.startsWith(q)) {
      priority = 100; // exact prefix
    } else if (norm.includes(q)) {
      priority = 80; // substring
    } else {
      // Token-level: all query tokens present?
      const normTokens = tokenize(norm);
      const allFound = qTokens.every(qt => normTokens.some(nt => nt.startsWith(qt)));
      if (allFound) {
        priority = 60;
      } else {
        // Fuzzy: check per-token Levenshtein
        const anyFuzzy = qTokens.some(qt =>
          normTokens.some(nt => levenshtein(qt, nt, 2) <= 2)
        );
        if (anyFuzzy) priority = 30;
      }
    }

    if (priority === 0) continue;

    // Deduplicate by normalised name
    const key = norm.slice(0, 40);
    const existing = seen.get(key);
    if (existing) {
      if (priority > existing.priority) existing.priority = priority;
      existing.storeSet.add(store);
      if (price > 0 && price < existing.price) existing.price = price;
    } else {
      seen.set(key, { term: rawName, category, price, storeSet: new Set(store ? [store] : []), priority });
    }
  }

  return [...seen.values()]
    .sort((a, b) => b.priority - a.priority || a.price - b.price)
    .slice(0, 6)
    .map(c => ({
      term: c.term,
      storeCount: c.storeSet.size,
      category: c.category,
      topPrice: c.price,
    }));
}

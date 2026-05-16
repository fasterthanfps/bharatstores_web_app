// lib/search/normalize.ts — text normalization for search queries

const TRANSLITERATIONS: Record<string, string> = {
  'dal': 'daal',
  'ghee': 'ghi',
  'atta': 'aata',
  'chai': 'chay',
  'paneer': 'panir',
  'halwa': 'halva',
};

const ABBREVIATIONS: Record<string, string> = {
  ' kg ': ' kilogramm ',
  ' g ':  ' gramm ',
  ' ml ': ' milliliter ',
  ' l ':  ' liter ',
};

const STOP_WORDS = new Set([
  'and', 'or', 'the', 'a', 'an', 'in', 'on', 'at', 'to', 'for',
  'of', 'with', 'by', 'from', 'up', 'about', 'into', 'through',
  'und', 'oder', 'der', 'die', 'das', 'ein', 'eine',
]);

/**
 * Normalise a search query for indexing & comparison.
 * - Lowercase
 * - Remove diacritics (é→e, ü→u, ä→a, ö→o, ß→ss)
 * - Expand abbreviations
 * - Handle common transliterations
 * - Trim whitespace
 */
export function normalizeQuery(q: string): string {
  let result = q.toLowerCase().trim();

  // Diacritics / German umlauts
  result = result
    .replace(/ä/g, 'a')
    .replace(/ö/g, 'o')
    .replace(/ü/g, 'u')
    .replace(/ß/g, 'ss')
    .replace(/é/g, 'e')
    .replace(/è/g, 'e')
    .replace(/ê/g, 'e')
    .replace(/à/g, 'a')
    .replace(/â/g, 'a')
    .replace(/î/g, 'i')
    .replace(/ï/g, 'i')
    .replace(/ô/g, 'o')
    .replace(/û/g, 'u')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  // Expand abbreviations (with spaces around to avoid false positives)
  result = ` ${result} `;
  for (const [abbr, expanded] of Object.entries(ABBREVIATIONS)) {
    result = result.replaceAll(abbr, ` ${expanded} `);
  }
  result = result.trim().replace(/\s+/g, ' ');

  // Transliterations
  for (const [from, to] of Object.entries(TRANSLITERATIONS)) {
    const re = new RegExp(`\\b${from}\\b`, 'g');
    result = result.replace(re, to);
  }

  return result.trim();
}

/**
 * Remove stop words from a query for indexing purposes.
 * The original query (with stop words) should still be shown to the user.
 */
export function removeStopWords(q: string): string {
  return q
    .split(/\s+/)
    .filter(w => !STOP_WORDS.has(w.toLowerCase()))
    .join(' ')
    .trim();
}

/**
 * Tokenise a string into meaningful words (≥ 2 chars, no noise).
 */
export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(t => t.length >= 2);
}

/**
 * Smartly simplifies a query for scraping.
 * Removes weights, dates, sale tags, and limits length.
 */
export function smartTruncateQuery(q: string): string {
  if (!q) return '';
  
  let cleaned = q.toLowerCase();
  
  // 1. Remove BBD / Expiry info
  cleaned = cleaned.replace(/\[bbd:?[^\]]+\]/gi, '');
  cleaned = cleaned.replace(/expiry:?[^\])]+/gi, '');
  
  // 2. Remove Sale tags
  cleaned = cleaned.replace(/-\s*sale\s*item/gi, '');
  cleaned = cleaned.replace(/sale!/gi, '');
  
  // 3. Remove weights in parentheses or at the end
  // (100g), (1kg), 500ml, 1 kg, etc.
  cleaned = cleaned.replace(/\(\d+\s*(g|kg|ml|l|oz|lb|pc|pcs|pack)\)/gi, '');
  cleaned = cleaned.replace(/\b\d+\s*(g|kg|ml|l|oz|lb|pc|pcs|pack)\b/gi, '');
  
  // 4. Remove special characters but keep spaces
  cleaned = cleaned.replace(/[^a-z0-9\s/]/g, ' ');
  
  // 5. Split and filter noise
  const tokens = cleaned.split(/[\s/]+/).filter(t => {
    // Keep words that aren't just single letters (unless they are important like 'a' in 'vitamin a', but for food mostly no)
    // Actually, keep 2+ chars
    if (t.length < 2) return false;
    
    // Filter out very common noise words for scraping
    const noise = ['item', 'sale', 'new', 'fresh', 'best', 'quality', 'premium', 'pure', 'authentic'];
    if (noise.includes(t)) return false;
    
    return true;
  });
  
  // 6. Truncate to first 5-6 core descriptive words
  // Too many words makes the store's internal search engine fail
  const truncated = tokens.slice(0, 6).join(' ');
  
  return truncated || q; // Fallback to original if we cleaned everything away
}

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

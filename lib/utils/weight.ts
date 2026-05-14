/**
 * Parse a weight string like "5kg", "500g", "1l", "750ml" into grams.
 * Returns undefined if no valid weight string is found.
 */
export function parseWeightToGrams(raw: string): number | undefined {
    if (!raw) return undefined;
    const match = raw.match(/(\d+(?:[.,]\d+)?)\s*(g|kg|ml|l)\b/i);
    if (!match) return undefined;
    const value = parseFloat(match[1].replace(',', '.'));
    const unit = match[2].toLowerCase();
    if (unit === 'kg' || unit === 'l') return Math.round(value * 1000);
    return Math.round(value);
}

/**
 * Format a weight in grams to a human-readable string.
 */
export function formatWeight(grams: number): string {
    if (grams >= 1000) {
        const kg = grams / 1000;
        return kg % 1 === 0 ? `${kg}kg` : `${kg.toFixed(1)}kg`;
    }
    return `${grams}g`;
}

/**
 * Compute price per kilogram.
 */
export function computePricePerKg(price: number, weightGrams?: number): number | undefined {
    if (!weightGrams || weightGrams === 0) return undefined;
    return parseFloat(((price / weightGrams) * 1000).toFixed(2));
}

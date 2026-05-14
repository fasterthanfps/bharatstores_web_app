/** Format a number as EUR currency (German locale) */
export function formatEUR(amount: number): string {
    return new Intl.NumberFormat('de-DE', {
        style: 'currency',
        currency: 'EUR',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(amount);
}

/** Format a price with optional sale state */
export function formatPrice(
    price: number,
    comparePrice?: number | null
): { formatted: string; compareFormatted?: string; isOnSale: boolean } {
    return {
        formatted: formatEUR(price),
        compareFormatted: comparePrice ? formatEUR(comparePrice) : undefined,
        isOnSale: !!comparePrice && comparePrice > price,
    };
}

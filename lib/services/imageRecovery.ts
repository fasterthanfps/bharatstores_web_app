import { getProductPlaceholder } from '../utils/image';

/**
 * Image Recovery Service
 * Resolves missing product images to standard category-specific placeholders.
 */
export function getProductImage(productName: string, productSlug: string, category: string | null): string {
  return getProductPlaceholder(category || undefined, productName);
}

/**
 * Resolves the appropriate fallback placeholder image for a product
 * based on its category or product name.
 */
export function getProductPlaceholder(category?: string, name?: string): string {
  const categoryLower = category?.toLowerCase() || '';
  const nameLower = name?.toLowerCase() || '';

  // Spices, masala, powdered ingredients check
  if (
    categoryLower.includes('spice') ||
    categoryLower.includes('masala') ||
    categoryLower.includes('powder') ||
    nameLower.includes('masala') ||
    nameLower.includes('spice') ||
    nameLower.includes('powder') ||
    nameLower.includes('chilli') ||
    nameLower.includes('haldi') ||
    nameLower.includes('turmeric') ||
    nameLower.includes('coriander') ||
    nameLower.includes('cumin') ||
    nameLower.includes('jeera') ||
    nameLower.includes('masale') ||
    nameLower.includes('hing') ||
    nameLower.includes('cardamom') ||
    nameLower.includes('mustard') ||
    nameLower.includes('curry')
  ) {
    return '/masala_placeholder.png';
  }

  // General fallback for all other categories
  return '/generic_placeholder.png';
}

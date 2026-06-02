const SPICES_PLACEHOLDER_SVG = `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200' width='100%' height='100%'>
  <rect width='100%' height='100%' fill='%23FAF7F2'/>
  <circle cx='20' cy='20' r='1' fill='%23D4C5B0' opacity='0.4'/>
  <circle cx='180' cy='20' r='1' fill='%23D4C5B0' opacity='0.4'/>
  <circle cx='20' cy='180' r='1' fill='%23D4C5B0' opacity='0.4'/>
  <circle cx='180' cy='180' r='1' fill='%23D4C5B0' opacity='0.4'/>
  <circle cx='100' cy='100' r='60' fill='%238B2020' opacity='0.03'/>
  <g transform='translate(10, 10)'>
    <path d='M 65 110 C 65 135, 115 135, 115 110' fill='none' stroke='%238B2020' stroke-width='4.5' stroke-linecap='round'/>
    <line x1='50' y1='110' x2='130' y2='110' stroke='%238B2020' stroke-width='4.5' stroke-linecap='round'/>
    <path d='M 110 70 L 80 115' stroke='%23C84B31' stroke-width='7' stroke-linecap='round'/>
    <path d='M 135 75 L 135 85 M 130 80 L 140 80' stroke='%23C84B31' stroke-width='2' stroke-linecap='round'/>
    <path d='M 50 85 L 50 93 M 46 89 L 54 89' stroke='%23C84B31' stroke-width='2' stroke-linecap='round'/>
    <path d='M 90 55 L 90 61 M 87 58 L 93 58' stroke='%238B2020' stroke-width='2' stroke-linecap='round'/>
    <path d='M 125 115 C 135 110, 145 120, 135 130 C 125 125, 120 120, 125 115 Z' fill='%231A7A4A' fill-opacity='0.15' stroke='%231A7A4A' stroke-width='2.5' stroke-linejoin='round'/>
    <path d='M 125 115 L 133 123' stroke='%231A7A4A' stroke-width='2' stroke-linecap='round'/>
  </g>
  <text x='100' y='165' font-family='Fraunces, Georgia, serif' font-size='11' font-weight='bold' fill='%238B2020' letter-spacing='1.5' text-anchor='middle' opacity='0.75'>AUTHENTIC SPICES</text>
</svg>`;

const GENERIC_PLACEHOLDER_SVG = `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200' width='100%' height='100%'>
  <rect width='100%' height='100%' fill='%23FAF7F2'/>
  <circle cx='20' cy='20' r='1' fill='%23D4C5B0' opacity='0.4'/>
  <circle cx='180' cy='20' r='1' fill='%23D4C5B0' opacity='0.4'/>
  <circle cx='20' cy='180' r='1' fill='%23D4C5B0' opacity='0.4'/>
  <circle cx='180' cy='180' r='1' fill='%23D4C5B0' opacity='0.4'/>
  <circle cx='100' cy='100' r='60' fill='%236B5E52' opacity='0.03'/>
  <g transform='translate(10, 10)'>
    <path d='M 65 80 L 115 80 L 123 135 L 57 135 Z' fill='none' stroke='%236B5E52' stroke-width='4.5' stroke-linejoin='round' stroke-linecap='round'/>
    <path d='M 80 80 C 80 65, 100 65, 100 80' fill='none' stroke='%239C8E84' stroke-width='4' stroke-linecap='round'/>
    <path d='M 135 85 L 135 91 M 132 88 L 138 88' stroke='%239C8E84' stroke-width='2' stroke-linecap='round'/>
    <path d='M 50 110 L 50 116 M 47 113 L 53 113' stroke='%239C8E84' stroke-width='2' stroke-linecap='round'/>
  </g>
  <text x='100' y='165' font-family='DM Sans, sans-serif' font-size='10' font-weight='800' fill='%236B5E52' letter-spacing='1.5' text-anchor='middle' opacity='0.6'>BHARATSTORES</text>
</svg>`;

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
    return SPICES_PLACEHOLDER_SVG;
  }

  // General fallback for all other categories
  return GENERIC_PLACEHOLDER_SVG;
}


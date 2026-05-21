import fs from 'fs';
import path from 'path';

/**
 * Image Recovery Service
 * Dynamically resolves missing product images.
 * Tier 1: Lexical cross-store image synthesis (handled in search engine).
 * Tier 2: Server-level premium vector product mockup generator cached locally.
 */
export function getProductImage(productName: string, productSlug: string, category: string | null): string {
  try {
    const publicDir = path.join(process.cwd(), 'public');
    const genDir = path.join(publicDir, 'generated-images');
    
    // Ensure directories exist
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }
    if (!fs.existsSync(genDir)) {
      fs.mkdirSync(genDir, { recursive: true });
    }

    const filename = `${productSlug}.svg`;
    const filepath = path.join(genDir, filename);
    const publicPath = `/generated-images/${filename}`;

    // Return cached image if it already exists
    if (fs.existsSync(filepath)) {
      return publicPath;
    }

    // Generate fresh, realistic AI mockup packaging
    const svgContent = generateProductSVG(productName, category);
    fs.writeFileSync(filepath, svgContent, 'utf-8');
    
    console.log(`[Image Recovery] Cached dynamic mockup generated for: ${productName} (${publicPath})`);
    return publicPath;
  } catch (error) {
    console.error('[Image Recovery] Failed to resolve product image:', error);
    return '/images/placeholder.svg'; // Fallback
  }
}

/**
 * Dynamically parses brand name from a product name
 */
function detectBrand(name: string): string {
  const normalized = name.toLowerCase();
  const brands = [
    'mdh', 'everest', 'kissan', 'trs', 'haldiram', 'ashoka', 'patanjali',
    'aashirvaad', 'heera', 'amul', 'kohinoor', 'maggi', 'fortune', 'pillsbury',
    'dabur', 'tata', 'britannica', 'adisha', 'tirupati'
  ];
  for (const brand of brands) {
    if (normalized.includes(brand)) {
      return brand.toUpperCase();
    }
  }
  return 'BHARAT'; // Default premium brand tag
}

/**
 * Detects product size or weight (e.g. 100g, 1kg)
 */
function detectWeight(name: string): string {
  const match = name.match(/(\d+(?:\.\d+)?\s*(?:g|gm|kg|ml|l|oz|lb|pc|pcs|pack))/i);
  return match ? match[1].toUpperCase() : '';
}

/**
 * Formulates detailed aesthetic visual properties based on product category & name
 */
interface PackagingTheme {
  primaryGradient: string;
  accentColor: string;
  bgColor: string;
  shadowColor: string;
  iconPath: string;
  bgPatterns: string;
}

function getPackagingTheme(name: string, category: string | null): PackagingTheme {
  const n = name.toLowerCase();
  const c = (category || '').toLowerCase();

  // Spices & Masalas (Red / Deep Saffron theme)
  if (n.includes('masala') || n.includes('chili') || n.includes('pepper') || n.includes('powder') || c.includes('spices') || n.includes('spices') || n.includes('jeera') || n.includes('haldi')) {
    return {
      primaryGradient: 'linear-gradient(135deg, #d32f2f 0%, #ff6f00 100%)',
      accentColor: '#ffe082',
      bgColor: '#fff8e1',
      shadowColor: 'rgba(211, 47, 47, 0.25)',
      // Spice Bowl Vector
      iconPath: `
        <path d="M12 4c-3.87 0-7 3.13-7 7h14c0-3.87-3.13-7-7-7z" fill="#ffe082"/>
        <path d="M2 13v2c0 2.2 1.8 4 4 4h12c2.2 0 4-1.8 4-4v-2H2zm10 4.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="#ffb300"/>
        <circle cx="12" cy="15" r="1.5" fill="#d32f2f"/>
      `,
      bgPatterns: `
        <circle cx="20" cy="20" r="15" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="2"/>
        <circle cx="200" cy="180" r="25" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="2"/>
      `
    };
  }

  // Wheat & Flour (Chakki Gold / Warm Amber theme)
  if (n.includes('atta') || n.includes('flour') || n.includes('wheat') || n.includes('maida') || n.includes('sooji') || c.includes('flour') || c.includes('grains')) {
    return {
      primaryGradient: 'linear-gradient(135deg, #e65100 0%, #ffb300 100%)',
      accentColor: '#fff8e1',
      bgColor: '#faf0d0',
      shadowColor: 'rgba(230, 81, 0, 0.25)',
      // Wheat Stalk Vector
      iconPath: `
        <path d="M12 2c0 0-2 3-2 6s2 6 2 6 2-3 2-6-2-6-2-6z" fill="#fff8e1"/>
        <path d="M8 8c0 0-2 2-2 4s2 4 2 4 2-2 2-4-2-4-2-4zm8 0c0 0-2 2-2 4s2 4 2 4 2-2 2-4-2-4-2-4z" fill="#ffe082"/>
        <path d="M12 14v8" stroke="#ffb300" stroke-width="2.5" stroke-linecap="round"/>
        <path d="M9 16l3 2m3-2l-3 2" stroke="#ffb300" stroke-width="2" stroke-linecap="round"/>
      `,
      bgPatterns: `
        <path d="M0,40 Q50,60 100,40 T200,40" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="2"/>
        <path d="M0,80 Q50,100 100,80 T200,80" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="2"/>
      `
    };
  }

  // Rice (Pure Basmati / Emerald Forest theme)
  if (n.includes('rice') || n.includes('basmati') || n.includes('chawal') || c.includes('rice')) {
    return {
      primaryGradient: 'linear-gradient(135deg, #004d40 0%, #00897b 100%)',
      accentColor: '#b2dfdb',
      bgColor: '#e0f2f1',
      shadowColor: 'rgba(0, 77, 64, 0.25)',
      // Steaming Rice Bowl
      iconPath: `
        <path d="M4 12c0 4.42 3.58 8 8 8s8-3.58 8-8H4z" fill="#e0f2f1"/>
        <path d="M12 3c-.55 0-1 .45-1 1v2c0 .55.45 1 1 1s1-.45 1-1V4c0-.55-.45-1-1-1zm-4 2c-.55 0-1 .45-1 1v1c0 .55.45 1 1 1s1-.45 1-1V6c0-.55-.45-1-1-1zm8 0c-.55 0-1 .45-1 1v1c0 .55.45 1 1 1s1-.45 1-1V6c0-.55-.45-1-1-1z" fill="#b2dfdb"/>
        <rect x="3" y="10" width="18" height="2" rx="1" fill="#80cbc4"/>
      `,
      bgPatterns: `
        <line x1="0" y1="20" x2="220" y2="20" stroke="rgba(255,255,255,0.05)" stroke-width="1" stroke-dasharray="5 5"/>
        <line x1="0" y1="180" x2="220" y2="180" stroke="rgba(255,255,255,0.05)" stroke-width="1" stroke-dasharray="5 5"/>
      `
    };
  }

  // Lentils & Pulses (Warm Amber / Harvest Green theme)
  if (n.includes('dal') || n.includes('lentil') || n.includes('moong') || n.includes('toor') || n.includes('chana') || c.includes('dal')) {
    return {
      primaryGradient: 'linear-gradient(135deg, #2e7d32 0%, #76ff03 100%)',
      accentColor: '#ccff90',
      bgColor: '#f1f8e9',
      shadowColor: 'rgba(46, 125, 50, 0.25)',
      // Plant Sprout Vector
      iconPath: `
        <path d="M12 22V10" stroke="#a7ffeb" stroke-width="3" stroke-linecap="round"/>
        <path d="M12 10c0 0-4-1-4-4s3-3 4-1c1-2 4-2 4 1s-4 4-4 4z" fill="#ccff90"/>
        <path d="M12 14c0 0-3-1-3-3s2-2 3-1c1-1 3-1 3 1s-3 3-3 3z" fill="#b2ff59"/>
      `,
      bgPatterns: `
        <circle cx="110" cy="110" r="80" fill="none" stroke="rgba(255,255,255,0.04)" stroke-width="4"/>
      `
    };
  }

  // Dairy & Ghee (Creamy Butter & Royal Gold theme)
  if (n.includes('ghee') || n.includes('butter') || n.includes('paneer') || n.includes('dairy') || c.includes('dairy')) {
    return {
      primaryGradient: 'linear-gradient(135deg, #ff8f00 0%, #ffeb3b 100%)',
      accentColor: '#4e342e',
      bgColor: '#fffde7',
      shadowColor: 'rgba(255, 143, 0, 0.25)',
      // Ghee Jar / Butter icon
      iconPath: `
        <path d="M6 8h12v11c0 1.1-.9 2-2 2H8c-1.1 0-2-.9-2-2V8z" fill="#fffde7"/>
        <path d="M8 3h8v3H8z" fill="#ffd54f"/>
        <rect x="5" y="6" width="14" height="2" rx="1" fill="#ffb300"/>
        <circle cx="12" cy="14" r="3" fill="#ffb300"/>
      `,
      bgPatterns: `
        <circle cx="20" cy="20" r="10" fill="rgba(255,255,255,0.05)"/>
        <circle cx="200" cy="40" r="30" fill="rgba(255,255,255,0.05)"/>
      `
    };
  }

  // Tea, Coffee & Beverages (Spiced Masala Brown theme)
  if (n.includes('tea') || n.includes('chai') || n.includes('coffee') || c.includes('tea') || n.includes('beverage')) {
    return {
      primaryGradient: 'linear-gradient(135deg, #4e342e 0%, #8d6e63 100%)',
      accentColor: '#ffd54f',
      bgColor: '#efebe9',
      shadowColor: 'rgba(78, 52, 46, 0.25)',
      // Steaming Teacup
      iconPath: `
        <path d="M2 10h16a1 1 0 011 1v6a5 5 0 01-5 5H8a5 5 0 01-5-5v-6a1 1 0 011-1z" fill="#ffd54f"/>
        <path d="M18 12c1.7 0 3 1.3 3 3s-1.3 3-3 3v-6z" fill="#ffd54f"/>
        <path d="M6 3c0 0 1 1 1 2s-1 2-1 2m4-4c0 0 1 1 1 2s-1 2-1 2m4-4c0 0 1 1 1 2s-1 2-1 2" stroke="#efebe9" stroke-width="2" stroke-linecap="round" fill="none"/>
      `,
      bgPatterns: `
        <path d="M0,0 L200,200 M200,0 L0,200" stroke="rgba(255,255,255,0.03)" stroke-width="1"/>
      `
    };
  }

  // Default: Royal Blue premium design
  return {
    primaryGradient: 'linear-gradient(135deg, #1565c0 0%, #1e88e5 100%)',
    accentColor: '#bbdefb',
    bgColor: '#e3f2fd',
    shadowColor: 'rgba(21, 101, 192, 0.25)',
    // Premium Verified Quality Emblem
    iconPath: `
      <polygon points="12,2 15,9 22,9 17,14 19,21 12,17 5,21 7,14 2,9 9,9" fill="#ffd54f"/>
      <circle cx="12" cy="12" r="3" fill="#1565c0"/>
    `,
    bgPatterns: `
      <circle cx="110" cy="110" r="90" fill="none" stroke="rgba(255,255,255,0.05)" stroke-width="1"/>
      <circle cx="110" cy="110" r="70" fill="none" stroke="rgba(255,255,255,0.05)" stroke-width="1"/>
    `
  };
}

/**
 * Generates beautiful, responsive, and studio-quality SVG product package mockup
 */
function generateProductSVG(productName: string, category: string | null): string {
  const brandName = detectBrand(productName);
  const weight = detectWeight(productName);
  const theme = getPackagingTheme(productName, category);

  // Clean long product names to fit gracefully in the package front label
  let displayTitle = productName.replace(new RegExp(brandName, 'gi'), '').trim();
  displayTitle = displayTitle.replace(/[\d\.]+\s*(?:g|gm|kg|ml|l|oz|lb|pc|pcs|pack)/i, '').replace(/[-\(\)]/g, ' ').replace(/\s+/g, ' ').trim();
  if (displayTitle.length > 32) {
    displayTitle = displayTitle.slice(0, 30) + '...';
  }

  // Capitalize title
  displayTitle = displayTitle.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 220 220" width="100%" height="100%" style="border-radius: 1.5rem; background-color: ${theme.bgColor};">
      <defs>
        <!-- Box Shadow -->
        <filter id="pack-shadow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="8" stdDeviation="6" flood-color="${theme.shadowColor}" flood-opacity="0.8"/>
        </filter>
        
        <!-- Plastic reflection highlights -->
        <linearGradient id="highlight" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="white" stop-opacity="0.4"/>
          <stop offset="30%" stop-color="white" stop-opacity="0.1"/>
          <stop offset="70%" stop-color="black" stop-opacity="0.0"/>
          <stop offset="100%" stop-color="white" stop-opacity="0.15"/>
        </linearGradient>

        <linearGradient id="brand-grad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#ffd54f"/>
          <stop offset="100%" stop-color="#ffb300"/>
        </linearGradient>
      </defs>

      <!-- Background studio shadow -->
      <radialGradient id="studio-bg" cx="50%" cy="80%" r="60%" fx="50%" fy="80%">
        <stop offset="0%" stop-color="rgba(0,0,0,0.06)"/>
        <stop offset="100%" stop-color="rgba(0,0,0,0)"/>
      </radialGradient>
      <rect x="0" y="0" width="220" height="220" fill="url(#studio-bg)"/>

      <!-- 3D PACKAGE STAND-UP POUCH / BOX DESIGN -->
      <g filter="url(#pack-shadow)">
        <!-- Pouch Main Body -->
        <path d="M45,28 L175,28 Q185,28 180,45 L165,180 Q160,192 110,192 Q60,192 55,180 L35,45 Q30,28 45,28 Z" fill="${theme.primaryGradient}"/>

        <!-- 3D Pouch Side Flaps for visual depth -->
        <path d="M35,45 L50,45 L40,180 L35,45 Z" fill="rgba(0,0,0,0.1)"/>
        <path d="M185,45 L170,45 L180,180 L185,45 Z" fill="rgba(255,255,255,0.08)"/>

        <!-- Top Pouch Seal / Flange -->
        <path d="M42,22 L178,22 Q183,22 181,28 L39,28 Q37,22 42,22 Z" fill="rgba(0,0,0,0.15)"/>
        
        <!-- Pouch Bottom fold -->
        <path d="M55,180 Q110,192 165,180 Q160,194 110,194 Q60,194 55,180 Z" fill="rgba(0,0,0,0.2)"/>
      </g>

      <!-- Category specific geometric patterns -->
      <g>${theme.bgPatterns}</g>

      <!-- FRONT LABEL PANEL -->
      <g transform="translate(10, 0)">
        <!-- Brand Header Bar -->
        <rect x="65" y="45" width="70" height="15" rx="3" fill="#ffffff" opacity="0.95"/>
        <text x="100" y="56" font-family="'Inter', sans-serif" font-weight="900" font-size="8.5" fill="#333" text-anchor="middle" letter-spacing="1">
          ${brandName}
        </text>

        <!-- Dynamic Category Vector Icon -->
        <g transform="translate(88, 70) scale(1.0)">
          ${theme.iconPath}
        </g>

        <!-- Product Display Title (Elegant Wrap or scale) -->
        <text x="100" y="132" font-family="'Outfit', 'Inter', sans-serif" font-weight="900" font-size="8.5" fill="#ffffff" text-anchor="middle" letter-spacing="0.2">
          ${displayTitle}
        </text>

        <!-- Premium Quality Badge -->
        <g transform="translate(100, 148)">
          <rect x="-35" y="-6" width="70" height="10" rx="5" fill="rgba(255,255,255,0.15)"/>
          <text x="0" y="2" font-family="'Inter', sans-serif" font-weight="800" font-size="5.5" fill="${theme.accentColor}" text-anchor="middle" letter-spacing="0.5">
            AUTHENTIC PRODUCT
          </text>
        </g>
        
        <!-- Weight badge at the bottom -->
        ${weight ? `
          <g transform="translate(100, 168)">
            <rect x="-18" y="-6" width="36" height="11" rx="4" fill="url(#brand-grad)"/>
            <text x="0" y="2.5" font-family="'Inter', sans-serif" font-weight="900" font-size="6.5" fill="#111" text-anchor="middle">
              ${weight}
            </text>
          </g>
        ` : ''}
      </g>

      <!-- Plastic foil gloss overlay for realism -->
      <path d="M45,28 L175,28 Q185,28 180,45 L165,180 Q160,192 110,192 Q60,192 55,180 L35,45 Q30,28 45,28 Z" fill="url(#highlight)" pointer-events="none"/>
    </svg>
  `;
}

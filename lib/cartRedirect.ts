// lib/cartRedirect.ts — Build pre-filled cart URLs for Shopify stores

import { buildUTMUrl } from './utm';

const STORE_BASE_URLS: Record<string, string> = {
  dookan:       'https://www.dookan.de',
  jamoona:      'https://www.jamoona.de',
  swadesh:      'https://www.swadesh.de',
  nammamarkt:   'https://www.nammamarkt.com',
  angaadi:      'https://www.angaadi.de',
  littleindia:  'https://www.little-india.de',
  spicevillage: 'https://www.spicevillage.eu',
  grocera:      'https://www.grocera.de',
};

export interface CartItem {
  productId: string;      // our internal ID — NEVER send to stores
  productName: string;    // human-readable — safe to use in search
  storeSlug: string;
  storeHandle?: string;   // store's own product slug from URL
  variantId?: string;     // Shopify variant ID
  quantity: number;
  url: string;            // full product URL from scraper
}

export interface CartRedirectResult {
  url: string;
  method: 'direct_url' | 'shopify_cart' | 'shopify_search' | 'product_page' | 'manual';
  confidence: 'high' | 'medium' | 'low';
  note?: string;
}

/**
 * Build a pre-filled cart redirect URL for a store.
 * STRATEGY:
 * 1. Shopify /cart/ URL with variant IDs (best)
 * 2. Direct product URL if single item (very reliable)
 * 3. Store-specific handle (Shopify /products/HANDLE)
 * 4. Fallback search by product name
 */
export function buildCartUrl(storeSlug: string, items: CartItem[]): CartRedirectResult {
  const baseUrl = STORE_BASE_URLS[storeSlug.toLowerCase().replace(/\s+/g, '')];
  if (!baseUrl || items.length === 0) {
    return { url: '#', method: 'manual', confidence: 'low', note: 'Unknown store' };
  }

  const utm = { source: storeSlug, medium: 'cart_redirect', campaign: 'smart_cart', content: storeSlug };

  // STRATEGY 1 (best): Use Shopify /cart/ URL with variant IDs
  // All items must have variantId for this to work
  const itemsWithVariants = items.filter(i => i.variantId);
  if (itemsWithVariants.length === items.length && items.length > 0) {
    const cartPath = items.map(i => `${i.variantId}:${i.quantity}`).join(',');
    return {
      url: buildUTMUrl(`${baseUrl}/cart/${cartPath}`, utm),
      method: 'shopify_cart',
      confidence: 'high',
    };
  }

  // STRATEGY 2 (good): If single item, go directly to the product page URL
  // (the exact URL we scraped from the store — most reliable)
  if (items.length === 1 && items[0].url) {
    const productUrl = items[0].url;
    // Verify it's the same domain to prevent open redirect
    try {
      const urlObj = new URL(productUrl);
      const baseUrlObj = new URL(baseUrl);
      // Allow matches on main domain or subdomains
      if (urlObj.hostname.includes(baseUrlObj.hostname.replace('www.', ''))) {
        return {
          url: buildUTMUrl(productUrl, utm),
          method: 'direct_url',
          confidence: 'high',
        };
      }
    } catch {}
  }

  // STRATEGY 3 (okay): Use storeHandle in Shopify products URL
  if (items.length === 1 && items[0].storeHandle) {
    return {
      url: buildUTMUrl(`${baseUrl}/products/${items[0].storeHandle}`, utm),
      method: 'product_page',
      confidence: 'medium',
    };
  }

  // STRATEGY 4 (fallback): Search using PRODUCT NAME — NOT productId UUID
  // Use productName which is human-readable
  const searchQuery = encodeURIComponent(items[0].productName);
  return {
    url: buildUTMUrl(`${baseUrl}/search?q=${searchQuery}`, utm),
    method: 'shopify_search',
    confidence: 'low',
    note: 'Direct cart unavailable — searching by product name',
  };
}

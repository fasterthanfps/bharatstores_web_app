// lib/cartRedirect.ts — Build pre-filled cart URLs for Shopify stores

import { buildUTMUrl } from './utm';

export interface CartRedirectResult {
  url: string | null;
  method: 'shopify_cart' | 'query_params' | 'manual';
  note?: string;
}

const STORE_BASE_URLS: Record<string, string> = {
  dookan: 'https://dookan.de',
  jamoona: 'https://jamoona.com',
  swadesh: 'https://swadesh.de',
  nammamarkt: 'https://nammamarkt.com',
  angaadi: 'https://angaadi.de',
  littleindia: 'https://little-india.de',
  spicevillage: 'https://spicevillage.eu',
  grocera: 'https://grocera.de',
};

/**
 * Build a pre-filled cart redirect URL for a Shopify store.
 * If variantIds are available: /cart/VARIANT_ID:QTY,VARIANT_ID:QTY
 * Fallback: /search?q=first_item_handle
 */
export function buildCartUrl(
  storeSlug: string,
  items: { variantId?: string; handle: string; qty: number }[],
): CartRedirectResult {
  const baseUrl = STORE_BASE_URLS[storeSlug.toLowerCase().replace(/\s+/g, '')];
  if (!baseUrl) return { url: null, method: 'manual' };

  const itemsWithVariants = items.filter((i) => i.variantId);

  if (itemsWithVariants.length > 0) {
    const cartItems = itemsWithVariants.map((i) => `${i.variantId}:${i.qty}`).join(',');
    const cartUrl = `${baseUrl}/cart/${cartItems}`;
    return {
      url: buildUTMUrl(cartUrl, {
        source: storeSlug,
        medium: 'cart_redirect',
        campaign: 'smart_cart',
        content: items.map((i) => i.handle).join('_'),
      }),
      method: 'shopify_cart',
    };
  }

  // Fallback: search for first item
  const searchUrl = `${baseUrl}/search?q=${encodeURIComponent(items[0]?.handle ?? '')}`;
  return {
    url: buildUTMUrl(searchUrl, {
      source: storeSlug,
      medium: 'cart_redirect',
      campaign: 'smart_cart',
      content: items[0]?.handle ?? '',
    }),
    method: 'query_params',
    note: 'Direct cart add unavailable — searching for first item',
  };
}

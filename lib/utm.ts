// lib/utm.ts — UTM parameter builder + tracked redirect URL helper

export interface UTMParams {
  source: string;    // store slug e.g. 'nammamarkt'
  medium: string;    // always 'referral'
  campaign: string;  // e.g. 'price_comparison'
  content: string;   // product id or slug
  term?: string;     // search query that led to click
}

/**
 * Append UTM parameters to an outbound store URL.
 * Preserves existing URL params (like WooCommerce _pos, _psq etc.).
 */
export function buildUTMUrl(baseUrl: string, utm: UTMParams): string {
  try {
    const url = new URL(baseUrl);
    url.searchParams.set('utm_source', 'bharatstores');
    url.searchParams.set('utm_medium', utm.medium);
    url.searchParams.set('utm_campaign', utm.campaign);
    url.searchParams.set('utm_content', utm.content);
    if (utm.term) url.searchParams.set('utm_term', encodeURIComponent(utm.term));
    return url.toString();
  } catch {
    // If URL parsing fails (relative URL), return as-is
    return baseUrl;
  }
}

/**
 * Build a proxy redirect URL through /api/redirect.
 * All "Buy Now" clicks should go through this so we can:
 * - append UTM params to the store URL
 * - log the click for analytics
 */
export function buildRedirectUrl(params: {
  productId: string;
  storeSlug: string;
  searchQuery?: string;
  position?: number;
}): string {
  const q = new URLSearchParams({ pid: params.productId, store: params.storeSlug });
  if (params.searchQuery) q.set('q', params.searchQuery);
  if (params.position !== undefined) q.set('pos', String(params.position));
  return `/api/redirect?${q.toString()}`;
}

/**
 * Anonymize an IP address for GDPR compliance.
 * Zeros the last octet for IPv4, last group for IPv6.
 */
export function anonymizeIP(ip: string): string {
  if (ip.includes(':')) {
    // IPv6: zero last group
    const parts = ip.split(':');
    parts[parts.length - 1] = '0';
    return parts.join(':');
  }
  // IPv4: zero last octet
  return ip.replace(/\.\d+$/, '.0');
}

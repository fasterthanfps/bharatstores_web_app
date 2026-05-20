import { NextRequest, NextResponse } from 'next/server';
import { buildUTMUrl, anonymizeIP } from '@/lib/utm';
import { createServiceClient } from '@/lib/supabase/server';
import { headers } from 'next/headers';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const productId   = searchParams.get('pid');
  const storeSlug   = searchParams.get('store');
  const searchQuery = searchParams.get('q') ?? undefined;
  const position    = Number(searchParams.get('pos') ?? 0);

  if (!productId || !storeSlug) {
    return NextResponse.json({ error: 'Missing params: pid and store are required' }, { status: 400 });
  }

  try {
    const supabase = createServiceClient();

    // Fetch the listing to get the original product URL and price
    // We use listing.id (passed as pid) to find the correct entry
    let { data: listing } = await supabase
      .from('listings')
      .select('id, product_url, price, store_name')
      .eq('id', productId)
      .maybeSingle();

    // Fallback: if not found, it might be a parent product ID. Look up by product_id and storeSlug.
    if (!listing?.product_url && storeSlug) {
      const { data: listings } = await supabase
        .from('listings')
        .select('id, product_url, price, store_name')
        .eq('product_id', productId);
      
      if (listings && listings.length > 0) {
        // Find the listing whose store name matches storeSlug
        const matched = listings.find((l: any) => l.store_name.toLowerCase().replace(/\s+/g, '') === storeSlug);
        if (matched) {
          listing = matched;
        }
      }
    }

    if (!listing?.product_url) {
      console.warn(`[redirect] Listing not found or missing URL for ID: ${productId} and store: ${storeSlug}`);
      // Fallback: redirect to homepage if product not found
      return NextResponse.redirect(new URL('/', request.url));
    }

    // Build UTM-tracked destination URL
    const destinationUrl = buildUTMUrl(listing.product_url, {
      source:   storeSlug,
      medium:   'referral',
      campaign: 'price_comparison',
      content:  productId,
      term:     searchQuery,
    });

    // Log the click asynchronously — NEVER block the redirect
    const headersList = await headers();
    const userAgent    = headersList.get('user-agent') ?? '';
    const rawIp        = headersList.get('x-forwarded-for')?.split(',')[0]?.trim()
                      ?? headersList.get('x-real-ip')
                      ?? 'unknown';
    const ipAnonymized = anonymizeIP(rawIp);

    const isMobile  = /mobile|android|iphone|ipad/i.test(userAgent);
    const isTablet  = /ipad|tablet/i.test(userAgent);
    const deviceType = isTablet ? 'tablet' : isMobile ? 'mobile' : 'desktop';

    // Fire-and-forget click log to existing 'clicks' table
    void (supabase.from('clicks' as any) as any).insert({
      listing_id:      listing.id,
      session_id:      null,
      ip_hash:         ipAnonymized,
      referrer:        searchQuery ?? null,
      price:           listing.price ?? 0,
      store_slug:      storeSlug,
      result_position: position,
      device_type:     deviceType,
      user_agent:      userAgent.slice(0, 200),
    });

    // Redirect immediately — 302 so browsers don't cache
    return NextResponse.redirect(destinationUrl, { status: 302 });

  } catch (err: any) {
    console.error('[redirect] Error:', err?.message);
    return NextResponse.redirect(new URL('/', request.url));
  }
}

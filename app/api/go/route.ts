import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createHash } from 'crypto';

// Hash IP for privacy (GDPR compliant)
function hashIp(ip: string): string {
    const salt = process.env.IP_HASH_DAILY_SALT ?? 'default-salt';
    const today = new Date().toISOString().split('T')[0]; // daily rotation
    return createHash('sha256')
        .update(`${ip}:${salt}:${today}`)
        .digest('hex');
}

// Build affiliate URL with UTM parameters
function buildAffiliateUrl(
    productUrl: string,
    storeName: string,
    listingId: string
): string {
    const url = new URL(productUrl);
    url.searchParams.set('utm_source', 'bharatstores');
    url.searchParams.set('utm_medium', 'affiliate');
    url.searchParams.set('utm_campaign', storeName.toLowerCase().replace(/\s+/g, '-'));
    url.searchParams.set('utm_content', listingId);
    return url.toString();
}

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const listingId = searchParams.get('lid');
    const sessionId = searchParams.get('sid') ?? 'unknown';

    if (!listingId) {
        return NextResponse.redirect(new URL('/?error=missing_listing', request.url));
    }

    const supabase = await createClient();

    // Look up listing
    const { data: listing, error } = await supabase
        .from('listings')
        .select('id, product_url, store_name')
        .eq('id', listingId)
        .maybeSingle();

    if (!listing) {
        return NextResponse.redirect(new URL('/?error=listing_not_found', request.url));
    }

    // Log click (best-effort — do not block redirect on failure)
    const ip =
        request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
        request.headers.get('x-real-ip') ??
        '0.0.0.0';

    void supabase
        .from('clicks')
        .insert({
            listing_id: listing.id,
            session_id: sessionId,
            ip_hash: hashIp(ip),
            referrer: request.headers.get('referer') ?? null,
        });

    // Build affiliate URL and redirect
    let targetUrl: string;
    try {
        targetUrl = buildAffiliateUrl(listing.product_url, listing.store_name, listingId);
    } catch {
        targetUrl = listing.product_url;
    }

    return NextResponse.redirect(targetUrl, { status: 302 });
}

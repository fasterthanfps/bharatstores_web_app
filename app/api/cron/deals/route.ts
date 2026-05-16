// app/api/cron/deals/route.ts
// Vercel Cron: runs every 2h ("0 */2 * * *")
// Reads listings + price_history, calculates 7d averages, upserts product_deals

import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { getStoreConfig } from '@/lib/stores';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  // Protect with CRON_SECRET
  const authHeader = req.headers.get('authorization');
  if (
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createServiceClient();
  const startedAt = Date.now();

  try {
    // 1. Get all in-stock listings
    const { data: listings, error: listingsError } = await supabase
      .from('listings')
      .select('id, product_id, product_name, store_name, price, availability, product_url, image_url, weight_label, price_per_kg, product_category')
      .in('availability', ['IN_STOCK', 'UNKNOWN']);

    if (listingsError || !listings) {
      return NextResponse.json({ error: 'Failed to fetch listings', detail: listingsError?.message }, { status: 500 });
    }

    // 2. Get 7-day price history for each listing
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const { data: history, error: historyError } = await supabase
      .from('price_history')
      .select('listing_id, price')
      .gte('recorded_at', sevenDaysAgo);

    if (historyError) {
      console.error('History fetch error:', historyError.message);
    }

    // Build listing_id → avg price map
    const avgMap = new Map<string, number>();
    if (history && history.length > 0) {
      const groups = new Map<string, number[]>();
      for (const row of history) {
        if (!row.listing_id) continue;
        if (!groups.has(row.listing_id)) groups.set(row.listing_id, []);
        groups.get(row.listing_id)!.push(Number(row.price));
      }
      for (const [lid, prices] of groups.entries()) {
        avgMap.set(lid, prices.reduce((a, b) => a + b, 0) / prices.length);
      }
    }

    // 3. Calculate deals (current price < 7d average by > 3%)
    const dealsToUpsert = [];
    const listingIdsWithDeals = new Set<string>();

    for (const listing of listings) {
      const currentPrice = Number(listing.price);
      const avg7d = avgMap.get(listing.id);

      // No history yet → skip
      if (!avg7d) continue;

      const discountPct = ((avg7d - currentPrice) / avg7d) * 100;
      if (discountPct <= 3) continue; // Not enough of a deal

      const storeSlug = listing.store_name?.toLowerCase().replace(/\s+/g, '') ?? '';
      const storeConfig = getStoreConfig(storeSlug);
      listingIdsWithDeals.add(listing.id);

      dealsToUpsert.push({
        listing_id: listing.id,
        product_id: listing.product_id,
        product_name: listing.product_name ?? 'Unnamed Product',
        image_url: listing.image_url ?? '',
        category: listing.product_category ?? 'grocery',
        weight: listing.weight_label ?? '',
        store_slug: storeSlug,
        store_name: storeConfig.label,
        current_price: currentPrice,
        avg_price_7d: Math.round(avg7d * 100) / 100,
        discount_percent: Math.round(discountPct * 10) / 10,
        savings_amount: Math.round((avg7d - currentPrice) * 100) / 100,
        price_per_kg: listing.price_per_kg ? Number(listing.price_per_kg) : null,
        in_stock: true,
        url: listing.product_url,
        last_updated: new Date().toISOString(),
      });
    }

    // 4. Upsert deals
    let upserted = 0;
    if (dealsToUpsert.length > 0) {
      const { error: upsertError } = await supabase
        .from('product_deals')
        .upsert(dealsToUpsert as any, { onConflict: 'listing_id' });

      if (upsertError) {
        console.error('Upsert error:', upsertError.message);
      } else {
        upserted = dealsToUpsert.length;
      }
    }

    // 5. Delete stale deals (listings that no longer qualify)
    const { error: deleteError } = await supabase
      .from('product_deals')
      .delete()
      .not('listing_id', 'in', `(${Array.from(listingIdsWithDeals).map((id) => `'${id}'`).join(',')})`);

    if (deleteError) {
      console.error('Delete stale deals error:', deleteError.message);
    }

    const elapsed = Date.now() - startedAt;
    return NextResponse.json({
      ok: true,
      dealsUpserted: upserted,
      listingsChecked: listings.length,
      elapsedMs: elapsed,
    });
  } catch (err) {
    console.error('Deals cron error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  // Basic authorization for cron
  const authHeader = req.headers.get('authorization');
  if (
    authHeader !== `Bearer ${process.env.CRON_SECRET}` && 
    process.env.NODE_ENV === 'production'
  ) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const supabase = createServiceClient();

    console.log('[Cron] Starting Deals generation task...');

    // 1. Fetch all listings that are in stock
    const { data: listings, error: listingsError } = await supabase
      .from('listings')
      .select(`
        id,
        product_id,
        price,
        compare_price,
        availability,
        product_url,
        image_url,
        weight_label,
        price_per_kg,
        product_name,
        product_category,
        store_name
      `)
      .eq('availability', 'IN_STOCK');

    if (listingsError) {
      throw new Error(`Failed to fetch listings: ${listingsError.message}`);
    }

    console.log(`[Cron] Found ${listings.length} in-stock listings.`);

    // 2. Fetch 7-day average prices from price_history using a single raw query
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data: historyData, error: historyError } = await supabase
      .from('price_history')
      .select('product_id, price')
      .gte('recorded_at', sevenDaysAgo.toISOString());

    if (historyError) {
      console.warn(`[Cron] Warning fetching price history: ${historyError.message}`);
    }

    // Group history prices by product_id
    const historyMap = new Map<string, number[]>();
    if (historyData) {
      for (const row of historyData) {
        if (!row.product_id) continue;
        const prices = historyMap.get(row.product_id) || [];
        prices.push(Number(row.price));
        historyMap.set(row.product_id, prices);
      }
    }

    const dealsToUpsert: any[] = [];
    const validListingIds = new Set<string>();

    for (const listing of listings) {
      const currentPrice = Number(listing.price);
      if (currentPrice <= 0) continue;

      validListingIds.add(listing.id);

      // Determine 7-day average
      let avgPrice7d = 0;
      const historyPrices = historyMap.get(listing.product_id ?? '');

      if (historyPrices && historyPrices.length > 0) {
        const sum = historyPrices.reduce((a, b) => a + b, 0);
        avgPrice7d = sum / historyPrices.length;
      } else if (listing.compare_price) {
        avgPrice7d = Number(listing.compare_price);
      }

      // If no valid average price, or current price is not lower, skip
      if (avgPrice7d <= currentPrice) continue;

      const savingsAmount = avgPrice7d - currentPrice;
      const discountPercent = (savingsAmount / avgPrice7d) * 100;

      // Minimum 3% discount to qualify as a deal
      if (discountPercent >= 3) {
        const storeSlug = listing.store_name.toLowerCase().replace(/\s+/g, '');
        
        dealsToUpsert.push({
          listing_id: listing.id,
          product_id: listing.product_id,
          product_name: listing.product_name || 'Grocery Product',
          image_url: listing.image_url || '',
          category: listing.product_category || 'general',
          weight: listing.weight_label || '',
          store_slug: storeSlug,
          store_name: listing.store_name,
          current_price: currentPrice,
          avg_price_7d: Number(avgPrice7d.toFixed(2)),
          discount_percent: Number(discountPercent.toFixed(1)),
          savings_amount: Number(savingsAmount.toFixed(2)),
          price_per_kg: listing.price_per_kg ? Number(listing.price_per_kg) : null,
          in_stock: true,
          url: listing.product_url,
          last_updated: new Date().toISOString()
        });
      }
    }

    console.log(`[Cron] Found ${dealsToUpsert.length} qualifying deals.`);

    // 3. Upsert deals in chunks to avoid payload size limits
    const chunkSize = 50;
    let upsertCount = 0;
    for (let i = 0; i < dealsToUpsert.length; i += chunkSize) {
      const chunk = dealsToUpsert.slice(i, i + chunkSize);
      const { error: upsertError } = await supabase
        .from('product_deals')
        .upsert(chunk, { onConflict: 'listing_id' });

      if (upsertError) {
        console.error(`[Cron] Error upserting deals chunk:`, upsertError.message);
      } else {
        upsertCount += chunk.length;
      }
    }

    // 4. Delete stale deals (out of stock, or discount dropped below 3%, or listing deleted)
    const { data: currentDeals, error: currentDealsError } = await supabase
      .from('product_deals')
      .select('listing_id');

    if (!currentDealsError && currentDeals) {
      const activeDealListingIds = new Set(dealsToUpsert.map(d => d.listing_id));
      const staleListingIds = currentDeals
        .map((d: any) => d.listing_id)
        .filter((id: string) => !activeDealListingIds.has(id));

      if (staleListingIds.length > 0) {
        console.log(`[Cron] Deleting ${staleListingIds.length} stale deals.`);
        const { error: deleteError } = await supabase
          .from('product_deals')
          .delete()
          .in('listing_id', staleListingIds);

        if (deleteError) {
          console.error(`[Cron] Error deleting stale deals:`, deleteError.message);
        }
      }
    }

    console.log(`[Cron] Deals generation complete! Successfully upserted ${upsertCount} deals.`);
    return NextResponse.json({ success: true, processed: listings.length, dealsCreated: upsertCount });

  } catch (error: any) {
    console.error('[Cron] Deals generation failed:', error.message);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

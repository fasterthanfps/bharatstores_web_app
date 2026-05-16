import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function populateDeals() {
  console.log('Fetching listings...');
  const { data: listings, error: listingsError } = await supabase
    .from('listings')
    .select(`
      id, 
      product_id, 
      store_name, 
      price, 
      compare_price, 
      availability, 
      product_url, 
      image_url, 
      weight_label, 
      price_per_kg, 
      product_category,
      products ( name )
    `)
    .in('availability', ['IN_STOCK', 'UNKNOWN']);

  if (listingsError) throw listingsError;
  
  // Flatten products.name into product_name
  const listingsWithNames = listings.map(l => ({
    ...l,
    product_name: (l as any).products?.name || (l as any).product_name || 'Unnamed'
  }));

  console.log(`Found ${listingsWithNames.length} listings.`);

  console.log('Fetching price history...');
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const { data: history, error: historyError } = await supabase
    .from('price_history')
    .select('listing_id, price')
    .gte('recorded_at', sevenDaysAgo);

  if (historyError) console.error('History error:', historyError.message);

  const avgMap = new Map<string, number>();
  if (history) {
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

  const dealsToUpsert = [];
  const listingIdsWithDeals = new Set<string>();

  for (const listing of listingsWithNames) {
    const currentPrice = Number(listing.price);
    const avg7d = avgMap.get(listing.id);
    const comparePrice = listing.compare_price ? Number(listing.compare_price) : null;
    const isSaleInName = (listing.product_name || '').toLowerCase().includes('sale');
    const basePrice = avg7d || comparePrice || (isSaleInName ? currentPrice * 1.2 : null);

    if (!basePrice || basePrice <= currentPrice) continue;

    const discountPct = ((basePrice - currentPrice) / basePrice) * 100;
    if (discountPct <= 3 && !isSaleInName) continue;

    listingIdsWithDeals.add(listing.id);
    dealsToUpsert.push({
      listing_id: listing.id,
      product_id: listing.product_id,
      product_name: listing.product_name || 'Unnamed',
      image_url: listing.image_url || '',
      category: listing.product_category || 'grocery',
      weight: listing.weight_label || '',
      store_slug: listing.store_name?.toLowerCase().replace(/\s+/g, '') || '',
      store_name: listing.store_name || '',
      current_price: currentPrice,
      avg_price_7d: Math.round(basePrice * 100) / 100,
      discount_percent: Math.round(discountPct * 10) / 10,
      savings_amount: Math.round((basePrice - currentPrice) * 100) / 100,
      price_per_kg: listing.price_per_kg ? Number(listing.price_per_kg) : null,
      in_stock: true,
      url: listing.product_url,
      last_updated: new Date().toISOString()
    });
  }

  console.log(`Calculated ${dealsToUpsert.length} deals.`);
  if (dealsToUpsert.length > 0) {
    const { error: upsertError } = await supabase
      .from('product_deals')
      .upsert(dealsToUpsert, { onConflict: 'listing_id' });
    if (upsertError) console.error('Upsert error:', upsertError.message);
    else console.log('Successfully upserted deals.');
  }

  // Clear old ones
  if (listingIdsWithDeals.size > 0) {
    const { error: deleteError } = await supabase
      .from('product_deals')
      .delete()
      .not('listing_id', 'in', `(${Array.from(listingIdsWithDeals).map(id => `'${id}'`).join(',')})`);
    if (deleteError) console.error('Delete error:', deleteError.message);
  }
}

populateDeals().catch(console.error);

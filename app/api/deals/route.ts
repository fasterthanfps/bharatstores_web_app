import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/** Strip noise like "- Sale Item [BBD: 31 May 2026]" from product names */
function cleanProductName(name: string): string {
  return name
    .replace(/\s*-?\s*Sale\s+Item\s*/gi, '')
    .replace(/\[BBD:[^\]]*\]/gi, '')
    .replace(/\[.*?\]/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') || 'percentage';
  const cat = searchParams.get('cat') || '';
  const page = parseInt(searchParams.get('page') || '1', 10);

  const limit = type === 'flash' ? 6 : 48;
  const skip = (page - 1) * limit;

  try {
    const supabase = await createClient();

    let query = supabase
      .from('product_deals')
      .select('*', { count: 'exact' })
      .eq('in_stock', true);

    if (type === 'percentage') {
      query = query.order('discount_percent', { ascending: false });
    } else if (type === 'daily') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      query = query
        .gte('last_updated', today.toISOString())
        .order('discount_percent', { ascending: false });
    } else if (type === 'weekly') {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      query = query
        .gte('last_updated', sevenDaysAgo.toISOString())
        .order('savings_amount', { ascending: false });
    } else if (type === 'flash') {
      query = query
        .gte('discount_percent', 15)
        .order('discount_percent', { ascending: false });
    } else if (type === 'category' && cat) {
      query = query
        .ilike('category', `%${cat}%`)
        .order('discount_percent', { ascending: false });
    } else {
      query = query.order('discount_percent', { ascending: false });
    }

    const { data: rawDeals, count, error } = await query.range(skip, skip + limit - 1);

    if (error) {
      console.error('Deals API Error:', error);
      return NextResponse.json({ deals: [], total: 0, page });
    }

    const deals = (rawDeals || []).map((d: any) => ({
      productId: d.product_id,
      listingId: d.listing_id,
      term: cleanProductName(d.product_name),
      rawTerm: d.product_name, // keep original for search fallback
      category: d.category,
      imageUrl: d.image_url,
      bestPrice: Number(d.current_price),
      comparePrice: Number(d.avg_price_7d),
      storeName: d.store_name,
      storeId: d.store_slug,
      weightLabel: d.weight,
      discountPercent: Number(d.discount_percent),
      savingsAmount: Number(d.savings_amount),
      pricePerKg: d.price_per_kg ? Number(d.price_per_kg) : null,
      storeUrl: d.url, // direct store product URL
      lastUpdated: d.last_updated,
    }));

    return NextResponse.json({ deals, total: count || 0, page }, {
      headers: { 'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=1200' }
    });
  } catch (error) {
    console.error('Deals API Error:', error);
    return NextResponse.json({ deals: [], total: 0, page }, { status: 500 });
  }
}

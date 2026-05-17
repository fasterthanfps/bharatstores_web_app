import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') || 'percentage';
  const cat = searchParams.get('cat') || '';
  const page = parseInt(searchParams.get('page') || '1', 10);
  
  const limit = type === 'flash' ? 4 : 48;
  const skip = (page - 1) * limit;

  try {
    const supabase = await createClient();
    
    let query = supabase
      .from('product_deals')
      .select('*', { count: 'exact' })
      .eq('in_stock', true); // only show in stock deals

    // Apply specific query logic based on type
    if (type === 'percentage') {
      query = query.order('discount_percent', { ascending: false });
    } else if (type === 'daily') {
      const today = new Date();
      today.setHours(0,0,0,0);
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
        .gt('discount_percent', 15)
        .order('discount_percent', { ascending: false });
    } else if (type === 'category' && cat) {
      query = query
        .ilike('category', `%${cat}%`)
        .order('discount_percent', { ascending: false });
    } else {
      query = query.order('discount_percent', { ascending: false });
    }

    // Apply pagination
    const { data: rawDeals, count, error } = await query
      .range(skip, skip + limit - 1);

    if (error) {
      console.error('Deals API Error fetching from Supabase:', error);
      return NextResponse.json({ deals: [], total: 0, page });
    }

    // Map fields from product_deals columns to client expectations
    const deals = (rawDeals || []).map((d: any) => ({
      productId: d.product_id,
      term: d.product_name,
      category: d.category,
      brand: null,
      imageUrl: d.image_url,
      bestPrice: Number(d.current_price),
      comparePrice: Number(d.avg_price_7d),
      storeName: d.store_name,
      storeId: d.store_slug,
      weightLabel: d.weight,
      discountPercent: Number(d.discount_percent),
      savingsAmount: Number(d.savings_amount),
      lastUpdated: d.last_updated
    }));

    return NextResponse.json({ deals, total: count || 0, page }, {
      headers: {
        'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=1200'
      }
    });
  } catch (error) {
    console.error('Deals API Error:', error);
    return NextResponse.json({ deals: [], total: 0, page }, { status: 500 });
  }
}

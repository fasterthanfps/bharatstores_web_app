import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSuggestions } from '@/lib/search/suggest';
import type { Suggestion } from '@/lib/types';

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q') ?? '';

  if (!q || q.trim().length < 2) {
    return NextResponse.json({ suggestions: [] as Suggestion[] }, {
      headers: { 'Cache-Control': 's-maxage=60, stale-while-revalidate=300' },
    });
  }

  try {
    const supabase = await createClient();

    // Fetch a broad set of recent listings to build suggestions from
    const { data: listings } = await supabase
      .from('listings')
      .select(`
        id,
        store_name,
        price,
        products ( name, category )
      `)
      .not('price', 'is', null)
      .order('last_scraped_at', { ascending: false })
      .limit(600);

    const flat = (listings ?? []).map((l: any) => ({
      product_name: l.products?.name ?? '',
      product_category: l.products?.category ?? 'general',
      store_name: l.store_name ?? '',
      price: l.price ?? 0,
    }));

    const suggestions: Suggestion[] = getSuggestions(q, flat);

    return NextResponse.json({ suggestions }, {
      headers: { 'Cache-Control': 's-maxage=60, stale-while-revalidate=300' },
    });
  } catch (err: any) {
    console.error('[suggest] Error:', err?.message);
    return NextResponse.json({ suggestions: [] as Suggestion[] });
  }
}

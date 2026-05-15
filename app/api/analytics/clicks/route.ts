import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

// GET /api/analytics/clicks?range=7d&groupBy=store
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const range   = searchParams.get('range') ?? '7d';
  const groupBy = searchParams.get('groupBy') ?? 'store';

  const days  = range === '30d' ? 30 : range === '1d' ? 1 : 7;
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  try {
    const supabase = createServiceClient();

    if (groupBy === 'store') {
      const { data } = await (supabase as any)
        .from('click_events')
        .select('store_slug')
        .gte('created_at', since);

      // Group in JS (avoids needing RPC)
      const counts: Record<string, number> = {};
      for (const row of data ?? []) {
        counts[row.store_slug] = (counts[row.store_slug] ?? 0) + 1;
      }
      const result = Object.entries(counts)
        .map(([storeSlug, count]) => ({ storeSlug, count }))
        .sort((a, b) => b.count - a.count);

      return NextResponse.json({ data: result });
    }

    if (groupBy === 'product') {
      const { data } = await (supabase as any)
        .from('click_events')
        .select('product_id, store_slug, price')
        .gte('created_at', since);

      const counts: Record<string, { count: number; store: string; price: number }> = {};
      for (const row of data ?? []) {
        const existing = counts[row.product_id];
        counts[row.product_id] = {
          count: (existing?.count ?? 0) + 1,
          store: existing?.store ?? row.store_slug,
          price: existing?.price ?? row.price,
        };
      }
      const result = Object.entries(counts)
        .map(([productId, v]) => ({ productId, ...v }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 20);

      return NextResponse.json({ data: result });
    }

    if (groupBy === 'query') {
      const { data } = await (supabase as any)
        .from('click_events')
        .select('search_query')
        .gte('created_at', since)
        .not('search_query', 'is', null);

      const counts: Record<string, number> = {};
      for (const row of data ?? []) {
        if (row.search_query) {
          counts[row.search_query] = (counts[row.search_query] ?? 0) + 1;
        }
      }
      const result = Object.entries(counts)
        .map(([query, count]) => ({ query, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 20);

      return NextResponse.json({ data: result });
    }

    if (groupBy === 'device') {
      const { data } = await (supabase as any)
        .from('click_events')
        .select('device_type')
        .gte('created_at', since);

      const counts: Record<string, number> = {};
      for (const row of data ?? []) {
        counts[row.device_type] = (counts[row.device_type] ?? 0) + 1;
      }
      const total = Object.values(counts).reduce((a, b) => a + b, 0);
      const result = Object.entries(counts)
        .map(([deviceType, count]) => ({ deviceType, count, pct: total > 0 ? Math.round((count / total) * 100) : 0 }))
        .sort((a, b) => b.count - a.count);

      return NextResponse.json({ data: result });
    }

    // Default: total clicks + summary for dashboard top stats
    const { data: allClicks, count } = await (supabase as any)
      .from('click_events')
      .select('store_slug, search_query, device_type, result_position', { count: 'exact' })
      .gte('created_at', since);

    const storeMap: Record<string, number> = {};
    const queryMap: Record<string, number> = {};
    let mobileCount = 0;
    let totalPosition = 0;

    for (const row of allClicks ?? []) {
      storeMap[row.store_slug] = (storeMap[row.store_slug] ?? 0) + 1;
      if (row.search_query) queryMap[row.search_query] = (queryMap[row.search_query] ?? 0) + 1;
      if (row.device_type === 'mobile') mobileCount++;
      totalPosition += row.result_position ?? 0;
    }

    const topStore = Object.entries(storeMap).sort((a, b) => b[1] - a[1])[0];
    const topQuery = Object.entries(queryMap).sort((a, b) => b[1] - a[1])[0];
    const total = count ?? 0;
    const mobilePct = total > 0 ? Math.round((mobileCount / total) * 100) : 0;
    const avgPos = total > 0 ? Math.round((totalPosition / total) * 10) / 10 : 0;

    return NextResponse.json({
      data: {
        totalClicks: total,
        topStore: topStore ? { name: topStore[0], count: topStore[1] } : null,
        topQuery: topQuery ? { query: topQuery[0], count: topQuery[1] } : null,
        mobilePct,
        avgResultPosition: avgPos,
      }
    });

  } catch (err: any) {
    console.error('[analytics/clicks] Error:', err?.message);
    return NextResponse.json({ data: null, error: err?.message }, { status: 500 });
  }
}

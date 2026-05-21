import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { data: isAdmin } = await supabase.rpc('is_admin', { uid: user.id });
    if (!isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    // Top zero-result queries in the last 30 days, ranked by frequency
    const { data, error } = await supabase
        .from('search_events')
        .select('query, normalized_query, results_count, created_at')
        .eq('results_count', 0)
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false })
        .limit(200);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Aggregate by normalized_query
    const rows = (data ?? []) as Array<{ query: string; normalized_query: string; results_count: number; created_at: string }>;
    const counts: Record<string, { query: string; normalized_query: string; count: number; last_seen: string }> = {};
    for (const row of rows) {
        const key = row.normalized_query ?? row.query;
        if (!counts[key]) {
            counts[key] = { query: row.query, normalized_query: row.normalized_query, count: 0, last_seen: row.created_at };
        }
        counts[key].count++;
        if (row.created_at > counts[key].last_seen) counts[key].last_seen = row.created_at;
    }

    const ranked = Object.values(counts)
        .sort((a, b) => b.count - a.count)
        .slice(0, 20);

    return NextResponse.json({ data: ranked });
}

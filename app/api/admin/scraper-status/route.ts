import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: isAdmin } = await supabase.rpc('is_admin', { uid: user.id });
    if (!isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const runId = request.nextUrl.searchParams.get('runId');
    if (!runId) return NextResponse.json({ error: 'Missing runId' }, { status: 400 });

    const { data: run } = await supabase
        .from('scraper_runs')
        .select('id, status, products_found, errors, started_at, finished_at, store_name')
        .eq('id', runId)
        .single();

    return NextResponse.json({ run });
}

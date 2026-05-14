import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

// DEFER: PRODUCTION — implement full affiliate conversion webhook
// This endpoint receives conversion callbacks from affiliate networks
export async function POST(request: NextRequest) {
    const signature = request.headers.get('x-webhook-signature');
    const webhookSecret = process.env.AFFILIATE_WEBHOOK_SECRET;

    if (!webhookSecret || signature !== webhookSecret) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({})) as {
        session_id?: string;
        revenue?: number;
        listing_id?: string;
    };

    const { session_id, revenue, listing_id } = body;

    if (!session_id || !revenue) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const supabase = createServiceClient();

    // Find the most recent click for this session
    const { data: click } = await supabase
        .from('clicks')
        .select('id')
        .eq('session_id', session_id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

    if (click) {
        await supabase
            .from('clicks')
            .update({ converted: true, revenue_eur: revenue })
            .eq('id', click.id);
    }

    return NextResponse.json({ success: true });
}

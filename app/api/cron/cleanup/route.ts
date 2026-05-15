import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

// POST /api/cron/cleanup — deletes click events older than 90 days (GDPR compliance)
// Schedule via Vercel Cron: { "crons": [{ "path": "/api/cron/cleanup", "schedule": "0 2 * * *" }] }
export async function POST(request: Request) {
  // Verify secret to prevent unauthorized calls
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const supabase = createServiceClient();
    const cutoff   = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();

    const { error, count } = await (supabase.from('click_events' as any) as any)
      .delete({ count: 'exact' })
      .lt('created_at', cutoff);

    if (error) throw error;

    console.log(`[cron/cleanup] Deleted ${count ?? 0} click events older than 90 days`);
    return NextResponse.json({ success: true, deleted: count ?? 0, cutoff });

  } catch (err: any) {
    console.error('[cron/cleanup] Error:', err?.message);
    return NextResponse.json({ success: false, error: err?.message }, { status: 500 });
  }
}

// GET for health checks
export async function GET() {
  return NextResponse.json({ status: 'ok', description: 'POST to trigger 90-day click event cleanup' });
}

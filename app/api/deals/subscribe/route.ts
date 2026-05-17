import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, frequency } = body;

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Invalid email' }, { status: 400 });
    }

    const freq = ['instant', 'daily', 'weekly'].includes(frequency) ? frequency : 'daily';

    const supabase = (await createClient()) as any;
    const { error } = await supabase
      .from('deal_subscriptions')
      .upsert({
        email,
        frequency: freq,
        active: true,
        updated_at: new Date().toISOString()
      }, { onConflict: 'email' });

    if (error) {
      console.error('Subscribe database error:', error);
      return NextResponse.json({ error: 'Failed to subscribe' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Subscribe Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

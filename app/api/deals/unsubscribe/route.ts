import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get('email');

  if (!email) {
    return new NextResponse('Email is required', { status: 400 });
  }

  try {
    const supabase = (await createClient()) as any;
    const { error } = await supabase
      .from('deal_subscriptions')
      .update({ active: false, updated_at: new Date().toISOString() })
      .eq('email', email);

    if (error) {
      console.error('Unsubscribe database error:', error);
      return new NextResponse('Failed to unsubscribe', { status: 500 });
    }

    return new NextResponse(`
      <html>
        <head><title>Unsubscribed</title></head>
        <body style="font-family: sans-serif; text-align: center; padding: 50px;">
          <h2>Unsubscribed</h2>
          <p>You have successfully unsubscribed from deal alerts.</p>
          <a href="/" style="color: #E24A4A; text-decoration: none; font-weight: bold;">Back to site</a>
        </body>
      </html>
    `, { headers: { 'Content-Type': 'text/html' } });
  } catch (error) {
    console.error('Unsubscribe Error:', error);
    return new NextResponse('An error occurred', { status: 500 });
  }
}

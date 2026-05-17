import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY || 're_dummy');

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const today = new Date().getDay(); // 0 is Sunday, 1 is Monday
  const frequencies = ['daily', 'instant'];
  if (today === 1) { // Monday
    frequencies.push('weekly');
  }

  try {
    const supabase = (await createClient()) as any;
    
    // 1. Fetch subscribers
    const { data: subscribers, error: subError } = await supabase
      .from('deal_subscriptions')
      .select('email')
      .eq('active', true)
      .in('frequency', frequencies);

    if (subError || !subscribers || subscribers.length === 0) {
      return NextResponse.json({ sent: 0, reason: 'No subscribers' });
    }

    // 2. Fetch top 5 deals from product_deals
    const { data: deals, error: dealError } = await supabase
      .from('product_deals')
      .select('product_name, current_price, avg_price_7d, discount_percent')
      .eq('in_stock', true)
      .gt('discount_percent', 10)
      .order('discount_percent', { ascending: false })
      .limit(5);

    if (dealError || !deals || deals.length === 0) {
      return NextResponse.json({ sent: 0, reason: 'No deals' });
    }

    const topDiscount = Math.round(Number(deals[0].discount_percent));
    const subject = `🏷️ Top ${deals.length} deals today — up to ${topDiscount}% off`;

    let dealsHtml = `
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
        <tr>
          <th style="text-align: left; padding: 8px; border-bottom: 1px solid #ddd;">Product</th>
          <th style="text-align: left; padding: 8px; border-bottom: 1px solid #ddd;">Price</th>
          <th style="text-align: left; padding: 8px; border-bottom: 1px solid #ddd;">Discount</th>
        </tr>
    `;

    for (const d of deals) {
      dealsHtml += `
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #eee;">${d.product_name}</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee;">€${Number(d.current_price).toFixed(2)}</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee; color: #E24A4A; font-weight: bold;">-${Math.round(Number(d.discount_percent))}%</td>
        </tr>
      `;
    }

    dealsHtml += `</table>`;

    const fromEmail = process.env.FROM_EMAIL || 'deals@bharatstores.eu';

    let sent = 0;
    for (const sub of subscribers) {
      const html = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
          <h2 style="color: #E24A4A;">Top Grocery Deals Today!</h2>
          ${dealsHtml}
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://bharatstores.eu/deals" style="background-color: #E24A4A; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">See All Deals</a>
          </div>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="font-size: 12px; color: #999; text-align: center;">
            <a href="https://bharatstores.eu/api/deals/unsubscribe?email=${encodeURIComponent(sub.email)}" style="color: #999;">Unsubscribe</a>
          </p>
        </div>
      `;

      try {
        await resend.emails.send({
          from: fromEmail,
          to: sub.email,
          subject,
          html,
        });
        sent++;
      } catch (e) {
        console.error('Email send failed for', sub.email, e);
      }
    }

    return NextResponse.json({ sent });
  } catch (error) {
    console.error('Cron error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

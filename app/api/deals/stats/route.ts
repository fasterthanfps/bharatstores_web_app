import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('product_deals')
      .select('discount_percent, savings_amount, store_slug')
      .eq('in_stock', true);

    if (error || !data) {
      return NextResponse.json({ total: 0, avgDiscount: 0, storeCount: 0, totalSavings: 0 });
    }

    const total = data.length;
    const avgDiscount = total > 0 ? Math.round(data.reduce((s, d) => s + Number(d.discount_percent), 0) / total) : 0;
    const totalSavings = data.reduce((s, d) => s + Number(d.savings_amount), 0);
    const storeCount = new Set(data.map(d => d.store_slug)).size;

    return NextResponse.json(
      { total, avgDiscount, storeCount, totalSavings: Number(totalSavings.toFixed(2)) },
      { headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' } }
    );
  } catch {
    return NextResponse.json({ total: 0, avgDiscount: 0, storeCount: 0, totalSavings: 0 });
  }
}

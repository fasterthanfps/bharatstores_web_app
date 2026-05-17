import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  const fallbackTerms = ['Basmati Rice','Amul Ghee','MDH Masala','Toor Dal','Atta','Paneer','Chai','Chana Dal'];
  
  try {
    const supabase = (await createClient()) as any;
    const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString();
    
    // Fetch last 7 days search events
    const { data: events, error } = await supabase
      .from('search_events')
      .select('query')
      .gte('created_at', sevenDaysAgo);

    if (error || !events) {
      console.error('Popular searches DB error:', error);
      return NextResponse.json({ terms: fallbackTerms });
    }

    const counts: Record<string, number> = {};
    for (const e of events) {
      const q = e.query?.trim();
      if (q) {
        // Normalize terms for counting
        const key = q.toLowerCase().replace(/\s+/g, ' ');
        counts[key] = (counts[key] || 0) + 1;
      }
    }

    const sorted = Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(entry => {
        // Find first occurrence in original casing
        const orig = events.find((e: any) => e.query?.trim().toLowerCase() === entry[0]);
        return orig ? orig.query.trim() : entry[0];
      })
      .slice(0, 10);

    const terms = sorted.length >= 5 ? sorted : fallbackTerms;

    return NextResponse.json({ terms });
  } catch (error) {
    console.error('Popular searches error:', error);
    return NextResponse.json({ terms: fallbackTerms });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q')?.trim() ?? '';

  if (q.length < 2) {
    return NextResponse.json({ suggestions: [] });
  }

  const normalized = q.toLowerCase().replace(/\s+/g, ' ');

  try {
    const supabase = await createClient();
    
    // Fetch products matching the query that have at least one in-stock listing
    const { data: products, error } = await supabase
      .from('products')
      .select(`
        id,
        name,
        category,
        brand,
        image_url,
        listings!inner (
          price,
          availability
        )
      `)
      .or(`name.ilike.%${normalized}%,brand.ilike.%${normalized}%`)
      .eq('listings.availability', 'IN_STOCK')
      .limit(50);

    if (error) {
      console.error('Suggest API error fetching products:', error);
      return NextResponse.json({ suggestions: [] });
    }

    if (!products) {
      return NextResponse.json({ suggestions: [] });
    }

    // Process and shape products
    const processed = products.map((p: any) => {
      const inStockListings = p.listings.filter((l: any) => l.availability === 'IN_STOCK');
      const storeCount = inStockListings.length;
      const bestPrice = inStockListings.length > 0 
        ? Math.min(...inStockListings.map((l: any) => Number(l.price))) 
        : null;

      return {
        id: p.id,
        name: p.name,
        category: p.category,
        brand: p.brand,
        imageUrl: p.image_url,
        storeCount,
        bestPrice,
      };
    });

    // Deduplicate, sort prefix matches first, then by storeCount desc
    const seen = new Set<string>();
    const suggestions = [];

    const sorted = processed.sort((a, b) => {
      const aPrefix = a.name.toLowerCase().startsWith(normalized);
      const bPrefix = b.name.toLowerCase().startsWith(normalized);
      if (aPrefix && !bPrefix) return -1;
      if (!aPrefix && bPrefix) return 1;
      return b.storeCount - a.storeCount;
    });

    for (const p of sorted) {
      const key = p.name.toLowerCase().trim();
      if (seen.has(key)) continue;
      seen.add(key);
      suggestions.push({
        productId: p.id,
        term: p.name,
        category: p.category,
        brand: p.brand,
        imageUrl: p.imageUrl,
        storeCount: p.storeCount,
        bestPrice: p.bestPrice,
      });
      if (suggestions.length >= 6) break;
    }

    return NextResponse.json({ suggestions }, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('Suggest API error:', error);
    return NextResponse.json({ suggestions: [] }, { status: 500 });
  }
}

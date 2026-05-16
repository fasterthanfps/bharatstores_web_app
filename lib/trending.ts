import { createClient } from '@/lib/supabase/server';

export interface TrendingProduct {
  id: string;
  name: string;
  imageUrl: string;
  bestPrice: number;
  oldPrice?: number;
  discount?: string;
}

export async function getTrendingProducts(): Promise<TrendingProduct[]> {
  try {
    const supabase = await createClient();

    // Fetch products that have a comparePrice (discounted) or just latest listings
    const { data: listings, error } = await supabase
      .from('listings')
      .select('id, product_id, price, compare_price, image_url, products(name)')
      .eq('availability', 'IN_STOCK')
      .not('compare_price', 'is', null)
      .order('updated_at', { ascending: false })
      .limit(10);

    if (error || !listings || listings.length === 0) {
        // Fallback to top products
        const { data: fallback } = await supabase
          .from('listings')
          .select('id, product_id, price, compare_price, image_url, products(name)')
          .eq('availability', 'IN_STOCK')
          .order('price', { ascending: true })
          .limit(10);
        
        if (!fallback) return [];
        return formatListings(fallback);
    }

    return formatListings(listings);
  } catch (err) {
    console.error('getTrendingProducts error:', err);
    return [];
  }
}

function formatListings(listings: any[]): TrendingProduct[] {
    const seen = new Set();
    const result: TrendingProduct[] = [];
    
    for (const l of listings) {
        const name = l.products?.name || 'Product';
        if (seen.has(name)) continue;
        seen.add(name);
        
        const price = Number(l.price);
        const oldPrice = l.compare_price ? Number(l.compare_price) : undefined;
        let discount = '';
        if (oldPrice && oldPrice > price) {
            discount = `-${Math.round((1 - price / oldPrice) * 100)}%`;
        }
        
        result.push({
            id: l.product_id || l.id,
            name,
            imageUrl: l.image_url || '',
            bestPrice: price,
            oldPrice,
            discount
        });
        
        if (result.length >= 6) break;
    }
    
    return result;
}

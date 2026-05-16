import { createClient } from '@/lib/supabase/server';
import { getStoreConfig } from '@/lib/stores';

export interface FeaturedStore {
  storeSlug: string;
  price: number;
  isBest: boolean;
  inStock: boolean;
  url: string;
}

export interface FeaturedProduct {
  id: string;
  name: string;
  category: string;
  weight: string;
  imageUrl: string;
  emoji: string;
  stores: FeaturedStore[];
  bestPrice: number;
  bestStore: string;
}

// These 4 products MUST be pinned by slug or name — never random
const FEATURED_PINS = [
  { slug: 'basmati-rice', fallbackName: 'Basmati Rice', emoji: '🌾' },
  { slug: 'amul-ghee',    fallbackName: 'Amul Ghee',    emoji: '🧈' },
  { slug: 'mdh-masala',   fallbackName: 'MDH Masala',   emoji: '🌶️' },
  { slug: 'toor-dal',     fallbackName: 'Toor Dal',     emoji: '🫘' },
];

export async function getFeaturedProducts(): Promise<FeaturedProduct[]> {
  try {
    const supabase = await createClient();
    const results: FeaturedProduct[] = [];

    for (const pin of FEATURED_PINS) {
      // Try fuzzy name match or slug match in the products table first
      const { data: products, error: pError } = await supabase
        .from('products')
        .select(`
          id, name, category, image_url,
          listings!inner (
            id, store_name, price, availability, product_url
          )
        `)
        .or(`slug.ilike.%${pin.slug}%,name.ilike.%${pin.fallbackName}%`)
        .eq('listings.availability', 'IN_STOCK')
        .order('price', { foreignTable: 'listings', ascending: true })
        .limit(1);

      if (pError || !products || products.length === 0) continue;

      const p = products[0];
      const listings = p.listings as any[];

      results.push({
        id: p.id,
        name: p.name,
        category: p.category || 'Grocery',
        weight: '', // will be populated from listings if available
        imageUrl: p.image_url || '',
        emoji: pin.emoji,
        stores: listings.slice(0, 3).map((l, i) => ({
          storeSlug: l.store_name?.toLowerCase().replace(/\s+/g, '') || '',
          price: Number(l.price),
          isBest: i === 0,
          inStock: true,
          url: l.product_url || '#',
        })),
        bestPrice: Number(listings[0].price),
        bestStore: listings[0].store_name?.toLowerCase().replace(/\s+/g, '') || '',
      });
    }

    if (results.length > 0) return results;
    return getFallbackFeaturedProducts();
  } catch (err) {
    console.error('getFeaturedProducts error:', err);
    return getFallbackFeaturedProducts();
  }
}


function getFallbackFeaturedProducts(): FeaturedProduct[] {
  return [
    {
      id: 'demo-1',
      name: 'Basmati Rice',
      category: 'Rice',
      weight: '5kg',
      imageUrl: '',
      emoji: '🌾',
      stores: [
        { storeSlug: 'dookan', price: 8.99, isBest: true, inStock: true, url: '#' },
        { storeSlug: 'jamoona', price: 9.49, isBest: false, inStock: true, url: '#' },
      ],
      bestPrice: 8.99,
      bestStore: 'dookan',
    },
    // ... more if needed, but let's keep it simple for now as the goal is UI
  ];
}

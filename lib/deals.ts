// lib/deals.ts — Fetch deals from Supabase product_deals table

import { createClient } from '@/lib/supabase/server';

export interface Deal {
  id: string;
  productId: string;
  productName: string;
  imageUrl: string;
  category: string;
  weight: string;
  storeSlug: string;
  storeName: string;
  currentPrice: number;
  avgPrice7d: number;
  discountPercent: number;
  savingsAmount: number;
  pricePerKg?: number;
  inStock: boolean;
  url: string;
  lastUpdated: string;
}

export type DealSort = 'discount' | 'price' | 'newest';

export async function getDeals(opts: {
  category?: string;
  sort?: DealSort;
  store?: string;
  limit?: number;
}): Promise<{ deals: Deal[]; total: number }> {
  const supabase = await createClient();

  let query = supabase
    .from('product_deals')
    .select('*', { count: 'exact' })
    .eq('in_stock', true)
    .gt('discount_percent', 3);

  if (opts.category && opts.category !== 'all') {
    query = query.ilike('category', `%${opts.category}%`);
  }
  if (opts.store) {
    query = query.eq('store_slug', opts.store);
  }

  // Sort
  switch (opts.sort ?? 'discount') {
    case 'discount':
      query = query.order('discount_percent', { ascending: false });
      break;
    case 'price':
      query = query.order('current_price', { ascending: true });
      break;
    case 'newest':
      query = query.order('last_updated', { ascending: false });
      break;
  }

  query = query.limit(opts.limit ?? 48);

  const { data, error, count } = await query;

  if (error || !data) return { deals: [], total: 0 };

  const deals: Deal[] = data.map((row: Record<string, unknown>) => ({
    id: String(row.id),
    productId: String(row.product_id),
    productName: String(row.product_name),
    imageUrl: String(row.image_url ?? ''),
    category: String(row.category),
    weight: String(row.weight ?? ''),
    storeSlug: String(row.store_slug),
    storeName: String(row.store_name ?? row.store_slug),
    currentPrice: Number(row.current_price),
    avgPrice7d: Number(row.avg_price_7d),
    discountPercent: Number(row.discount_percent),
    savingsAmount: Number(row.savings_amount),
    pricePerKg: row.price_per_kg ? Number(row.price_per_kg) : undefined,
    inStock: Boolean(row.in_stock),
    url: String(row.url),
    lastUpdated: String(row.last_updated),
  }));

  return { deals, total: count ?? 0 };
}

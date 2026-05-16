'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Tag, Clock, ArrowRight, TrendingDown, Percent, Sparkles, Filter, ChevronRight } from 'lucide-react';
import { getStoreConfig } from '@/lib/stores';
import { createClient } from '@/lib/supabase/client';
import dynamic from 'next/dynamic';

const CompareTray = dynamic(() => import('@/components/ui/CompareTray'), { ssr: false });

const CATEGORIES = [
  { id: 'all',        label: 'All Deals',          emoji: '🏷️' },
  { id: 'rice',       label: 'Rice & Atta',         emoji: '🌾' },
  { id: 'dal',        label: 'Dal & Pulses',         emoji: '🫘' },
  { id: 'dairy',      label: 'Dairy & Ghee',         emoji: '🧈' },
  { id: 'spices',     label: 'Masala & Spices',      emoji: '🌶️' },
  { id: 'snacks',     label: 'Snacks',               emoji: '🍘' },
  { id: 'frozen',     label: 'Frozen Food',          emoji: '🥗' },
];

export default function DealsPage() {
  const [deals, setDeals] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('all');
  const [sort, setSort] = useState('discount');
  const [comparedItems, setComparedItems] = useState<any[]>([]);

  // Fetch deals on client side for interactivity
  useEffect(() => {
    async function fetchDeals() {
      setLoading(true);
      const supabase = createClient();
      
      let query = supabase
        .from('product_deals')
        .select('*', { count: 'exact' })
        .eq('in_stock', true)
        .gt('discount_percent', 3);

      if (category !== 'all') {
        query = query.ilike('category', `%${category}%`);
      }

      if (sort === 'discount') query = query.order('discount_percent', { ascending: false });
      else if (sort === 'price') query = query.order('current_price', { ascending: true });
      else query = query.order('last_updated', { ascending: false });

      const { data, count } = await query.limit(40);
      
      if (data) {
        setDeals(data);
        setTotal(count ?? 0);
      }
      setLoading(false);
    }
    fetchDeals();
  }, [category, sort]);

  const toggleCompare = (product: any) => {
    setComparedItems(prev => {
      const exists = prev.find(item => item.id === product.product_id);
      if (exists) return prev.filter(item => item.id !== product.product_id);
      if (prev.length >= 4) return prev;
      return [...prev, {
        id: product.product_id,
        name: product.product_name,
        image_url: product.image_url,
        bestPrice: product.current_price,
      }];
    });
  };

  const minutesUntilRefresh = 45; // Simulated for UI

  return (
    <div className="min-h-screen bg-masala-bg pb-32">
      {/* ── Premium Hero ─────────────────────────────────────────────── */}
      <section className="relative pt-12 pb-20 bg-white border-b border-masala-border overflow-hidden">
        {/* Glows */}
        <div className="absolute top-0 right-0 w-1/3 h-full bg-masala-primary/5 blur-[120px] rounded-full -z-10" />
        <div className="absolute bottom-0 left-0 w-1/4 h-1/2 bg-masala-accent/5 blur-[100px] rounded-full -z-10" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center sm:text-left">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-8">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-masala-primary/10 border border-masala-primary/20 mb-6">
                <span className="flex h-2 w-2 rounded-full bg-masala-primary animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-widest text-masala-primary">
                  Live Price Drops
                </span>
              </div>
              <h1 className="text-4xl sm:text-6xl font-black text-masala-text tracking-tight leading-[1.1] mb-6"
                style={{ fontFamily: 'Fraunces, serif' }}>
                Everyday <br />
                <span className="text-masala-primary italic">Best Deals.</span>
              </h1>
              <p className="text-lg text-masala-text-muted leading-relaxed">
                We monitor 8 stores every hour to find products priced below their 
                7-day average. Save up to 40% on essentials today.
              </p>
            </div>

            <div className="flex-shrink-0 bg-white p-8 rounded-[2.5rem] border border-masala-border shadow-2xl shadow-masala-primary/5 flex flex-col items-center">
              <div className="flex items-center gap-4 mb-4">
                <div className="flex flex-col items-center">
                  <span className="text-4xl font-black text-masala-primary">{total}</span>
                  <span className="text-[10px] font-black uppercase text-masala-text-muted tracking-wider">Active Deals</span>
                </div>
                <div className="w-px h-12 bg-masala-border" />
                <div className="flex flex-col items-center">
                  <span className="text-4xl font-black text-masala-text">2h</span>
                  <span className="text-[10px] font-black uppercase text-masala-text-muted tracking-wider">Update Rate</span>
                </div>
              </div>
              <div className="flex items-center gap-2 text-[11px] font-bold text-masala-text-muted bg-masala-muted rounded-full px-4 py-2">
                <Clock className="h-3.5 w-3.5 text-masala-primary" />
                Next refresh in {minutesUntilRefresh}m
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Filters Bar ─────────────────────────────────────────────── */}
      <div className="sticky top-20 z-40 bg-white/80 backdrop-blur-md border-b border-masala-border py-4">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
            {CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => setCategory(cat.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold transition-all border whitespace-nowrap ${
                  category === cat.id
                    ? 'bg-masala-primary text-white border-masala-primary shadow-lg shadow-masala-primary/20 scale-105'
                    : 'bg-white text-masala-text-muted border-masala-border hover:border-masala-primary hover:text-masala-primary'
                }`}
              >
                <span>{cat.emoji}</span>
                {cat.label}
              </button>
            ))}
          </div>

          <div className="hidden sm:flex items-center gap-3">
            <Filter className="h-4 w-4 text-masala-text-muted" />
            <select 
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="bg-transparent text-sm font-bold text-masala-text focus:outline-none cursor-pointer"
            >
              <option value="discount">Biggest Discount</option>
              <option value="price">Lowest Price</option>
              <option value="newest">Newest Deals</option>
            </select>
          </div>
        </div>
      </div>

      {/* ── Grid ────────────────────────────────────────────────────── */}
      <main className="max-w-7xl mx-auto px-4 pt-12">
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="aspect-[3/4] bg-white rounded-[2rem] border border-masala-border animate-pulse" />
            ))}
          </div>
        ) : deals.length === 0 ? (
          <div className="text-center py-32">
            <Sparkles className="h-12 w-12 text-masala-primary mx-auto mb-6 opacity-20" />
            <h2 className="text-2xl font-black text-masala-text" style={{ fontFamily: 'Fraunces, serif' }}>
              No massive deals right now
            </h2>
            <p className="text-masala-text-muted mt-2">Check back in an hour for the next sync.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
            {deals.map((deal, idx) => {
              const storeConfig = getStoreConfig(deal.store_slug);
              const isCompared = comparedItems.some(ci => ci.id === deal.product_id);

              return (
                <div
                  key={deal.id}
                  className="group relative flex flex-col bg-white rounded-[2.2rem] border border-masala-border hover:border-masala-primary/30 transition-all duration-500 hover:shadow-2xl hover:shadow-masala-primary/5 animate-slide-up"
                  style={{ animationDelay: `${idx * 50}ms` }}
                >
                  {/* Badge */}
                  <div className="absolute top-4 right-4 z-10 flex flex-col items-end gap-2">
                    <div className="px-3 py-1.5 rounded-xl bg-masala-primary text-white text-[12px] font-black shadow-lg shadow-masala-primary/20 flex items-center gap-1.5">
                      <TrendingDown className="h-3 w-3" />
                      -{Math.round(deal.discount_percent)}%
                    </div>
                  </div>

                  {/* Image Block */}
                  <div className="relative bg-masala-muted/30 aspect-square rounded-[2rem] m-2 flex items-center justify-center overflow-hidden border border-masala-border/50 group-hover:border-masala-primary/10 transition-colors">
                    <img
                      src={deal.image_url}
                      alt={deal.product_name}
                      className="w-full h-full object-contain p-6 group-hover:scale-110 transition-transform duration-700"
                      loading="lazy"
                    />
                    
                    {/* Store Badge */}
                    <div className="absolute bottom-3 left-3 flex items-center gap-2 px-2 py-1 rounded-lg bg-white/90 backdrop-blur-sm border border-masala-border shadow-sm">
                      <span className="w-5 h-5 rounded-md flex items-center justify-center text-[9px] font-black"
                        style={{ backgroundColor: storeConfig.color, color: storeConfig.textColor }}>
                        {storeConfig.initials}
                      </span>
                      <span className="text-[10px] font-black text-masala-text uppercase tracking-wider">
                        {storeConfig.label}
                      </span>
                    </div>

                    {/* Compare Toggle */}
                    <button
                      onClick={() => toggleCompare(deal)}
                      className={`absolute top-2 left-2 w-8 h-8 rounded-xl flex items-center justify-center transition-all ${
                        isCompared 
                          ? 'bg-masala-primary text-white scale-110' 
                          : 'bg-white/80 text-masala-text-muted hover:bg-white hover:text-masala-primary opacity-0 group-hover:opacity-100'
                      }`}
                    >
                      <Filter className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Content */}
                  <div className="p-5 flex flex-col flex-1">
                    <h3 className="text-sm font-black text-masala-text line-clamp-2 leading-tight mb-4 min-h-[2.5rem]">
                      {deal.product_name}
                    </h3>

                    <div className="mt-auto space-y-4">
                      <div className="flex items-end justify-between">
                        <div>
                          <p className="text-[10px] text-masala-text-muted font-black uppercase tracking-wider mb-1">Now Only</p>
                          <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-black text-masala-primary" style={{ fontFamily: 'Fraunces, serif' }}>
                              €{deal.current_price.toFixed(2)}
                            </span>
                            <span className="text-sm text-masala-text-muted line-through opacity-50">
                              €{deal.avg_price_7d.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>

                      <a
                        href={deal.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full h-12 bg-masala-text text-white rounded-2xl flex items-center justify-center gap-2 text-sm font-black hover:bg-masala-primary active:scale-[0.98] transition-all group/btn shadow-xl shadow-masala-text/10"
                      >
                        Grab this Deal
                        <ChevronRight className="h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
                      </a>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      <CompareTray 
        items={comparedItems} 
        onRemove={(id) => setComparedItems(prev => prev.filter(i => i.id !== id))}
        onClear={() => setComparedItems([])} 
      />
    </div>
  );
}

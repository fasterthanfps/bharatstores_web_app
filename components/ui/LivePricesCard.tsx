'use client';

import { useState } from 'react';
import { Star, ExternalLink } from 'lucide-react';
import { getStoreConfig } from '@/lib/stores';

interface StorePrice {
  name: string;
  price: number;
  isBest: boolean;
}

interface DemoProduct {
  name: string;
  category: string;
  weight: string;
  image: string;
  stores: StorePrice[];
}

const DEMO_PRODUCTS: DemoProduct[] = [
  {
    name: 'Basmati Rice', category: 'Rice', weight: '5kg', image: '🌾',
    stores: [
      { name: 'Dookan', price: 8.99, isBest: true },
      { name: 'Jamoona', price: 9.49, isBest: false },
      { name: 'Grocera', price: 9.99, isBest: false },
    ],
  },
  {
    name: 'Amul Ghee', category: 'Dairy', weight: '500g', image: '🧈',
    stores: [
      { name: 'Swadesh', price: 6.49, isBest: true },
      { name: 'Dookan', price: 6.99, isBest: false },
      { name: 'Angaadi', price: 7.29, isBest: false },
    ],
  },
  {
    name: 'MDH Masala', category: 'Spices', weight: '100g', image: '🌶️',
    stores: [
      { name: 'Grocera', price: 2.79, isBest: true },
      { name: 'Jamoona', price: 2.99, isBest: false },
    ],
  },
  {
    name: 'Toor Dal', category: 'Lentils', weight: '1kg', image: '🫘',
    stores: [
      { name: 'Dookan', price: 3.49, isBest: true },
      { name: 'Little India', price: 3.79, isBest: false },
      { name: 'Swadesh', price: 3.89, isBest: false },
    ],
  },
];

interface LivePricesCardProps {
  products?: DemoProduct[];
}

export default function LivePricesCard({ products = DEMO_PRODUCTS }: LivePricesCardProps) {
  const [added, setAdded] = useState<Set<string>>(new Set());

  const toggleAdd = (name: string) => {
    setAdded(prev => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else if (next.size < 3) next.add(name);
      return next;
    });
  };

  return (
    <div className="bg-white rounded-3xl shadow-2xl p-5 max-w-[420px] border border-masala-border">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-500" />
          </span>
          <span className="text-[11px] font-black uppercase tracking-widest text-masala-text-muted">
            Live Prices
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="flex gap-0.5">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="h-3 w-3 fill-masala-primary text-masala-primary" />
            ))}
          </div>
          <span className="text-[10px] text-masala-text-muted flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
            4.9/5
          </span>
        </div>
      </div>

      {/* 2×2 Product Grid */}
      <div className="grid grid-cols-2 gap-3">
        {products.slice(0, 4).map((product, idx) => {
          const isAdded = added.has(product.name);
          const bestPrice = Math.min(...product.stores.map(s => s.price));
          return (
            <div
              key={product.name}
              className="bg-white rounded-2xl border border-masala-border p-3 flex flex-col gap-2"
              style={{ animationDelay: `${idx * 100}ms` }}
            >
              {/* Product info */}
              <div className="flex items-center gap-2">
                <span className="text-3xl leading-none">{product.image}</span>
                <div className="overflow-hidden">
                  <p className="text-[13px] font-semibold text-masala-text leading-tight line-clamp-1">
                    {product.name}
                  </p>
                  <p className="text-[10px] text-masala-text-muted">
                    {product.category} · {product.weight}
                  </p>
                </div>
              </div>

              {/* Best price */}
              <p className="text-base font-bold text-masala-primary" style={{ fontFamily: 'Fraunces, serif' }}>
                €{bestPrice.toFixed(2)}
              </p>

              {/* Store rows — FIX 5: use getStoreConfig() for consistent colors */}
              <div className="space-y-1">
                {product.stores.slice(0, 3).map(store => {
                  const cfg = getStoreConfig(store.name);
                  return (
                    <div key={store.name} className="flex items-center gap-1.5 text-[10px]">
                      <span
                        className="h-4 w-5 rounded text-[8px] font-black flex items-center justify-center flex-shrink-0"
                        style={{ background: cfg.color, color: cfg.textColor }}
                      >
                        {cfg.initials}
                      </span>
                      <span className="text-masala-text-muted flex-1 truncate">{store.name}</span>
                      {store.isBest && (
                        <span className="px-1 py-0.5 rounded bg-emerald-100 text-emerald-700 font-black text-[8px] uppercase">
                          Best
                        </span>
                      )}
                      <span className="font-semibold text-masala-text tabular-nums">
                        €{store.price.toFixed(2)}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Add to Compare */}
              <button
                onClick={() => toggleAdd(product.name)}
                className={`w-full text-[10px] font-bold py-1.5 rounded-lg border transition-all ${
                  isAdded
                    ? 'border-masala-primary text-masala-primary bg-masala-pill'
                    : 'border-masala-border text-masala-text-muted hover:border-masala-primary hover:text-masala-primary'
                }`}
              >
                {isAdded ? '✓ ADDED — REMOVE' : '＋ COMPARE'}
              </button>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between mt-4 pt-3 border-t border-masala-border">
        <a href="/search?q=basmati+rice" className="text-xs text-masala-primary font-medium hover:underline flex items-center gap-1">
          Browse all products <ExternalLink className="h-3 w-3" />
        </a>
        <span className="text-[11px] text-masala-text-light">Select 2–3 to compare</span>
      </div>
    </div>
  );
}

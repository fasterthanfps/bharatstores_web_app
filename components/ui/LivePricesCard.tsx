'use client';
import { Clock } from 'lucide-react';
import { buildRedirectUrl } from '@/lib/utm';
import { getStoreConfig } from '@/lib/stores';
import type { FeaturedProduct } from '@/lib/featured';

export default function LivePricesCard({ products }: { products: FeaturedProduct[] }) {
  // Loading state — fixed dimensions prevent layout shift
  if (!products || products.length === 0) {
    return (
      <div className="bg-white rounded-3xl shadow-xl border border-masala-border p-5 
        w-full max-w-[460px] h-[500px] flex items-center justify-center">
        <div className="text-masala-text-muted text-sm animate-pulse flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-2 border-masala-primary/30 border-t-masala-primary animate-spin" />
          Loading live prices...
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl shadow-2xl p-5 w-full max-w-[460px] min-h-[500px] border border-masala-border flex flex-col">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <span className="text-[11px] font-black uppercase tracking-[0.2em] text-masala-text-muted">
            Live Prices
          </span>
        </div>
        <div className="flex items-center gap-1 text-[11px] text-masala-text-muted">
          {'★★★★★'.split('').map((s, i) => (
            <span key={i} className="text-masala-primary text-sm">★</span>
          ))}
          <span className="ml-1 font-bold">4.9/5 Trust</span>
        </div>
      </div>

      {/* 2x2 Product Grid */}
      <div className="grid grid-cols-2 gap-3 flex-1">
        {products.map(product => (
          <div key={product.id} className="border border-masala-border rounded-2xl p-3 hover:shadow-md transition-all flex flex-col">
            
            {/* Product header */}
            <div className="flex items-start gap-2 mb-2">
              <span className="text-2xl flex-shrink-0">{product.emoji}</span>
              <div className="min-w-0">
                <a 
                  href={`/search?q=${encodeURIComponent(product.name)}`}
                  className="text-[13px] font-bold text-masala-text hover:text-masala-primary transition-colors line-clamp-1 leading-tight"
                >
                  {product.name}
                </a>
                <p className="text-[9px] text-masala-text-muted truncate">
                  {product.category} {product.weight && `· ${product.weight}`}
                </p>
              </div>
            </div>

            {/* Best price */}
            <div className="flex items-baseline gap-1 mb-2">
              <span className="text-[10px] text-masala-text-muted">from</span>
              <p className="text-lg font-black text-masala-primary" style={{ fontFamily: 'Fraunces, serif' }}>
                €{product.bestPrice.toFixed(2)}
              </p>
            </div>

            {/* Store rows — each clickable */}
            <div className="space-y-1 flex-1">
              {product.stores.slice(0, 3).map(store => {
                const config = getStoreConfig(store.storeSlug);
                const redirectUrl = buildRedirectUrl({
                  productId: product.id,
                  storeSlug: store.storeSlug,
                });
                return (
                  <a
                    key={`${product.id}-${store.storeSlug}`}
                    href={redirectUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 hover:bg-masala-muted rounded-lg px-1 py-0.5 transition-colors group"
                  >
                    <span 
                      className="w-4 h-4 rounded text-[8px] font-black flex items-center justify-center flex-shrink-0"
                      style={{ background: config.color, color: config.textColor }}
                    >
                      {config.initials}
                    </span>
                    <span className="text-[10px] text-masala-text-muted flex-1 group-hover:text-masala-text truncate">
                      {config.label}
                    </span>
                    <span className="text-[11px] font-bold text-masala-text">
                      €{store.price.toFixed(2)}
                    </span>
                  </a>
                );
              })}
            </div>

            {/* View Details link */}
            <a 
              href={`/search?q=${encodeURIComponent(product.name)}`}
              className="mt-2 text-[9px] font-bold text-center text-masala-text-muted 
                border border-masala-border hover:border-masala-primary hover:text-masala-primary 
                rounded-lg py-1 transition-all"
            >
              COMPARE STORES →
            </a>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between mt-5 pt-3 border-t border-masala-border">
        <a href="/search" className="text-[12px] font-bold text-masala-primary hover:underline">
          Browse all products ↗
        </a>
        <div className="flex items-center gap-1 text-[10px] text-masala-text-muted">
          <Clock className="h-3 w-3" />
          Prices live from 8 stores
        </div>
      </div>
    </div>
  );
}


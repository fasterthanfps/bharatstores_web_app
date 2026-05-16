import type { TrendingProduct } from '@/lib/trending';
import { ShoppingCart, Zap } from 'lucide-react';

export default function TrendingProductsStrip({ products }: { products: TrendingProduct[] }) {
  if (!products || products.length === 0) return null;

  return (
    <section className="py-12 bg-masala-bg/50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="h-8 w-1.5 rounded-full bg-masala-primary" />
            <h2 className="text-2xl font-black text-masala-text" style={{ fontFamily: 'Fraunces, serif' }}>
              Trending Deals
            </h2>
          </div>
          <a href="/search?discount=true" className="text-sm font-bold text-masala-primary hover:underline flex items-center gap-1">
            View all <span className="hidden sm:inline">deals</span> →
          </a>
        </div>

        <div className="flex overflow-x-auto gap-4 pb-4 -mx-4 px-4 scrollbar-hide">
          {products.map((product) => (
            <a
              key={product.id}
              href={`/search?q=${encodeURIComponent(product.name)}`}
              className="flex-shrink-0 w-48 sm:w-56 bg-white rounded-3xl border border-masala-border p-4 
                hover:shadow-xl hover:border-masala-primary/20 transition-all group flex flex-col"
            >
              <div className="relative aspect-[4/3] mb-4 bg-masala-muted/30 rounded-2xl overflow-hidden flex items-center justify-center">
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="w-full h-full object-contain p-3 group-hover:scale-110 transition-transform duration-500"
                  loading="lazy"
                />
                {product.discount && (
                  <span className="absolute top-2 left-2 bg-red-500 text-white text-[10px] font-black px-2 py-1 rounded-lg shadow-sm flex items-center gap-1">
                    <Zap className="h-2.5 w-2.5 fill-current" />
                    {product.discount}
                  </span>
                )}
              </div>
              
              <div className="flex flex-col flex-1">
                <h3 className="text-[13px] font-bold text-masala-text line-clamp-2 leading-tight mb-3">
                  {product.name}
                </h3>
                
                <div className="mt-auto flex items-end justify-between">
                  <div className="flex flex-col">
                    <span className="text-[9px] text-masala-text-muted font-black uppercase tracking-wider mb-0.5">Best Price</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xl font-black text-masala-primary" style={{ fontFamily: 'Fraunces, serif' }}>
                        €{product.bestPrice.toFixed(2)}
                      </span>
                      {product.oldPrice && (
                        <span className="text-[11px] text-masala-text-muted line-through">
                          €{product.oldPrice.toFixed(2)}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="w-10 h-10 rounded-xl bg-masala-primary/10 text-masala-primary flex items-center justify-center group-hover:bg-masala-primary group-hover:text-white transition-colors">
                    <ShoppingCart className="h-5 w-5" />
                  </div>
                </div>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

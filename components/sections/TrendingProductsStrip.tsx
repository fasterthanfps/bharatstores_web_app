import type { TrendingProduct } from '@/lib/trending';
import { ShoppingCart, Zap, TrendingDown } from 'lucide-react';

export default function TrendingProductsStrip({ products }: { products: TrendingProduct[] }) {
  if (!products || products.length === 0) return null;

  return (
    <section className="py-20 bg-masala-bg/30">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-masala-primary flex items-center justify-center shadow-lg shadow-masala-primary/20">
              <Zap className="h-5 w-5 text-white fill-current" />
            </div>
            <div>
              <h2 className="text-3xl font-black text-masala-text leading-none" style={{ fontFamily: 'Fraunces, serif' }}>
                Trending Deals
              </h2>
              <p className="text-xs text-masala-text-muted font-bold uppercase tracking-wider mt-1.5">Biggest price drops today</p>
            </div>
          </div>
          <a href="/search?discount=true" className="px-6 py-2.5 rounded-xl bg-white border border-masala-border text-sm font-black text-masala-text hover:border-masala-primary hover:text-masala-primary transition-all shadow-sm">
            View all deals →
          </a>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          {products.slice(0, 4).map((product) => (
            <a
              key={product.id}
              href={`/search?q=${encodeURIComponent(product.name)}`}
              className="group bg-white rounded-[2rem] border border-masala-border p-5 
                hover:shadow-2xl hover:border-masala-primary/30 transition-all duration-500 flex flex-col"
            >
              <div className="relative aspect-square mb-5 bg-masala-bg rounded-3xl overflow-hidden flex items-center justify-center border border-masala-border/50 group-hover:border-masala-primary/20 transition-colors">
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="w-full h-full object-contain p-4 group-hover:scale-110 transition-transform duration-700"
                  loading="lazy"
                />
                {product.discount && (
                  <div className="absolute top-3 left-3 bg-masala-primary text-white text-[10px] font-black px-2.5 py-1 rounded-xl shadow-lg flex items-center gap-1.5">
                    <TrendingDown className="h-3 w-3" />
                    {product.discount}
                  </div>
                )}
              </div>
              
              <div className="flex flex-col flex-1">
                <h3 className="text-sm font-black text-masala-text line-clamp-2 leading-tight mb-4 min-h-[2.5rem]">
                  {product.name}
                </h3>
                
                <div className="mt-auto flex items-center justify-between gap-2 pt-4 border-t border-masala-border/50">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-masala-text-muted font-black uppercase tracking-wider">Best Price</span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xl font-black text-masala-primary" style={{ fontFamily: 'Fraunces, serif' }}>
                        €{product.bestPrice.toFixed(2)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="w-10 h-10 rounded-2xl bg-masala-pill text-masala-text flex items-center justify-center group-hover:bg-masala-primary group-hover:text-white transition-all duration-300 shadow-sm group-hover:shadow-masala-primary/30">
                    <ShoppingCart className="h-4 w-4" />
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

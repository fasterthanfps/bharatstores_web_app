import type { Metadata } from 'next';
import HeroSearch from '@/components/search/HeroSearch';
import LivePricesCard from '@/components/ui/LivePricesCard';
import { getFeaturedProducts } from '@/lib/featured';
import { getTrendingProducts } from '@/lib/trending';
import TrendingProductsStrip from '@/components/sections/TrendingProductsStrip';
import CategoryGrid from '@/components/sections/CategoryGrid';
import HowItWorks from '@/components/sections/HowItWorks';
import StoreTrustBar from '@/components/sections/StoreTrustBar';
import CTABanner from '@/components/sections/CTABanner';

export const metadata: Metadata = {
  title: 'BharatStores.eu – Indian Grocery Price Comparison in Germany & Europe',
  description: 'Compare real-time prices for 5,000+ Indian grocery products across all major stores. Smart, fast, and 100% free.',
};

export const revalidate = 3600; // Re-fetch data every hour

export default async function Home() {
  const [featuredProducts, trendingProducts] = await Promise.all([
    getFeaturedProducts(),
    getTrendingProducts(),
  ]);

  return (
    <main className="min-h-screen bg-masala-bg">
      {/* HERO SECTION */}
      <section className="relative pt-6 sm:pt-12 pb-16 sm:pb-20 overflow-hidden">
        {/* Background elements */}
        <div className="absolute top-0 left-0 w-full h-[600px] bg-gradient-to-b from-masala-primary/5 to-transparent -z-10" />
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-masala-primary/5 blur-[120px] rounded-full -z-10" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
            
            {/* LEFT: Text & Search */}
            <div className="flex-1 text-center lg:text-left z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-masala-primary/10 border border-masala-primary/20 mb-6">
                <span className="flex h-2 w-2 rounded-full bg-masala-primary animate-pulse" />
                <span className="text-[11px] font-black uppercase tracking-widest text-masala-primary">
                  Smart Grocery Comparison · Germany
                </span>
              </div>
              
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-masala-text mb-6 tracking-tight leading-[0.95]" 
                style={{ fontFamily: 'Fraunces, serif' }}>
                Your Favorite <br />
                <span className="text-masala-primary italic">Indian Stores</span> <br />
                Side by Side.
              </h1>
              
              <p className="text-base sm:text-xl text-masala-text-muted mb-8 sm:mb-10 max-w-xl leading-relaxed">
                Compare 5,000+ products across Dookan, Jamoona, Swadesh, and more.
                Save up to 40% on every grocery run.
              </p>

              {/* Removed HeroSearch as requested */}

              {/* Trust Indicators — single scrollable row on mobile */}
              <div className="mt-8 flex flex-nowrap justify-center lg:justify-start items-center gap-3 sm:gap-6 overflow-x-auto pb-1 scrollbar-hide opacity-70 hover:opacity-100 transition-opacity duration-500">
                <span className="text-xs sm:text-sm font-bold whitespace-nowrap text-masala-text">✓ Updated Hourly</span>
                <span className="w-1 h-1 rounded-full bg-masala-text-muted flex-shrink-0" />
                <span className="text-xs sm:text-sm font-bold whitespace-nowrap text-masala-text">✓ 8 Stores</span>
                <span className="w-1 h-1 rounded-full bg-masala-text-muted flex-shrink-0" />
                <span className="text-xs sm:text-sm font-bold whitespace-nowrap text-masala-text">✓ 10k+ Comparisons</span>
              </div>
            </div>

            {/* RIGHT: Live Prices Widget */}
            <div className="w-full lg:w-auto flex justify-center lg:justify-end">
              <div className="rotate-1 hover:rotate-0 transition-transform duration-500">
                <LivePricesCard products={featuredProducts} />
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* TRENDING DEALS */}
      <TrendingProductsStrip products={trendingProducts} />

      {/* CATEGORIES */}
      <CategoryGrid />

      {/* HOW IT WORKS */}
      <HowItWorks />

      {/* STORE TRUST BAR */}
      <StoreTrustBar />

      {/* CTA BANNER */}
      <CTABanner />

    </main>
  );
}

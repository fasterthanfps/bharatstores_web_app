import type { Metadata } from 'next';
import HeroSearch from '@/components/search/HeroSearch';
import CategoryGrid from '@/components/sections/CategoryGrid';
import HowItWorks from '@/components/sections/HowItWorks';

export const metadata: Metadata = {
  title: 'BharatStores.eu – Indian Grocery Price Comparison in Germany & Europe',
  description: 'Compare real-time prices for 5,000+ Indian grocery products across all major stores. Smart, fast, and 100% free.',
};

export const revalidate = 3600; // Re-fetch data every hour

export default async function Home() {
  return (
    <main className="min-h-screen bg-masala-bg">
      {/* HERO SECTION - Search First */}
      <section className="relative pt-24 pb-32 sm:pb-44 overflow-hidden bg-white">
        {/* Background elements */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[1400px] h-[800px] bg-gradient-to-b from-masala-primary/5 to-transparent -z-10" />
        <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] bg-masala-primary/5 blur-[150px] rounded-full -z-10" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[50%] h-[50%] bg-masala-accent/5 blur-[120px] rounded-full -z-10" />

        <div className="max-w-5xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-masala-primary/10 border border-masala-primary/20 mb-8 animate-fade-in">
            <span className="flex h-2 w-2 rounded-full bg-masala-primary animate-pulse" />
            <span className="text-[11px] font-black uppercase tracking-widest text-masala-primary">
              Live Grocery Comparison · 8 Indian Stores in Germany
            </span>
          </div>
          
          <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black text-masala-text mb-8 tracking-tight leading-[0.9] animate-slide-up" 
            style={{ fontFamily: 'Fraunces, serif' }}>
            Find the Best <br />
            <span className="text-masala-primary italic underline decoration-masala-primary/20 underline-offset-8">Indian Prices.</span>
          </h1>
          
          <p className="text-lg sm:text-2xl text-masala-text-muted mb-12 max-w-2xl mx-auto leading-relaxed animate-slide-up">
            Compare 5,000+ products across Dookan, Jamoona, Swadesh, and more.
            Save up to 40% on every grocery run.
          </p>

          <div className="relative z-10 max-w-2xl mx-auto animate-slide-up">
             <HeroSearch />
          </div>

          {/* Quick Stats */}
          <div className="mt-32 flex flex-wrap justify-center items-center gap-8 sm:gap-12 opacity-60">
             <div className="flex flex-col items-center">
                <span className="text-2xl font-black text-masala-text">8</span>
                <span className="text-[10px] font-black uppercase tracking-wider text-masala-text-muted">Stores</span>
             </div>
             <div className="w-px h-8 bg-masala-border" />
             <div className="flex flex-col items-center">
                <span className="text-2xl font-black text-masala-text">5k+</span>
                <span className="text-[10px] font-black uppercase tracking-wider text-masala-text-muted">Products</span>
             </div>
             <div className="w-px h-8 bg-masala-border" />
             <div className="flex flex-col items-center">
                <span className="text-2xl font-black text-masala-text">€0</span>
                <span className="text-[10px] font-black uppercase tracking-wider text-masala-text-muted">Fee</span>
             </div>
          </div>
        </div>
      </section>

      {/* CATEGORIES */}
      <CategoryGrid />

      {/* HOW IT WORKS */}
      <HowItWorks />
    </main>
  );
}

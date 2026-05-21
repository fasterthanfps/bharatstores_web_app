'use client';

import { useRouter } from 'next/navigation';
import HeroSearch from '@/components/search/HeroSearch';
import HowItWorks from '@/components/sections/HowItWorks';
import CategoryGrid from '@/components/sections/CategoryGrid';
import HeroParticles from '@/components/home/HeroParticles';
import FloatingPriceCard from '@/components/ui/FloatingPriceCard';

const MOST_SEARCHED = ['Basmati Rice', 'Amul Ghee', 'MDH Masala', 'Toor Dal', 'Atta'];

const STATS = [
  { value: '5,000+', label: 'Products' },
  { value: '8',      label: 'Stores' },
  { value: '40%',    label: 'Avg savings' },
];

const FLOATING_CARDS = [
  {
    store: 'DOOKAN',
    storeColor: '#DBEAFE',
    storeTextColor: '#1D4ED8',
    productName: 'MDH Masala 100g',
    originalPrice: 3.49,
    currentPrice: 2.19,
    savePct: 37,
    pos: 'absolute left-4 sm:left-12 top-[15%] -rotate-3 animate-float-slow hidden sm:block',
  },
  {
    store: 'JAMOONA',
    storeColor: '#FEF9C3',
    storeTextColor: '#854D0E',
    productName: 'Basmati Rice 5kg',
    originalPrice: 12.99,
    currentPrice: 8.49,
    savePct: 35,
    pos: 'absolute right-4 sm:right-12 top-[10%] rotate-2 animate-float-medium hidden sm:block',
  },
  {
    store: 'SWADESH',
    storeColor: '#DCFCE7',
    storeTextColor: '#166534',
    productName: 'Toor Dal 1kg',
    originalPrice: 4.29,
    currentPrice: 2.79,
    savePct: 35,
    pos: 'absolute right-4 sm:right-10 bottom-[12%] -rotate-2 animate-float-slow hidden sm:block',
  },
  {
    store: 'DOOKAN',
    storeColor: '#DBEAFE',
    storeTextColor: '#1D4ED8',
    productName: 'Ghee 500ml',
    originalPrice: 8.99,
    currentPrice: 5.99,
    savePct: 33,
    pos: 'absolute left-4 sm:left-10 bottom-[8%] rotate-3 animate-float-medium hidden sm:block',
  },
];

export default function Home() {
  const router = useRouter();

  return (
    <main className="relative min-h-screen">
      {/* ── Infinite Ambient Background (Orbs + Floating Particles fixed over viewport) ── */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden" aria-hidden="true">
        {/* Ambient glowing orbs */}
        <div className="hero-orb hero-orb--primary" />
        <div className="hero-orb hero-orb--accent" />
        <div className="hero-orb hero-orb--warm" />

        {/* Floating grocery particles drifting globally across viewport */}
        <HeroParticles count={32} />
      </div>

      {/* HERO SECTION */}
      <section className="relative z-10 min-h-[calc(100vh-56px)] flex items-center overflow-hidden pt-8">
        {/* ── Floating price cards ── */}
        {FLOATING_CARDS.map((card, i) => (
          <FloatingPriceCard
            key={i}
            store={card.store}
            storeColor={card.storeColor}
            storeTextColor={card.storeTextColor}
            productName={card.productName}
            originalPrice={card.originalPrice}
            currentPrice={card.currentPrice}
            savePct={card.savePct}
            className={card.pos}
          />
        ))}

        {/* ── Main content ── */}
        <div className="relative z-10 w-full max-w-[600px] mx-auto px-6 text-center py-8">
          {/* Two badge pills */}
          <div className="flex items-center justify-center gap-2 mb-6 animate-fade-in">
            {/* Live indicator */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-masala-border shadow-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-60" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
              </span>
              <span className="text-[11px] font-black text-masala-text uppercase tracking-widest">
                Live prices
              </span>
            </div>

            {/* Region pill */}
            <div
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border"
              style={{
                background: 'rgba(139,32,32,0.08)',
                borderColor: 'rgba(139,32,32,0.20)',
              }}
            >
              <span className="text-sm">🇩🇪</span>
              <span className="text-[11px] font-bold text-masala-primary">
                8 stores in Germany
              </span>
            </div>
          </div>

          {/* Headline */}
          <h1
            className="text-5xl sm:text-6xl md:text-[4.5rem] font-black text-masala-text mb-4 tracking-tight leading-[1.0] animate-slide-up"
            style={{ fontFamily: 'Fraunces, serif' }}
          >
            Find the Best{' '}
            <span className="text-masala-primary italic underline decoration-masala-primary/20 underline-offset-4">
              Prices in Europe.
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-[17px] sm:text-[19px] text-masala-text-muted leading-relaxed max-w-[500px] mx-auto text-center mt-3 animate-slide-up animation-delay-200">
            Compare prices across 8 Indian stores in Germany. Smart, fast, and 100% free.
          </p>

          {/* Search bar directly in the middle! */}
          <div className="relative z-50 mt-8 animate-slide-up animation-delay-300">
            <HeroSearch />
          </div>

          {/* Most searched — directly below search bar */}
          <div className="flex items-center gap-2 mt-4 flex-wrap justify-center animate-fade-in animation-delay-500">
            <span className="text-[11px] text-masala-text-muted font-medium">
              Most searched:
            </span>
            {MOST_SEARCHED.map(term => (
              <button
                key={term}
                onClick={() => router.push(`/search?q=${encodeURIComponent(term)}`)}
                className="px-3 py-1 rounded-full border border-masala-border bg-white text-[12px] font-semibold text-masala-text hover:bg-masala-primary hover:text-white hover:border-masala-primary transition-all duration-150"
              >
                {term}
              </button>
            ))}
          </div>

          {/* Stat row — serving as elegant bottom anchor */}
          <div className="flex items-center justify-center gap-10 mt-10 animate-fade-in animation-delay-300">
            {STATS.map((stat, i) => (
              <div key={i} className="text-center">
                <p
                  className="text-2xl sm:text-3xl font-black text-masala-primary leading-none"
                  style={{ fontFamily: 'Fraunces, serif' }}
                >
                  {stat.value}
                </p>
                <p className="text-[11px] sm:text-[12px] text-masala-text-muted font-bold mt-1 uppercase tracking-wider">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CATEGORIES */}
      <div className="relative z-10">
        <CategoryGrid />
      </div>

      {/* HOW IT WORKS */}
      <div className="relative z-10">
        <HowItWorks />
      </div>
    </main>
  );
}

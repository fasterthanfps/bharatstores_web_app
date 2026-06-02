'use client';

import { useRouter } from 'next/navigation';
import HeroSearch from '@/components/search/HeroSearch';
import HowItWorks from '@/components/sections/HowItWorks';
import CategoryGrid from '@/components/sections/CategoryGrid';

const MOST_SEARCHED = ['Basmati Rice', 'Amul Ghee', 'MDH Masala', 'Toor Dal', 'Atta'];

const STATS = [
  { value: '5,000+', label: 'Products' },
  { value: '40%', label: 'Avg savings' },
];

export default function Home() {
  const router = useRouter();

  return (
    <main className="relative min-h-screen">
      {/* ── Light Gradient Animation Background ── */}
      <div
        className="absolute inset-0 pointer-events-none z-0 animate-gradient-shift"
        style={{
          backgroundImage: 'linear-gradient(-45deg, #FAF7F2, #FFFDF8, #FAF4E8, #F7F0E3, #FFFBF5)',
        }}
        aria-hidden="true"
      />

      {/* HERO SECTION */}
      <section className="relative z-10 min-h-[calc(100vh-56px)] flex items-center overflow-hidden pt-8">
        {/* ── Ambient Glow Orbs in the background ── */}
        <div className="hero-orb hero-orb--primary" />
        <div className="hero-orb hero-orb--accent" />
        <div className="hero-orb hero-orb--warm" />

        {/* ── Main content ── */}
        <div className="relative z-10 w-full max-w-[800px] mx-auto px-6 text-center py-8">
          {/* Badge pill */}
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
          </div>

          {/* Headline */}
          <h1
            className="text-5xl sm:text-6xl md:text-[4.5rem] font-black text-masala-text mb-4 tracking-tight leading-[1.05] animate-slide-up"
            style={{ fontFamily: 'Fraunces, serif' }}
          >
            Find the Best
            <br />
            <span className="text-masala-primary italic sm:whitespace-nowrap">
              Prices in Europe.
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-[17px] sm:text-[19px] text-masala-text-muted leading-relaxed max-w-[600px] mx-auto text-center mt-3 animate-slide-up animation-delay-200">
            Compare prices across Indian stores in Europe. Smart, fast, and 100% free.
          </p>

          {/* Search bar directly in the middle! */}
          <div className="relative z-50 mt-8 max-w-[620px] mx-auto animate-slide-up animation-delay-300">
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

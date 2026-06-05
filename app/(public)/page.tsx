'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import HeroSearch from '@/components/search/HeroSearch';
import HowItWorks from '@/components/sections/HowItWorks';
import CategoryGrid from '@/components/sections/CategoryGrid';

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
      {/* FIX 1: reduced top padding on mobile, min-h only on sm+ */}
      <section className="relative z-10 sm:min-h-[calc(100svh-56px)] flex items-center overflow-hidden pt-8 pb-12 sm:pt-16 sm:pb-20">
        {/* ── Ambient Glow Orbs in the background ── */}
        <div className="hero-orb hero-orb--primary" />
        <div className="hero-orb hero-orb--accent" />
        <div className="hero-orb hero-orb--warm" />

        {/* ── Main content ── */}
        <div className="relative z-10 w-full max-w-[800px] mx-auto px-6 text-center py-4">
          {/* Badge pill */}
          <div className="flex items-center justify-center gap-2 mb-5 animate-fade-in">
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
          <p className="text-[16px] sm:text-[19px] text-masala-text-muted leading-relaxed max-w-[600px] mx-auto text-center mt-3 animate-slide-up animation-delay-200">
            Compare prices across Indian stores in Europe. Smart, fast, and 100% free.
          </p>

          {/* FIX 5 — Search bar: full width on mobile */}
          <div className="relative z-50 mt-8 w-full sm:max-w-[620px] mx-auto animate-slide-up animation-delay-300">
            <HeroSearch />
          </div>

          {/* FIX 3 — Popular pills: horizontal scroll on mobile */}
          <div className="mt-3 w-full overflow-x-auto [&::-webkit-scrollbar]:hidden [scrollbar-width:none] animate-fade-in animation-delay-500">
            <div className="flex items-center gap-2 px-1 w-max sm:w-auto sm:flex-wrap sm:justify-center mx-auto">
              <span className="text-[11px] text-masala-text-muted font-medium flex-shrink-0">Popular:</span>
              {['Basmati Rice', 'Amul Ghee', 'MDH Masala', 'Toor Dal', 'Atta', 'Chai'].map(term => (
                <a
                  key={term}
                  href={`/search?q=${encodeURIComponent(term)}`}
                  className="flex-shrink-0 px-3 py-1.5 rounded-full border border-masala-border bg-white/80 text-[12px] font-semibold text-masala-text whitespace-nowrap hover:bg-masala-primary hover:text-white hover:border-masala-primary active:scale-95 transition-all duration-150"
                >
                  {term}
                </a>
              ))}
            </div>
          </div>

          {/* FIX 2 — Stats row: smaller on mobile */}
          <div className="flex items-center justify-center gap-4 sm:gap-8 mt-8 animate-fade-in animation-delay-300">
            {[
              { value: '5,000+', label: 'Products' },
              { value: '40%',    label: 'Avg savings' },
            ].map((stat, i, arr) => (
              <React.Fragment key={stat.label}>
                <div className="text-center hero-stat">
                  <p
                    className="text-xl sm:text-2xl lg:text-[30px] font-black text-masala-primary leading-none"
                    style={{ fontFamily: 'Fraunces, serif' }}
                  >
                    {stat.value}
                  </p>
                  <p className="text-[10px] sm:text-[11px] text-masala-text-muted font-medium mt-0.5 uppercase tracking-widest">
                    {stat.label}
                  </p>
                </div>
                {i < arr.length - 1 && <div className="w-px h-6 bg-masala-border flex-shrink-0" />}
              </React.Fragment>
            ))}
          </div>

          {/* FIX 4 — Store trust strip: mobile grid of initials (no labels under circles) */}
          <div className="sm:hidden mt-6">
            <p className="text-[10px] text-masala-text-muted text-center font-medium mb-3">
              Live prices from:
            </p>
            <div className="grid grid-cols-8 gap-1 px-2 max-w-[280px] mx-auto">
              {[
                { bg: '#DBEAFE', text: '#1D4ED8', s: 'DO' },
                { bg: '#FEF9C3', text: '#854D0E', s: 'JA' },
                { bg: '#DCFCE7', text: '#166534', s: 'SW' },
                { bg: '#EDE9FE', text: '#5B21B6', s: 'NM' },
                { bg: '#ECFDF5', text: '#065F46', s: 'SV' },
                { bg: '#F0FDF4', text: '#14532D', s: 'GR' },
                { bg: '#FFE4E6', text: '#9F1239', s: 'AN' },
                { bg: '#FEF3C7', text: '#92400E', s: 'LI' },
              ].map(s => (
                <div key={s.s} className="flex flex-col items-center">
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-[9px] font-black border border-white/50"
                    style={{ background: s.bg, color: s.text }}
                  >
                    {s.s}
                  </div>
                </div>
              ))}
            </div>
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

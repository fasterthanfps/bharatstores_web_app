import type { Metadata } from 'next';
import HeroSearch from '@/components/search/HeroSearch';
import HowItWorks from '@/components/sections/HowItWorks';
import CategoryGrid from '@/components/sections/CategoryGrid';
import HeroParticles from '@/components/home/HeroParticles';
import HeroFloatingBadges from '@/components/home/HeroFloatingBadges';

export const metadata: Metadata = {
  title: 'BharatStores.eu – Indian Grocery Price Comparison in Europe',
  description: 'Compare real-time prices for 5,000+ Indian grocery products across all major stores in Europe. Smart, fast, and 100% free.',
};

export const revalidate = 3600; // Re-fetch data every hour

export default async function Home() {
  return (
    <main className="min-h-screen bg-masala-bg">
      {/* HERO SECTION - Search First */}
      <section className="hero-section relative pt-24 pb-32 sm:pb-44 overflow-hidden">
        {/* ── Warm gradient background ── */}
        <div className="absolute inset-0 hero-bg-gradient -z-20" />

        {/* ── Dot grid texture overlay ── */}
        <div className="absolute inset-0 hero-dot-grid -z-10 opacity-40" />

        {/* ── Ambient glowing orbs ── */}
        <div className="hero-orb hero-orb--primary" />
        <div className="hero-orb hero-orb--accent" />
        <div className="hero-orb hero-orb--warm" />

        {/* ── Floating grocery particles (client) ── */}
        <HeroParticles count={24} />

        {/* ── Floating live-deal badges (client) ── */}
        <HeroFloatingBadges />

        {/* ── Main content ── */}
        <div className="max-w-5xl mx-auto px-4 text-center relative z-10">
          {/* Live pill */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full
                          bg-white/80 backdrop-blur-sm shadow-sm
                          border border-masala-primary/20 mb-8 animate-fade-in">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-masala-primary opacity-60" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-masala-primary" />
            </span>
            <span className="text-[11px] font-black uppercase tracking-widest text-masala-primary">
              Live Grocery Comparison · Indian Stores in Europe
            </span>
          </div>

          {/* Headline */}
          <h1
            className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black text-masala-text mb-8 tracking-tight leading-[0.9] animate-slide-up"
            style={{ fontFamily: 'Fraunces, serif' }}
          >
            Find the Best <br />
            <span className="text-masala-primary italic underline decoration-masala-primary/20 underline-offset-8">
              Prices in Europe.
            </span>
          </h1>

          {/* Sub-headline */}
          <p className="text-lg sm:text-2xl text-masala-text-muted mb-12 max-w-2xl mx-auto leading-relaxed animate-slide-up animation-delay-200">
            Compare 5,000+ products across Dookan, Jamoona, Swadesh, and more.{' '}
            <strong className="text-masala-primary font-semibold">Save up to 40%</strong> on every grocery run in Europe.
          </p>

          {/* Search */}
          <div className="relative z-10 max-w-2xl mx-auto animate-slide-up animation-delay-300">
            <HeroSearch />
          </div>

          {/* Trust badges */}
          <div className="mt-10 flex flex-wrap justify-center gap-3 animate-fade-in animation-delay-500">
            {[
              { icon: '🛡️', text: 'Always free' },
              { icon: '⚡', text: 'Real-time prices' },
              { icon: '🏪', text: '8 stores compared' },
              { icon: '🇮🇳', text: '5,000+ Indian products' },
            ].map((badge) => (
              <span key={badge.text} className="hero-trust-badge">
                {badge.icon} {badge.text}
              </span>
            ))}
          </div>

          {/* Quick Stats */}
          <div className="mt-16 flex flex-wrap justify-center items-center gap-8 sm:gap-12">
            {[
              { value: '8', label: 'Stores' },
              { value: '5k+', label: 'Products' },
              { value: '€0', label: 'Fee' },
              { value: '40%', label: 'Max Savings' },
            ].map((stat, i) => (
              <div key={stat.label} className="flex items-center gap-8 sm:gap-12">
                {i > 0 && <div className="w-px h-8 bg-masala-border opacity-50 hidden sm:block" />}
                <div className="flex flex-col items-center hero-stat">
                  <span className="text-2xl font-black text-masala-text">{stat.value}</span>
                  <span className="text-[10px] font-black uppercase tracking-wider text-masala-text-muted">
                    {stat.label}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Bottom wave divider ── */}
        <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-[0] pointer-events-none">
          <svg
            viewBox="0 0 1440 60"
            preserveAspectRatio="none"
            className="w-full h-[60px]"
            aria-hidden="true"
          >
            <path
              d="M0,30 C360,60 1080,0 1440,30 L1440,60 L0,60 Z"
              fill="var(--color-masala-bg, #FAF7F2)"
            />
          </svg>
        </div>
      </section>

      {/* CATEGORIES */}
      <CategoryGrid />

      {/* HOW IT WORKS */}
      <HowItWorks />
    </main>
  );
}

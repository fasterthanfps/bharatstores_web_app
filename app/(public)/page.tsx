import type { Metadata } from 'next';
import Link from 'next/link';
import SearchAutocomplete from '@/components/search/SearchAutocomplete';
import LivePricesCard from '@/components/ui/LivePricesCard';
import CategoryTile from '@/components/ui/CategoryTile';
import PopularSearches from '@/components/ui/PopularSearches';
import { ShoppingBasket, ArrowRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'BharatStores.eu – Indian Grocery Price Comparison in Germany & Europe',
  description:
    'Compare real-time prices for 5,000+ Indian grocery products across Dookan, Jamoona, Swadesh, Grocera and more. Smart, fast, and 100% free.',
};

const STORES = ['Grocera', 'Jamoona', 'Little India', 'Dookan', 'Swadesh'];

const CATEGORIES = [
  { emoji: '🌾', name: 'Atta & Rice', query: 'atta rice' },
  { emoji: '🫘', name: 'Dal & Pulses', query: 'dal pulses' },
  { emoji: '🧈', name: 'Dairy & Ghee', query: 'ghee dairy' },
  { emoji: '🌶️', name: 'Masala & Spices', query: 'masala spices' },
  { emoji: '🍵', name: 'Tea & Coffee', query: 'tea coffee' },
  { emoji: '🫙', name: 'Pickles & Chutneys', query: 'pickles chutney' },
  { emoji: '🍘', name: 'Snacks', query: 'snacks namkeen' },
  { emoji: '🧴', name: 'Personal Care', query: 'personal care' },
  { emoji: '🥗', name: 'Frozen Food', query: 'frozen food' },
  { emoji: '🏠', name: 'Home Essentials', query: 'home essentials' },
];

const HOW_IT_WORKS = [
  {
    num: '1',
    icon: '🔍',
    title: 'Search',
    desc: 'Type any product in English or German',
  },
  {
    num: '2',
    icon: '📊',
    title: 'Compare',
    desc: 'See live prices from all Indian stores side by side',
  },
  {
    num: '3',
    icon: '🛒',
    title: 'Buy',
    desc: 'Click through to the best deal and save',
  },
];

export default function LandingPage() {
  return (
    <div className="bg-masala-bg min-h-screen">

      {/* ── SECTION 1: HERO ─────────────────────────────────────────────── */}
      <section className="relative overflow-hidden pt-14 pb-20 sm:pt-20 sm:pb-28">
        {/* Dot pattern overlay */}
        <div className="absolute inset-0 pointer-events-none opacity-60"
          style={{ backgroundImage: 'radial-gradient(circle, #D4C5B0 1px, transparent 1px)', backgroundSize: '24px 24px' }} />

        {/* Gradient blobs */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full bg-masala-primary/5 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-masala-accent/5 blur-[100px] pointer-events-none" />

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-14 lg:gap-20">

            {/* LEFT COLUMN — 55% */}
            <div className="flex-[55] text-center lg:text-left space-y-8 animate-fade-in">
              {/* Pill badge */}
              <div className="inline-flex items-center gap-2 border border-masala-primary/40 text-masala-primary rounded-full px-5 py-2 text-xs font-black uppercase tracking-[0.15em]">
                <ShoppingBasket className="h-4 w-4" />
                One Search. Every Indian Store.
              </div>

              {/* Headline */}
              <h1
                className="text-[64px] sm:text-[80px] font-black leading-[1.02] tracking-tight text-masala-text"
                style={{ fontFamily: 'Fraunces, serif' }}
              >
                Save on your
                <br />
                <span
                  className="text-masala-primary italic"
                  style={{ display: 'inline-block', transform: 'rotate(-1.5deg)', transformOrigin: 'left' }}
                >
                  Groceries.
                </span>
              </h1>

              {/* Subtitle */}
              <p className="text-masala-text-muted text-lg sm:text-xl max-w-xl leading-relaxed mx-auto lg:mx-0">
                Compare real-time prices for 5,000+ products across all major Indian online shops in Europe.
                Smart, fast, and 100% free.
              </p>

              {/* SearchBar */}
              <div className="max-w-xl mx-auto lg:mx-0">
                <SearchAutocomplete size="hero" autoFocus />
              </div>

              {/* Store logos */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-6 pt-2 opacity-40 grayscale hover:opacity-100 hover:grayscale-0 transition-all duration-500">
                {STORES.map((s) => (
                  <span key={s} className="text-[11px] font-black tracking-widest text-masala-text uppercase">
                    {s}
                  </span>
                ))}
              </div>
            </div>

            {/* RIGHT COLUMN — 45% (hidden on mobile) */}
            <div className="flex-[45] w-full hidden lg:flex justify-center animate-scale-in" style={{ animationDelay: '200ms' }}>
              <div className="rotate-1 drop-shadow-2xl">
                <LivePricesCard />
              </div>
            </div>

            {/* MOBILE: compact horizontal scroll mini-cards */}
            <div className="flex lg:hidden w-full overflow-x-auto gap-3 pb-2 -mx-4 px-4 scroll-x-snap">
              {['Basmati Rice 🌾', 'Amul Ghee 🧈', 'MDH Masala 🌶️'].map((item) => (
                <div key={item} className="flex-shrink-0 w-[75vw] bg-white rounded-2xl border border-masala-border p-4 shadow-sm scroll-snap-align-start">
                  <p className="text-sm font-bold text-masala-text mb-1">{item.split(' ').slice(0, -1).join(' ')}</p>
                  <p className="text-lg font-black text-masala-primary" style={{ fontFamily: 'Fraunces, serif' }}>from €2.99</p>
                  <p className="text-xs text-masala-text-muted mt-1">Compare 3–5 stores →</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION 2: QUICK CATEGORIES ────────────────────────────────── */}
      <section className="py-16 bg-white/50 border-y border-masala-border/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2
            className="text-[28px] font-black text-masala-text mb-8 text-center lg:text-left"
            style={{ fontFamily: 'Fraunces, serif' }}
          >
            Shop by Category
          </h2>
          {/* Desktop: 5-col grid. Mobile: horizontal scroll */}
          <div className="hidden sm:grid grid-cols-5 gap-4">
            {CATEGORIES.map((cat) => (
              <div key={cat.name} className="flex justify-center">
                <CategoryTile emoji={cat.emoji} name={cat.name} query={cat.query} />
              </div>
            ))}
          </div>
          {/* Mobile: 2-col grid */}
          <div className="sm:hidden grid grid-cols-4 gap-2">
            {CATEGORIES.map((cat) => (
              <div key={cat.name} className="flex justify-center">
                <CategoryTile emoji={cat.emoji} name={cat.name} query={cat.query} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION 3: POPULAR SEARCHES ────────────────────────────────── */}
      <PopularSearches />

      {/* ── SECTION 4: HOW IT WORKS ────────────────────────────────────── */}
      <section className="py-20 bg-white/40 border-y border-masala-border/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2
            className="text-[28px] font-black text-masala-text mb-12 text-center"
            style={{ fontFamily: 'Fraunces, serif' }}
          >
            How It Works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {HOW_IT_WORKS.map((step, i) => (
              <div
                key={step.num}
                className="flex flex-col items-center text-center gap-5 animate-fade-in"
                style={{ animationDelay: `${i * 150}ms` }}
              >
                <div className="relative">
                  <div className="w-16 h-16 rounded-2xl bg-masala-pill border border-masala-border flex items-center justify-center text-3xl">
                    {step.icon}
                  </div>
                  <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-masala-primary text-white text-xs font-black flex items-center justify-center">
                    {step.num}
                  </span>
                </div>
                <h3 className="text-xl font-black text-masala-text" style={{ fontFamily: 'Fraunces, serif' }}>
                  {step.title}
                </h3>
                <p className="text-masala-text-muted text-sm leading-relaxed max-w-xs">
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION 5: CTA BANNER ───────────────────────────────────────── */}
      <section className="py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="relative rounded-3xl overflow-hidden bg-masala-primary p-10 sm:p-20 text-center">
            {/* Dot pattern */}
            <div className="absolute inset-0 opacity-10 pointer-events-none">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_white_1px,_transparent_1px)] bg-[size:32px_32px]" />
            </div>
            <div className="relative z-10 max-w-2xl mx-auto space-y-8">
              <h2
                className="text-3xl sm:text-5xl font-black text-white leading-tight"
                style={{ fontFamily: 'Fraunces, serif' }}
              >
                Ready to save on your next grocery run?
              </h2>
              <p className="text-white/70 text-lg font-medium">
                Join thousands of smart shoppers finding the best deals on Indian food daily.
              </p>
              <Link
                href="/search?q=basmati rice"
                className="inline-flex items-center gap-2 border-2 border-white text-white font-bold px-8 py-4 rounded-2xl hover:bg-white hover:text-masala-primary transition-all duration-300 group"
              >
                Get Started for Free →
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}

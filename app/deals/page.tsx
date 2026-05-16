import type { Metadata } from 'next';
import Link from 'next/link';
import { getDeals } from '@/lib/deals';
import { getStoreConfig } from '@/lib/stores';
import { buildRedirectUrl } from '@/lib/utm';
import { Tag, Clock, ArrowRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Best Deals Today — BharatStores.eu',
  description:
    'Browse the best deals on Indian groceries in Germany. Products below their 7-day average price, updated every 2 hours.',
};

export const revalidate = 7200; // 2 hours

const CATEGORIES = [
  { id: 'all',        label: 'All Deals',          emoji: '🏷️' },
  { id: 'atta',       label: 'Atta & Rice',         emoji: '🌾' },
  { id: 'dal',        label: 'Dal & Pulses',         emoji: '🫘' },
  { id: 'dairy',      label: 'Dairy & Ghee',         emoji: '🧈' },
  { id: 'masala',     label: 'Masala & Spices',      emoji: '🌶️' },
  { id: 'tea',        label: 'Tea & Coffee',         emoji: '🍵' },
  { id: 'snacks',     label: 'Snacks',               emoji: '🍘' },
  { id: 'personal',   label: 'Personal Care',        emoji: '🧴' },
  { id: 'frozen',     label: 'Frozen Food',          emoji: '🥗' },
  { id: 'home',       label: 'Home Essentials',      emoji: '🏠' },
];

const SORT_OPTIONS = [
  { id: 'discount', label: 'Biggest Discount' },
  { id: 'price',    label: 'Lowest Price' },
  { id: 'newest',   label: 'Newest' },
];

interface PageProps {
  searchParams: Promise<{ category?: string; sort?: string; store?: string }>;
}

export default async function DealsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const category = params.category ?? 'all';
  const sort = (params.sort as 'discount' | 'price' | 'newest') ?? 'discount';

  const { deals, total } = await getDeals({
    category: category === 'all' ? undefined : category,
    sort,
    limit: 48,
  });

  const now = new Date();
  const nextRefresh = new Date(Math.ceil(now.getTime() / 7_200_000) * 7_200_000);
  const minutesUntilRefresh = Math.round((nextRefresh.getTime() - now.getTime()) / 60_000);

  return (
    <div className="min-h-screen bg-masala-bg">

      {/* ── Page Header ─────────────────────────────────────────────── */}
      <div className="bg-white border-b border-masala-border">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-10 h-10 rounded-2xl bg-masala-primary/10 flex items-center justify-center">
                  <Tag className="h-5 w-5 text-masala-primary" />
                </div>
                <span className="text-[11px] font-black uppercase tracking-[0.2em] text-masala-text-muted">
                  Limited Time Savings
                </span>
              </div>
              <h1
                className="text-4xl sm:text-[48px] font-black text-masala-text leading-tight"
                style={{ fontFamily: 'Fraunces, serif' }}
              >
                🏷️ Best Deals Today
              </h1>
              <p className="text-masala-text-muted mt-2 text-base">
                <span className="font-bold text-masala-primary">{total}</span> deals found —
                updated every 2 hours
              </p>
            </div>
            <div className="flex items-center gap-2 text-[12px] text-masala-text-muted bg-masala-muted rounded-xl px-4 py-2.5">
              <Clock className="h-4 w-4" />
              <span>Next refresh in <strong>{minutesUntilRefresh}m</strong></span>
            </div>
          </div>
        </div>

        {/* ── Category Tabs ─────────────────────────────────────────── */}
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex gap-2 overflow-x-auto pb-3 scrollbar-hide -mb-px">
            {CATEGORIES.map((cat) => {
              const active = category === cat.id;
              return (
                <Link
                  key={cat.id}
                  href={`/deals?category=${cat.id}&sort=${sort}`}
                  className={`flex items-center gap-1.5 whitespace-nowrap px-4 py-2 rounded-full text-[13px] font-bold border transition-all flex-shrink-0 ${
                    active
                      ? 'bg-masala-primary text-white border-masala-primary shadow-sm'
                      : 'bg-white text-masala-text-muted border-masala-border hover:border-masala-primary hover:text-masala-primary'
                  }`}
                >
                  <span>{cat.emoji}</span>
                  <span>{cat.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Sort Bar ────────────────────────────────────────────────── */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-5 flex items-center gap-3 flex-wrap">
        <span className="text-sm font-medium text-masala-text-muted">Sort by:</span>
        {SORT_OPTIONS.map((opt) => (
          <Link
            key={opt.id}
            href={`/deals?category=${category}&sort=${opt.id}`}
            className={`px-3.5 py-1.5 rounded-lg text-[13px] font-bold border transition-all ${
              sort === opt.id
                ? 'bg-masala-text text-white border-masala-text'
                : 'bg-white text-masala-text-muted border-masala-border hover:border-masala-text hover:text-masala-text'
            }`}
          >
            {opt.label}
          </Link>
        ))}
      </div>

      {/* ── Deals Grid ──────────────────────────────────────────────── */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-20">
        {deals.length === 0 ? (
          <div className="text-center py-24">
            <p className="text-5xl mb-4">🏷️</p>
            <h2 className="text-2xl font-black text-masala-text mb-2" style={{ fontFamily: 'Fraunces, serif' }}>
              No deals right now
            </h2>
            <p className="text-masala-text-muted mb-6">
              Check back soon — deals are updated every 2 hours as prices change.
            </p>
            <Link
              href="/search"
              className="inline-flex items-center gap-2 bg-masala-primary text-white px-6 py-3 rounded-xl font-bold hover:bg-masala-secondary transition-colors"
            >
              Browse all products <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {deals.map((deal, idx) => {
              const storeConfig = getStoreConfig(deal.storeSlug);
              const redirectUrl = buildRedirectUrl({
                productId: deal.productId,
                storeSlug: deal.storeSlug,
              });
              return (
                <div
                  key={deal.id}
                  className="bg-white rounded-2xl border border-masala-border overflow-hidden hover:shadow-md transition-all duration-300 flex flex-col group animate-card"
                  style={{ animationDelay: `${(idx % 12) * 40}ms` }}
                >
                  {/* Image */}
                  <div className="relative aspect-square bg-masala-muted/30 flex items-center justify-center p-3 overflow-hidden">
                    {deal.imageUrl ? (
                      <img
                        src={deal.imageUrl}
                        alt={deal.productName}
                        className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <span className="text-4xl group-hover:scale-110 transition-transform duration-500">🛒</span>
                    )}

                    {/* Store badge */}
                    <span
                      className="absolute top-2 left-2 px-1.5 py-0.5 rounded text-[8px] font-black uppercase"
                      style={{ background: storeConfig.color, color: storeConfig.textColor }}
                    >
                      {storeConfig.initials}
                    </span>

                    {/* Discount badge */}
                    <span className="absolute top-2 right-2 px-2 py-1 rounded-full bg-masala-primary text-white text-[10px] font-black shadow-sm">
                      -{Math.round(deal.discountPercent)}%
                    </span>
                  </div>

                  {/* Info */}
                  <div className="p-3 flex flex-col gap-1.5 flex-1">
                    <p className="text-[12px] sm:text-[13px] font-bold text-masala-text leading-tight line-clamp-2">
                      {deal.productName}
                    </p>
                    {deal.weight && (
                      <p className="text-[10px] text-masala-text-muted">{deal.weight}</p>
                    )}

                    {/* Price row */}
                    <div className="flex items-baseline gap-2 mt-auto">
                      <span
                        className="text-[20px] font-black text-masala-primary leading-none"
                        style={{ fontFamily: 'Fraunces, serif' }}
                      >
                        €{deal.currentPrice.toFixed(2)}
                      </span>
                      <span className="text-[11px] text-masala-text-muted line-through">
                        €{deal.avgPrice7d.toFixed(2)}
                      </span>
                    </div>

                    {/* Savings line */}
                    <p className="text-[11px] font-bold text-emerald-600">
                      Save €{deal.savingsAmount.toFixed(2)} vs 7d avg
                    </p>

                    {/* Store + timing */}
                    <div className="flex items-center justify-between text-[10px] text-masala-text-muted">
                      <span>{storeConfig.label}</span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-2.5 w-2.5" />
                        Refresh in {minutesUntilRefresh}m
                      </span>
                    </div>

                    {/* CTA */}
                    <a
                      href={redirectUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full mt-1 h-9 bg-masala-primary text-white text-[12px] font-black rounded-xl flex items-center justify-center gap-1.5 hover:bg-masala-secondary active:scale-[0.97] transition-all shadow-sm"
                    >
                      🛒 Buy Now
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

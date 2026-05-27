'use client';
import { useState, useEffect, Suspense, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Bell, CheckCircle2, ChevronRight, Search,
  SlidersHorizontal, ArrowUpDown, Clock, Flame,
  Sparkles, TrendingUp, Coins, Percent, Tag,
  ExternalLink, RefreshCw, BarChart2, Store
} from 'lucide-react';
import Link from 'next/link';
import { useLang } from '@/lib/utils/LanguageContext';

// ── Types ──────────────────────────────────────────────────────────
interface Deal {
  productId: string;
  listingId: string;
  term: string;
  rawTerm: string;
  category: string;
  imageUrl: string;
  bestPrice: number;
  comparePrice: number;
  storeName: string;
  storeId: string;
  weightLabel: string;
  discountPercent: number;
  savingsAmount: number;
  pricePerKg: number | null;
  storeUrl: string;
  lastUpdated: string;
}

interface DealStats {
  total: number;
  avgDiscount: number;
  storeCount: number;
  totalSavings: number;
}

// ── Store color map ────────────────────────────────────────────────
const STORE_COLORS: Record<string, { bg: string; text: string }> = {
  dookan:       { bg: '#DBEAFE', text: '#1D4ED8' },
  jamoona:      { bg: '#FEF9C3', text: '#854D0E' },
  swadesh:      { bg: '#DCFCE7', text: '#166534' },
  nammamarkt:   { bg: '#EDE9FE', text: '#5B21B6' },
  angaadi:      { bg: '#FFE4E6', text: '#9F1239' },
  dostana:      { bg: '#FFEDD5', text: '#C2410C' },
  spicevillage: { bg: '#ECFDF5', text: '#065F46' },
  grocera:      { bg: '#F0FDF4', text: '#14532D' },
};
function storeColor(slug: string) {
  return STORE_COLORS[slug?.toLowerCase()] ?? { bg: '#F3F4F6', text: '#374151' };
}

// ── Countdown timer ────────────────────────────────────────────────
function FlashCountdown() {
  const [t, setT] = useState({ h: 0, m: 0, s: 0 });
  useEffect(() => {
    const target = new Date(); target.setHours(23, 59, 59, 999);
    const tick = () => {
      const diff = target.getTime() - Date.now();
      if (diff <= 0) { setT({ h: 0, m: 0, s: 0 }); return; }
      setT({
        h: Math.floor(diff / 3600000),
        m: Math.floor((diff / 60000) % 60),
        s: Math.floor((diff / 1000) % 60),
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  const f = (n: number) => String(n).padStart(2, '0');
  return (
    <div className="flex items-center gap-1.5 font-bold text-[11px] sm:text-xs bg-red-500/10 text-red-600 px-3 py-1.5 rounded-full border border-red-200/50 shadow-sm animate-pulse">
      <Clock className="w-3.5 h-3.5" />
      <span className="tracking-wider uppercase">Ends in: {f(t.h)}h {f(t.m)}m {f(t.s)}s</span>
    </div>
  );
}

// ── Live stats bar ─────────────────────────────────────────────────
function StatsBar({ stats }: { stats: DealStats | null }) {
  if (!stats) return null;
  return (
    <div className="flex flex-wrap items-center gap-4 sm:gap-8 mb-8 px-5 py-3.5 bg-white/70 backdrop-blur-md border border-masala-border rounded-2xl shadow-sm animate-fade-in">
      <StatPill icon={<Tag className="w-3.5 h-3.5" />} value={String(stats.total)} label="Active Deals" />
      <StatPill icon={<Percent className="w-3.5 h-3.5" />} value={`${stats.avgDiscount}%`} label="Avg Discount" color="text-green-600" />
      <StatPill icon={<Store className="w-3.5 h-3.5" />} value={String(stats.storeCount)} label="Stores" />
      <StatPill icon={<Coins className="w-3.5 h-3.5" />} value={`€${stats.totalSavings.toFixed(0)}`} label="Total Savings" color="text-masala-primary" />
    </div>
  );
}
function StatPill({ icon, value, label, color = 'text-masala-text' }: { icon: React.ReactNode; value: string; label: string; color?: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-masala-text-muted">{icon}</span>
      <span className={`text-base font-black ${color}`}>{value}</span>
      <span className="text-xs text-masala-text-muted font-semibold">{label}</span>
    </div>
  );
}

// ── Savings toast ticker ───────────────────────────────────────────
const TICKS = [
  { item: 'Aashirwad Ghee', store: 'Jamoona', savings: '€2.50', ago: '2m' },
  { item: 'MDH Kitchen King', store: 'Dookan', savings: '€0.80', ago: '5m' },
  { item: 'Heera Toor Dal 2kg', store: 'Swadesh', savings: '€1.20', ago: '8m' },
  { item: "Haldiram's Bhujia", store: 'Jamoona', savings: '€0.45', ago: '12m' },
  { item: 'Elephant Atta 10kg', store: 'Dookan', savings: '€4.10', ago: '15m' },
];
function SavingsTicker() {
  const [idx, setIdx] = useState(0);
  const [show, setShow] = useState(true);
  useEffect(() => {
    const id = setInterval(() => {
      setShow(false);
      setTimeout(() => { setIdx(p => (p + 1) % TICKS.length); setShow(true); }, 500);
    }, 7000);
    return () => clearInterval(id);
  }, []);
  if (!show) return null;
  const s = TICKS[idx];
  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-xs bg-white/95 backdrop-blur-md rounded-2xl border border-masala-border p-3.5 shadow-2xl flex items-center gap-3 animate-fade-in pointer-events-none">
      <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center text-base flex-shrink-0 animate-bounce">🔥</div>
      <div>
        <p className="text-xs font-semibold text-masala-text">Saved <span className="font-black text-green-600">{s.savings}</span> on {s.item}</p>
        <p className="text-[10px] text-masala-text-light mt-0.5 font-bold uppercase tracking-wider">via {s.store} · {s.ago} ago</p>
      </div>
    </div>
  );
}

// ── Deal Card ──────────────────────────────────────────────────────
function DealCard({ deal, flash = false }: { deal: Deal; flash?: boolean }) {
  const sc = storeColor(deal.storeId);
  const discount = Math.round(deal.discountPercent);
  const isHot = discount >= 20;
  const searchTerm = deal.term.replace(/\s*\d+\s*(g|kg|ml|l|oz)\s*$/i, '').trim();

  return (
    <div className={`bg-white/90 backdrop-blur-md rounded-2xl border p-3 relative flex flex-col h-full listing-card group ${
      flash ? 'border-red-300/70 shadow-md shadow-red-100/30' : 'border-masala-border'
    }`}>
      <div className={`absolute top-2 right-2 text-white text-[10px] font-black px-2 py-1 rounded-xl z-10 flex items-center gap-0.5 shadow-sm ${
        isHot ? 'bg-red-500 animate-pulse' : 'bg-masala-accent'
      }`}>
        {isHot && <Flame className="w-3 h-3 fill-white" />}
        -{discount}%
      </div>

      <div className="aspect-square rounded-xl bg-masala-muted/30 mb-3 relative overflow-hidden flex items-center justify-center p-2 group-hover:scale-[1.02] transition-transform duration-300">
        {deal.imageUrl ? (
          <img src={deal.imageUrl} alt={deal.term} className="w-full h-full object-contain mix-blend-multiply transition-transform duration-300 group-hover:scale-105" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl">🛒</div>
        )}
        <span className="absolute bottom-1.5 left-1.5 px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider shadow-sm"
          style={{ background: sc.bg, color: sc.text }}>
          {deal.storeName}
        </span>
      </div>

      <div className="flex-1 flex flex-col">
        <h3 className="text-xs sm:text-sm font-bold text-masala-text line-clamp-2 leading-snug mb-1 group-hover:text-masala-primary transition-colors">
          {deal.term}
        </h3>
        {deal.weightLabel && (
          <p className="text-[11px] text-masala-text-light font-semibold mb-1.5">{deal.weightLabel}</p>
        )}
        <div className="mt-auto pt-2.5 border-t border-masala-muted space-y-1.5">
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="text-base sm:text-lg font-black text-masala-primary leading-none">
              €{deal.bestPrice.toFixed(2)}
            </span>
            <span className="text-[11px] text-masala-text-light line-through font-semibold">
              €{deal.comparePrice.toFixed(2)}
            </span>
          </div>
          <p className="text-[11px] font-extrabold text-green-600 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" />
            Save €{deal.savingsAmount.toFixed(2)}
            {deal.pricePerKg && (
              <span className="text-masala-text-muted font-semibold ml-auto">€{deal.pricePerKg.toFixed(2)}/kg</span>
            )}
          </p>
          <a href={deal.storeUrl} target="_blank" rel="noopener noreferrer"
            className="w-full py-2 bg-masala-primary text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1 hover:bg-masala-secondary transition-all shadow-sm cursor-pointer">
            Buy Now <ExternalLink className="w-3 h-3" />
          </a>
          <Link href={`/search?q=${encodeURIComponent(searchTerm)}`}
            className="w-full py-1.5 border border-masala-border text-masala-text-muted rounded-xl font-semibold text-[11px] flex items-center justify-center gap-1 hover:border-masala-primary hover:text-masala-primary transition-all cursor-pointer">
            <BarChart2 className="w-3 h-3" /> Compare all stores
          </Link>
        </div>
      </div>
    </div>
  );
}

function DealCardSkeleton() {
  return (
    <div className="bg-white/80 rounded-2xl border border-masala-border p-3 flex flex-col h-full animate-pulse">
      <div className="aspect-square rounded-xl bg-masala-muted mb-3" />
      <div className="h-3.5 bg-masala-muted rounded w-full mb-1" />
      <div className="h-3.5 bg-masala-muted rounded w-2/3 mb-4" />
      <div className="mt-auto">
        <div className="h-5 bg-masala-muted rounded w-1/2 mb-1.5" />
        <div className="h-3 bg-masala-muted rounded w-1/3 mb-3" />
        <div className="h-8 bg-masala-muted rounded-xl w-full mb-1.5" />
        <div className="h-6 bg-masala-muted rounded-xl w-full" />
      </div>
    </div>
  );
}

// ── Main content ───────────────────────────────────────────────────
function DealsContent() {
  const { t } = useLang();
  const router = useRouter();
  const searchParams = useSearchParams();

  const typeParam = searchParams.get('type') || 'percentage';
  const catParam  = searchParams.get('cat')  || '';

  const [deals, setDeals]               = useState<Deal[]>([]);
  const [flashDeals, setFlashDeals]     = useState<Deal[]>([]);
  const [stats, setStats]               = useState<DealStats | null>(null);
  const [loading, setLoading]           = useState(true);
  const [total, setTotal]               = useState(0);
  const [page, setPage]                 = useState(1);
  const [loadingMore, setLoadingMore]   = useState(false);
  const [email, setEmail]               = useState('');
  const [frequency, setFrequency]       = useState('daily');
  const [subscribing, setSubscribing]   = useState(false);
  const [subscribed, setSubscribed]     = useState(false);
  const [showForm, setShowForm]         = useState(false);
  const [searchTerm, setSearchTerm]     = useState('');
  const [selectedStore, setSelectedStore] = useState('');
  const [sortBy, setSortBy]             = useState('discount');

  useEffect(() => {
    fetch('/api/deals/stats').then(r => r.json()).then(setStats).catch(() => {});
  }, []);

  useEffect(() => {
    fetch('/api/deals?type=flash')
      .then(r => r.json())
      .then(d => setFlashDeals(d.deals || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true); setDeals([]); setPage(1); setSearchTerm(''); setSelectedStore('');
    let url = `/api/deals?type=${typeParam}&page=1`;
    if (typeParam === 'category' && catParam) url += `&cat=${encodeURIComponent(catParam)}`;
    fetch(url)
      .then(r => r.json())
      .then(d => { setDeals(d.deals || []); setTotal(d.total || 0); setLoading(false); })
      .catch(() => setLoading(false));
  }, [typeParam, catParam]);

  const loadMore = useCallback(async () => {
    setLoadingMore(true);
    const next = page + 1;
    let url = `/api/deals?type=${typeParam}&page=${next}`;
    if (typeParam === 'category' && catParam) url += `&cat=${encodeURIComponent(catParam)}`;
    const d = await fetch(url).then(r => r.json()).catch(() => ({ deals: [] }));
    setDeals(prev => [...prev, ...(d.deals || [])]);
    setPage(next);
    setLoadingMore(false);
  }, [page, typeParam, catParam]);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setSubscribing(true);
    try {
      const res = await fetch('/api/deals/subscribe', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, frequency }),
      });
      if (res.ok) { setSubscribed(true); setShowForm(false); }
    } catch {}
    setSubscribing(false);
  };

  const tabs = [
    { id: 'percentage', label: 'Top Discounts',  icon: <Percent className="w-4 h-4" /> },
    { id: 'category',   label: 'By Category',    icon: <Tag     className="w-4 h-4" /> },
    { id: 'daily',      label: "Today's Deals",   icon: <Clock   className="w-4 h-4" /> },
    { id: 'weekly',     label: 'This Week',        icon: <Coins   className="w-4 h-4" /> },
  ];

  const categories = [
    { label: 'All', value: '' }, { label: '🌾 Rice', value: 'rice' },
    { label: '🫘 Dal', value: 'dal' }, { label: '🧈 Dairy', value: 'dairy' },
    { label: '🌶️ Spices', value: 'spices' }, { label: '🍘 Snacks', value: 'snacks' },
    { label: '🍵 Tea', value: 'tea' }, { label: '🥗 Frozen', value: 'frozen' },
    { label: '🧴 Care', value: 'care' }, { label: '📦 General', value: 'general' },
  ];

  const uniqueStores = Array.from(new Set(deals.map(d => d.storeId))).filter(Boolean);

  const filtered = deals
    .filter(d =>
      d.term.toLowerCase().includes(searchTerm.toLowerCase()) &&
      (!selectedStore || d.storeId.toLowerCase() === selectedStore.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === 'discount') return b.discountPercent - a.discountPercent;
      if (sortBy === 'price')    return a.bestPrice - b.bestPrice;
      if (sortBy === 'savings')  return b.savingsAmount - a.savingsAmount;
      return 0;
    });

  const hasMore = deals.length < total;

  return (
    <div className="relative min-h-screen">
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden" aria-hidden="true">
        <div className="hero-orb hero-orb--primary" />
        <div className="hero-orb hero-orb--accent" />
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 relative z-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-6 gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-masala-primary/10 text-masala-primary text-[10px] font-black uppercase tracking-widest animate-pulse">
                <Sparkles className="w-3 h-3" /> Live Deals
              </span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-black text-masala-text mb-2 tracking-tight" style={{ fontFamily: 'Fraunces, serif' }}>
              {t('deals.title')}
            </h1>
            <p className="text-masala-text-muted text-sm sm:text-base max-w-xl">{t('deals.subtitle')}</p>
          </div>

          <div className="relative self-start sm:self-center">
            {subscribed ? (
              <div className="flex items-center gap-2 px-4 py-2.5 bg-green-50 text-green-700 rounded-2xl font-bold text-sm border border-green-200 shadow-sm animate-fade-in">
                <CheckCircle2 className="w-5 h-5" /> Alerts on!
              </div>
            ) : (
              <button onClick={() => setShowForm(!showForm)}
                className="flex items-center gap-2 px-5 py-2.5 bg-masala-primary text-white rounded-2xl font-bold text-sm hover:bg-masala-secondary hover:scale-[1.02] shadow-lg shadow-masala-primary/10 transition-all cursor-pointer">
                <Bell className="w-4 h-4" /> Get Alerts
              </button>
            )}
            {showForm && !subscribed && (
              <div className="absolute right-0 top-full mt-3 w-72 bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-masala-border p-5 z-50 animate-dropdown">
                <h3 className="font-bold mb-3 text-masala-text">Never miss a deal</h3>
                <form onSubmit={handleSubscribe} className="space-y-3">
                  <input type="email" placeholder="your@email.com" value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-masala-muted/60 border border-masala-border text-sm text-masala-text placeholder:text-masala-text-light focus:outline-none focus:ring-2 focus:ring-masala-primary/20 focus:border-masala-primary transition-all"
                    required />
                  <select value={frequency} onChange={e => setFrequency(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-masala-muted/60 border border-masala-border text-sm text-masala-text focus:outline-none focus:ring-2 focus:ring-masala-primary/20 transition-all cursor-pointer">
                    <option value="daily">Daily digest</option>
                    <option value="weekly">Weekly top deals</option>
                    <option value="instant">Instant alerts</option>
                  </select>
                  <button type="submit" disabled={subscribing}
                    className="w-full py-2.5 bg-masala-primary text-white rounded-xl font-bold text-sm hover:bg-masala-secondary disabled:opacity-50 cursor-pointer transition-colors">
                    {subscribing ? 'Subscribing…' : 'Subscribe'}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>

        {/* Live stats bar */}
        <StatsBar stats={stats} />

        {/* Flash deals */}
        {flashDeals.length > 0 && (
          <div className="mb-10 bg-red-500/[0.03] border border-red-500/10 rounded-[28px] p-5 sm:p-7">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
              <h2 className="text-xl font-black text-masala-text flex items-center gap-2">
                ⚡ Flash Deals
                <span className="text-xs font-black px-2 py-0.5 bg-red-100 text-red-600 rounded-full flex items-center gap-1 animate-pulse uppercase">
                  <Flame className="w-3 h-3 fill-red-600" /> ≥15% off
                </span>
              </h2>
              <FlashCountdown />
            </div>
            <div className="flex overflow-x-auto pb-3 gap-4 scroll-x-snap">
              {flashDeals.map(deal => (
                <div key={deal.productId} className="snap-start min-w-[220px] sm:min-w-[0] sm:flex-1 max-w-[280px] animate-card">
                  <DealCard deal={deal} flash />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex overflow-x-auto border-b border-masala-border mb-6 scrollbar-hide">
          {tabs.map(tab => (
            <button key={tab.id}
              onClick={() => { setSearchTerm(''); setSelectedStore(''); router.push(`/deals?type=${tab.id}`); }}
              className={`flex items-center gap-2 px-5 py-3.5 font-bold text-sm whitespace-nowrap border-b-2 transition-all cursor-pointer ${
                typeParam === tab.id
                  ? 'border-masala-primary text-masala-primary'
                  : 'border-transparent text-masala-text-muted hover:text-masala-text'
              }`}>
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* Category pills */}
        {typeParam === 'category' && (
          <div className="flex flex-wrap gap-2 mb-6 animate-fade-in">
            {categories.map(c => (
              <button key={c.value}
                onClick={() => router.push(`/deals?type=category&cat=${c.value}`)}
                className={`px-4 py-1.5 rounded-full text-sm font-bold transition-all cursor-pointer ${
                  catParam === c.value
                    ? 'bg-masala-primary text-white shadow-md'
                    : 'bg-white border border-masala-border text-masala-text hover:bg-masala-muted/55'
                }`}>
                {c.label}
              </button>
            ))}
          </div>
        )}

        {/* Filter bar */}
        {!loading && deals.length > 0 && (
          <div className="bg-white/70 backdrop-blur-md border border-masala-border rounded-3xl p-4 mb-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 animate-fade-in">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-masala-text-light" />
              <input type="text" placeholder="Search within deals…" value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-masala-muted/30 border border-masala-border text-sm focus:outline-none focus:ring-2 focus:ring-masala-primary/20 focus:border-masala-primary transition-all text-masala-text placeholder:text-masala-text-light" />
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-masala-text-muted" />
                <span className="text-xs text-masala-text-muted font-bold">Store:</span>
                <select value={selectedStore} onChange={e => setSelectedStore(e.target.value)}
                  className="px-3 py-2 rounded-2xl bg-white border border-masala-border text-xs font-bold text-masala-text-muted focus:outline-none focus:border-masala-primary transition-colors cursor-pointer">
                  <option value="">All Stores</option>
                  {uniqueStores.map(s => <option key={s} value={s}>{s.toUpperCase()}</option>)}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <ArrowUpDown className="w-4 h-4 text-masala-text-muted" />
                <span className="text-xs text-masala-text-muted font-bold">Sort:</span>
                <select value={sortBy} onChange={e => setSortBy(e.target.value)}
                  className="px-3 py-2 rounded-2xl bg-white border border-masala-border text-xs font-bold text-masala-text-muted focus:outline-none focus:border-masala-primary transition-colors cursor-pointer">
                  <option value="discount">Highest Discount</option>
                  <option value="price">Lowest Price</option>
                  <option value="savings">Most Savings</option>
                </select>
              </div>
              {(searchTerm || selectedStore) && (
                <button onClick={() => { setSearchTerm(''); setSelectedStore(''); }}
                  className="flex items-center gap-1 text-xs font-bold text-masala-primary hover:underline cursor-pointer">
                  <RefreshCw className="w-3 h-3" /> Clear
                </button>
              )}
            </div>
          </div>
        )}

        {/* Result count */}
        {!loading && deals.length > 0 && (
          <p className="text-xs text-masala-text-muted font-semibold mb-4">
            Showing <span className="font-black text-masala-text">{filtered.length}</span> of{' '}
            <span className="font-black text-masala-text">{total}</span> deals
            {selectedStore && <> · Filtered by <span className="font-black text-masala-primary uppercase">{selectedStore}</span></>}
          </p>
        )}

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {Array.from({ length: 12 }).map((_, i) => <DealCardSkeleton key={i} />)}
          </div>
        ) : filtered.length > 0 ? (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {filtered.map((deal, idx) => (
                <div key={deal.productId + idx} className="animate-card" style={{ animationDelay: `${Math.min(idx * 35, 600)}ms` }}>
                  <DealCard deal={deal} />
                </div>
              ))}
            </div>
            {hasMore && !searchTerm && !selectedStore && (
              <div className="flex justify-center mt-10">
                <button onClick={loadMore} disabled={loadingMore}
                  className="flex items-center gap-2 px-8 py-3 bg-white border-2 border-masala-primary text-masala-primary rounded-2xl font-bold text-sm hover:bg-masala-primary hover:text-white transition-all shadow-md cursor-pointer disabled:opacity-60">
                  {loadingMore
                    ? <><RefreshCw className="w-4 h-4 animate-spin" /> Loading…</>
                    : <>Load more deals <ChevronRight className="w-4 h-4" /></>}
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-20 bg-white/70 backdrop-blur-sm border border-masala-border rounded-3xl animate-fade-in">
            <div className="w-16 h-16 rounded-full bg-masala-muted flex items-center justify-center text-2xl mx-auto mb-4">🛍️</div>
            <h3 className="text-xl font-black text-masala-text mb-2">
              {searchTerm || selectedStore ? 'No matching deals' : 'No deals right now'}
            </h3>
            <p className="text-masala-text-muted text-sm mb-6 max-w-sm mx-auto">
              {searchTerm || selectedStore
                ? 'Try adjusting your search or store filter.'
                : 'Check back soon — prices update every few hours.'}
            </p>
            {(searchTerm || selectedStore) ? (
              <button onClick={() => { setSearchTerm(''); setSelectedStore(''); }}
                className="px-5 py-2.5 bg-masala-primary text-white rounded-xl font-bold text-xs hover:bg-masala-secondary cursor-pointer">
                Clear Filters
              </button>
            ) : (
              <Link href="/deals" className="inline-flex items-center gap-2 font-bold text-masala-primary hover:underline">
                View all deals <ChevronRight className="w-4 h-4" />
              </Link>
            )}
          </div>
        )}
      </div>
      <SavingsTicker />
    </div>
  );
}

export default function DealsPage() {
  const { t } = useLang();
  return (
    <Suspense fallback={<div className="p-8 text-center text-masala-text-muted">{t('deals.loading')}</div>}>
      <DealsContent />
    </Suspense>
  );
}

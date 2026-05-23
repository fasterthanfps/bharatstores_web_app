'use client';
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  Bell, 
  CheckCircle2, 
  ChevronRight, 
  Search, 
  SlidersHorizontal, 
  ArrowUpDown, 
  Clock, 
  Flame, 
  Sparkles, 
  TrendingUp, 
  Coins, 
  Percent, 
  Tag
} from 'lucide-react';
import Link from 'next/link';
import { useLang } from '@/lib/utils/LanguageContext';

const RECENT_SAVINGS = [
  { item: 'Aashirwad Svasti Ghee', store: 'Jamoona', savings: '€2.50', time: '2 mins ago' },
  { item: 'MDH Kitchen King Masala', store: 'Dookan', savings: '€0.80', time: '5 mins ago' },
  { item: 'Heera Toor Dal 2kg', store: 'Swadesh', savings: '€1.20', time: '8 mins ago' },
  { item: 'Haldiram\'s Bhujia 150g', store: 'Jamoona', savings: '€0.45', time: '12 mins ago' },
  { item: 'Elephant Atta Medium 10kg', store: 'Dookan', savings: '€4.10', time: '15 mins ago' },
];

function FlashCountdown() {
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const target = new Date();
    target.setHours(23, 59, 59, 999);
    
    const updateTime = () => {
      const diff = target.getTime() - new Date().getTime();
      if (diff <= 0) {
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0 });
        return;
      }
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff / (1000 * 60)) % 60);
      const seconds = Math.floor((diff / 1000) % 60);
      setTimeLeft({ hours, minutes, seconds });
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const format = (num: number) => String(num).padStart(2, '0');

  return (
    <div className="flex items-center gap-1.5 font-bold text-[11px] sm:text-xs bg-red-500/10 text-red-600 px-3 py-1.5 rounded-full border border-red-200/50 shadow-sm animate-pulse backdrop-blur-sm">
      <Clock className="w-3.5 h-3.5" />
      <span className="tracking-wider uppercase">Ends In: {format(timeLeft.hours)}h {format(timeLeft.minutes)}m {format(timeLeft.seconds)}s</span>
    </div>
  );
}

function RecentSavingsTicker() {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setCurrentIdx(prev => (prev + 1) % RECENT_SAVINGS.length);
        setVisible(true);
      }, 600);
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  if (!visible) return null;

  const saving = RECENT_SAVINGS[currentIdx];

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-sm bg-white/95 backdrop-blur-md rounded-2xl border border-masala-border p-4 shadow-2xl flex items-center gap-3 animate-fade-in pointer-events-auto">
      <div className="w-10 h-10 rounded-full bg-green-100/80 flex items-center justify-center text-lg flex-shrink-0 animate-bounce">
        🔥
      </div>
      <div>
        <p className="text-xs font-semibold text-masala-text">
          Someone saved <span className="font-extrabold text-green-600">{saving.savings}</span> on {saving.item}!
        </p>
        <p className="text-[10px] text-masala-text-light mt-0.5 uppercase tracking-wider font-bold">
          via {saving.store} · {saving.time}
        </p>
      </div>
    </div>
  );
}

function DealsContent() {
  const { t } = useLang();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const typeParam = searchParams.get('type') || 'percentage';
  const catParam = searchParams.get('cat') || '';
  
  const [deals, setDeals] = useState<any[]>([]);
  const [flashDeals, setFlashDeals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [frequency, setFrequency] = useState('daily');
  const [subscribing, setSubscribing] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [showForm, setShowForm] = useState(false);

  // Client-side search and filtering states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStore, setSelectedStore] = useState('');
  const [sortBy, setSortBy] = useState('discount'); // 'discount', 'price', 'savings'

  useEffect(() => {
    // Fetch flash deals independently
    fetch('/api/deals?type=flash')
      .then(r => r.json())
      .then(d => setFlashDeals(d.deals || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    let url = `/api/deals?type=${typeParam}`;
    if (typeParam === 'category' && catParam) {
      url += `&cat=${encodeURIComponent(catParam)}`;
    }
    fetch(url)
      .then(r => r.json())
      .then(d => {
        setDeals(d.deals || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [typeParam, catParam]);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setSubscribing(true);
    try {
      const res = await fetch('/api/deals/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, frequency })
      });
      if (res.ok) {
        setSubscribed(true);
        setShowForm(false);
      }
    } catch {}
    setSubscribing(false);
  };

  const tabs = [
    { id: 'percentage', label: t('deals.tab.percentage'), icon: <Percent className="w-4 h-4" /> },
    { id: 'category', label: t('deals.tab.category'), icon: <Tag className="w-4 h-4" /> },
    { id: 'daily', label: t('deals.tab.daily'), icon: <Clock className="w-4 h-4" /> },
    { id: 'weekly', label: t('deals.tab.weekly'), icon: <Coins className="w-4 h-4" /> }
  ];

  const categories = [
    { label: t('deals.all'), value: '' },
    { label: '🌾 ' + t('category.basmati'), value: 'rice' },
    { label: '🫘 ' + t('category.dal'), value: 'dal' },
    { label: '🧈 ' + t('category.dairy'), value: 'dairy' },
    { label: '🌶️ ' + t('category.spices'), value: 'spices' },
    { label: '🍘 ' + t('category.snacks'), value: 'snacks' },
    { label: '🍵 ' + t('category.tea'), value: 'tea' },
    { label: '🥗 ' + t('category.frozen'), value: 'frozen' },
    { label: '🧴 ' + t('category.care'), value: 'care' }
  ];

  // Dynamic values based on returned data
  const uniqueStores = Array.from(new Set(deals.map(d => d.storeId || d.storeName || 'Jamoona'))).filter(Boolean);

  // Client-side search and filtering logic
  const filteredDeals = deals
    .filter(deal => {
      const name = (deal.term || '').toLowerCase();
      const matchSearch = name.includes(searchTerm.toLowerCase());
      const store = (deal.storeId || deal.storeName || '').toLowerCase();
      const matchStore = !selectedStore || store === selectedStore.toLowerCase();
      return matchSearch && matchStore;
    })
    .sort((a, b) => {
      if (sortBy === 'discount') {
        return b.discountPercent - a.discountPercent;
      } else if (sortBy === 'price') {
        return Number(a.bestPrice) - Number(b.bestPrice);
      } else if (sortBy === 'savings') {
        return Number(b.savingsAmount) - Number(a.savingsAmount);
      }
      return 0;
    });

  return (
    <div className="relative min-h-screen">
      {/* ── Infinite Ambient Background Orbs ── */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden" aria-hidden="true">
        <div className="hero-orb hero-orb--primary" />
        <div className="hero-orb hero-orb--accent" />
        <div className="hero-orb hero-orb--warm" />
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 relative z-10">
        {/* Header & Alerts */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-10 gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-masala-primary/10 text-masala-primary text-[10px] sm:text-xs font-black uppercase tracking-widest animate-pulse">
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
                <CheckCircle2 className="w-5 h-5" /> {t('deals.alertsOn')}
              </div>
            ) : (
              <button
                onClick={() => setShowForm(!showForm)}
                className="flex items-center gap-2 px-5 py-2.5 bg-masala-primary text-white rounded-2xl font-bold text-sm hover:bg-masala-secondary hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-masala-primary/10 transition-all cursor-pointer"
              >
                <Bell className="w-4 h-4" /> {t('deals.getAlerts')}
              </button>
            )}

            {showForm && !subscribed && (
              <div className="absolute right-0 top-full mt-3 w-72 bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-masala-border p-5 z-50 animate-dropdown">
                <h3 className="font-bold mb-3 text-masala-text">{t('deals.neverMiss')}</h3>
                <form onSubmit={handleSubscribe} className="space-y-3">
                  <input
                    type="email"
                    placeholder={t('deals.emailPlaceholder')}
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-masala-muted/60 border border-masala-border text-sm text-masala-text placeholder:text-masala-text-light focus:outline-none focus:ring-2 focus:ring-masala-primary/20 focus:border-masala-primary transition-all"
                    required
                  />
                  <select
                    value={frequency}
                    onChange={e => setFrequency(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-masala-muted/60 border border-masala-border text-sm text-masala-text focus:outline-none focus:ring-2 focus:ring-masala-primary/20 focus:border-masala-primary transition-all cursor-pointer"
                  >
                    <option value="daily">{t('deals.dailyDigest')}</option>
                    <option value="weekly">{t('deals.weeklyTop')}</option>
                    <option value="instant">{t('deals.instantAlerts')}</option>
                  </select>
                  <button
                    type="submit"
                    disabled={subscribing}
                    className="w-full py-2.5 bg-masala-primary text-white rounded-xl font-bold text-sm hover:bg-masala-secondary active:scale-[0.98] transition-transform disabled:opacity-50 cursor-pointer"
                  >
                    {subscribing ? t('deals.subscribing') : t('deals.subscribe')}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>

        {/* Flash Deals Strip */}
        {flashDeals.length > 0 && (
          <div className="mb-12 bg-red-500/[0.03] border border-red-500/10 rounded-[32px] p-6 sm:p-8 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <h2 className="text-2xl font-black text-masala-text flex items-center gap-2.5">
                ⚡ {t('deals.flashDeals')} 
                <span className="text-xs font-black px-2.5 py-1 bg-red-100 text-red-600 rounded-full flex items-center gap-1 animate-pulse uppercase tracking-wider">
                  <Flame className="w-3.5 h-3.5 fill-red-600" /> &gt;15% {t('deals.off')}
                </span>
              </h2>
              <FlashCountdown />
            </div>
            
            <div className="flex overflow-x-auto pb-4 gap-5 scroll-x-snap">
              {flashDeals.map(deal => (
                <div key={deal.productId} className="snap-start min-w-[280px] sm:min-w-[0] sm:flex-1 max-w-[320px] animate-card">
                  <DealCard deal={deal} flash />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tabs Bar */}
        <div className="flex overflow-x-auto border-b border-masala-border mb-8 scrollbar-hide">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => {
                setSearchTerm(''); // Reset filters on tab switch
                setSelectedStore('');
                router.push(`/deals?type=${tab.id}`);
              }}
              className={`flex items-center gap-2 px-6 py-4 font-bold text-sm whitespace-nowrap border-b-2 transition-all cursor-pointer ${
                typeParam === tab.id
                  ? 'border-masala-primary text-masala-primary scale-[1.02]'
                  : 'border-transparent text-masala-text-muted hover:text-masala-text'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Category Filter Pills (if tab is Category) */}
        {typeParam === 'category' && (
          <div className="flex flex-wrap gap-2 mb-8 animate-fade-in">
            {categories.map(c => (
              <button
                key={c.value}
                onClick={() => router.push(`/deals?type=category&cat=${c.value}`)}
                className={`px-5 py-2 rounded-full text-sm font-bold transition-all cursor-pointer ${
                  (catParam || '') === c.value
                    ? 'bg-masala-primary text-white shadow-md shadow-masala-primary/10 hover:scale-[1.02]'
                    : 'bg-white border border-masala-border text-masala-text hover:bg-masala-muted/55'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        )}

        {/* Real-time Dynamic Controls (Search, Sort, Store Filter) */}
        {!loading && deals.length > 0 && (
          <div className="bg-white/70 backdrop-blur-md border border-masala-border rounded-3xl p-5 mb-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 animate-fade-in">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-masala-text-light" />
              <input
                type="text"
                placeholder="Search loaded deals by name or brand..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-masala-muted/30 border border-masala-border text-sm focus:outline-none focus:ring-2 focus:ring-masala-primary/20 focus:border-masala-primary transition-all text-masala-text placeholder:text-masala-text-light"
              />
            </div>

            {/* Filter controls */}
            <div className="flex flex-wrap items-center gap-4">
              {/* Store Filter */}
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-masala-text-muted" />
                <span className="text-xs text-masala-text-muted font-bold">Store:</span>
                <select
                  value={selectedStore}
                  onChange={e => setSelectedStore(e.target.value)}
                  className="px-3.5 py-2 rounded-2xl bg-white border border-masala-border text-xs font-bold text-masala-text-muted focus:outline-none focus:border-masala-primary transition-colors cursor-pointer"
                >
                  <option value="">All Stores</option>
                  {uniqueStores.map(store => (
                    <option key={store} value={store}>{store.toUpperCase()}</option>
                  ))}
                </select>
              </div>

              {/* Sorting Filter */}
              <div className="flex items-center gap-2">
                <ArrowUpDown className="w-4 h-4 text-masala-text-muted" />
                <span className="text-xs text-masala-text-muted font-bold">Sort by:</span>
                <select
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value)}
                  className="px-3.5 py-2 rounded-2xl bg-white border border-masala-border text-xs font-bold text-masala-text-muted focus:outline-none focus:border-masala-primary transition-colors cursor-pointer"
                >
                  <option value="discount">Highest Discount (%)</option>
                  <option value="price">Lowest Price (€)</option>
                  <option value="savings">Most Savings (€)</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Deals Grid */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(i => <DealCardSkeleton key={i} />)}
          </div>
        ) : filteredDeals.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {filteredDeals.map((deal, idx) => (
              <div key={deal.productId + idx} className="animate-card" style={{ animationDelay: `${idx * 40}ms` }}>
                <DealCard deal={deal} />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white/70 backdrop-blur-sm border border-masala-border rounded-3xl animate-fade-in">
            <div className="w-16 h-16 rounded-full bg-masala-muted flex items-center justify-center text-2xl mx-auto mb-4">
              🛍️
            </div>
            <h3 className="text-xl font-black text-masala-text mb-2">
              {searchTerm || selectedStore ? "No matching deals found" : t('deals.noDeals')}
            </h3>
            <p className="text-masala-text-muted text-sm mb-6 max-w-sm mx-auto">
              {searchTerm || selectedStore 
                ? "Try adjusting your search filters or store selector." 
                : t('deals.checkBack')}
            </p>
            {(searchTerm || selectedStore) ? (
              <button 
                onClick={() => { setSearchTerm(''); setSelectedStore(''); }}
                className="px-5 py-2.5 bg-masala-primary text-white rounded-xl font-bold text-xs hover:bg-masala-secondary cursor-pointer"
              >
                Clear Filters
              </button>
            ) : (
              <Link href="/deals" className="inline-flex items-center gap-2 font-bold text-masala-primary hover:underline">
                {t('deals.viewAll')} <ChevronRight className="w-4 h-4" />
              </Link>
            )}
          </div>
        )}
      </div>

      {/* Floating Savings Ticker */}
      <RecentSavingsTicker />
    </div>
  );
}

function DealCard({ deal, flash = false }: { deal: any, flash?: boolean }) {
  const { t } = useLang();
  const discount = Math.round(deal.discountPercent);
  
  return (
    <div className={`bg-white/80 backdrop-blur-md rounded-2xl border listing-card p-3.5 relative flex flex-col h-full hover:shadow-2xl transition-all duration-300 group ${
      flash 
        ? 'border-red-300/80 shadow-md shadow-red-100/40 bg-white/95' 
        : 'border-masala-border'
    }`}>
      {/* Discount Badge with pulse animation */}
      <div className={`absolute top-2 right-2 text-white text-[10px] sm:text-xs font-black px-2.5 py-1 rounded-xl z-10 flex items-center gap-0.5 shadow-sm ${
        discount >= 20 ? 'bg-red-500 animate-pulse' : 'bg-masala-accent'
      }`}>
        {discount >= 20 && <Flame className="w-3 h-3 fill-white" />}
        -{discount}%
      </div>

      {/* Product Image Frame */}
      <div className="aspect-square rounded-xl bg-masala-muted/30 mb-3 relative overflow-hidden flex-shrink-0 flex items-center justify-center p-2 group-hover:scale-[1.02] transition-transform duration-300">
        {deal.imageUrl ? (
          <img src={deal.imageUrl} alt={deal.term} className="w-full h-full object-contain mix-blend-multiply transition-transform duration-300 group-hover:scale-105" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl select-none">🛒</div>
        )}
        
        {/* Subtle store watermark at bottom */}
        <span className="absolute bottom-1.5 left-1.5 px-2 py-0.5 rounded-md bg-white/90 border border-masala-border text-[9px] font-black uppercase text-masala-text-muted tracking-wider shadow-sm select-none">
          {deal.storeName || deal.storeId}
        </span>
      </div>

      {/* Product Body */}
      <div className="flex-1 flex flex-col">
        <h3 className="text-xs sm:text-sm font-bold text-masala-text line-clamp-2 leading-snug mb-1 group-hover:text-masala-primary transition-colors duration-200">
          {deal.term}
        </h3>
        
        {deal.weightLabel && (
          <p className="text-[11px] text-masala-text-light font-semibold mb-2">{deal.weightLabel}</p>
        )}
        
        <div className="mt-auto pt-3 border-t border-masala-muted">
          {/* Price Block */}
          <div className="flex items-baseline gap-2 mb-1.5 flex-wrap">
            <span className="text-base sm:text-lg font-black text-masala-primary leading-none">
              €{Number(deal.bestPrice).toFixed(2)}
            </span>
            <span className="text-[11px] text-masala-text-light line-through font-semibold mb-0.5">
              €{Number(deal.comparePrice).toFixed(2)}
            </span>
          </div>

          {/* Absolute Savings label */}
          <p className="text-[11px] font-extrabold text-green-600 mb-3 flex items-center gap-1 select-none">
            <TrendingUp className="w-3.5 h-3.5" /> {t('deals.save')} €{Number(deal.savingsAmount).toFixed(2)}
          </p>
          
          <Link 
            href={`/api/redirect?pid=${deal.productId}&store=${deal.storeId || deal.storeName}`}
            target="_blank"
            className="w-full py-2.5 bg-masala-primary/10 text-masala-primary hover:bg-masala-primary hover:text-white rounded-xl font-bold text-xs flex items-center justify-center transition-all duration-200 shadow-sm cursor-pointer hover:shadow-lg hover:shadow-masala-primary/10"
          >
            {t('deals.buyNow')}
          </Link>
        </div>
      </div>
    </div>
  );
}

function DealCardSkeleton() {
  return (
    <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-masala-border p-3.5 flex flex-col h-full animate-pulse">
      <div className="aspect-square rounded-xl bg-masala-muted mb-3" />
      <div className="h-4 bg-masala-muted rounded w-full mb-1" />
      <div className="h-4 bg-masala-muted rounded w-2/3 mb-4" />
      <div className="mt-auto">
        <div className="h-6 bg-masala-muted rounded w-1/2 mb-1.5" />
        <div className="h-3 bg-masala-muted rounded w-1/3 mb-3" />
        <div className="h-8 bg-masala-muted rounded-xl w-full" />
      </div>
    </div>
  );
}

export default function DealsPage() {
  const { t } = useLang();
  return (
    <Suspense fallback={<div className="p-8 text-center">{t('deals.loading')}</div>}>
      <DealsContent />
    </Suspense>
  );
}

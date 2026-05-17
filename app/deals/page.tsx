'use client';
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Bell, CheckCircle2, ChevronRight } from 'lucide-react';
import Link from 'next/link';

function DealsContent() {
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
    { id: 'percentage', label: '🔥 % Off' },
    { id: 'category', label: '📦 By Category' },
    { id: 'daily', label: '⚡ Daily' },
    { id: 'weekly', label: '📅 Weekly' }
  ];

  const categories = [
    { label: 'All', value: '' },
    { label: '🌾 Rice', value: 'rice' },
    { label: '🫘 Dal', value: 'dal' },
    { label: '🧈 Dairy', value: 'dairy' },
    { label: '🌶️ Spices', value: 'spices' },
    { label: '🍘 Snacks', value: 'snacks' },
    { label: '🍵 Tea', value: 'tea' },
    { label: '🥗 Frozen', value: 'frozen' },
    { label: '🧴 Care', value: 'care' }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header & Alerts */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-black text-masala-text mb-2">Everyday Best Deals</h1>
          <p className="text-masala-text-muted">Find the biggest discounts across all Indian stores in Europe.</p>
        </div>
        
        <div className="relative">
          {subscribed ? (
            <div className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-xl font-bold text-sm">
              <CheckCircle2 className="w-5 h-5" /> Deal alerts on
            </div>
          ) : (
            <button
              onClick={() => setShowForm(!showForm)}
              className="flex items-center gap-2 px-4 py-2 bg-masala-primary text-white rounded-xl font-bold text-sm hover:bg-masala-secondary transition-colors"
            >
              <Bell className="w-4 h-4" /> GET DEAL ALERTS
            </button>
          )}

          {showForm && !subscribed && (
            <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-masala-border p-4 z-50">
              <h3 className="font-bold mb-3 text-masala-text">Never miss a deal!</h3>
              <form onSubmit={handleSubscribe} className="space-y-3">
                <input
                  type="email"
                  placeholder="Your email address"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-masala-muted/50 border border-masala-border text-sm"
                  required
                />
                <select
                  value={frequency}
                  onChange={e => setFrequency(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-masala-muted/50 border border-masala-border text-sm"
                >
                  <option value="daily">Daily digest</option>
                  <option value="weekly">Weekly top deals</option>
                  <option value="instant">Instant alerts</option>
                </select>
                <button
                  type="submit"
                  disabled={subscribing}
                  className="w-full py-2 bg-masala-primary text-white rounded-xl font-bold text-sm"
                >
                  {subscribing ? 'Subscribing...' : 'Subscribe'}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* Flash Deals Strip */}
      {flashDeals.length > 0 && (
        <div className="mb-12">
          <h2 className="text-xl font-black text-masala-text mb-4 flex items-center gap-2">
            ⚡ Flash Deals <span className="text-xs font-bold px-2 py-0.5 bg-red-100 text-red-600 rounded-full">&gt;15% OFF</span>
          </h2>
          <div className="flex overflow-x-auto pb-4 gap-4 scrollbar-hide snap-x">
            {flashDeals.map(deal => (
              <div key={deal.productId} className="snap-start min-w-[280px] sm:min-w-[0] sm:flex-1 max-w-[320px]">
                <DealCard deal={deal} flash />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex overflow-x-auto border-b border-masala-border mb-6 scrollbar-hide">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => router.push(`/deals?type=${tab.id}`)}
            className={`px-6 py-3 font-bold text-sm whitespace-nowrap border-b-2 transition-colors ${
              typeParam === tab.id
                ? 'border-masala-primary text-masala-primary'
                : 'border-transparent text-masala-text-muted hover:text-masala-text'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Category Filter */}
      {typeParam === 'category' && (
        <div className="flex flex-wrap gap-2 mb-8">
          {categories.map(c => (
            <button
              key={c.value}
              onClick={() => router.push(`/deals?type=category&cat=${c.value}`)}
              className={`px-4 py-1.5 rounded-full text-sm font-bold transition-colors ${
                (catParam || '') === c.value
                  ? 'bg-masala-primary text-white'
                  : 'bg-masala-muted text-masala-text hover:bg-masala-muted/70'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      )}

      {/* Deals Grid */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {[1,2,3,4,5,6,7,8].map(i => <DealCardSkeleton key={i} />)}
        </div>
      ) : deals.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {deals.map((deal, idx) => (
            <DealCard key={deal.productId + idx} deal={deal} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-masala-muted/30 rounded-3xl">
          <h3 className="text-lg font-bold text-masala-text mb-2">No deals in this category right now</h3>
          <p className="text-masala-text-muted mb-6">Check back soon — we update every 2 hours</p>
          <Link href="/deals" className="inline-flex items-center gap-2 font-bold text-masala-primary hover:underline">
            View all deals <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      )}
    </div>
  );
}

function DealCard({ deal, flash = false }: { deal: any, flash?: boolean }) {
  const discount = Math.round(deal.discountPercent);
  
  return (
    <div className={`bg-white rounded-2xl border ${flash ? 'border-red-200 shadow-md shadow-red-100/50' : 'border-masala-border'} p-3 relative flex flex-col h-full hover:shadow-xl transition-shadow group`}>
      <div className="absolute top-2 right-2 bg-red-500 text-white text-xs font-black px-2 py-1 rounded-lg z-10">
        -{discount}%
      </div>
      
      <div className="aspect-square rounded-xl bg-masala-muted/30 mb-3 relative overflow-hidden flex-shrink-0">
        {deal.imageUrl ? (
          <img src={deal.imageUrl} alt={deal.term} className="w-full h-full object-contain mix-blend-multiply p-2" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl">🛒</div>
        )}
      </div>

      <div className="flex-1 flex flex-col">
        <h3 className="text-sm font-semibold text-masala-text line-clamp-2 leading-tight mb-1 group-hover:text-masala-primary transition-colors">
          {deal.term}
        </h3>
        {deal.weightLabel && (
          <p className="text-xs text-masala-text-muted mb-2">{deal.weightLabel}</p>
        )}
        
        <div className="mt-auto pt-3">
          <div className="flex items-end gap-2 mb-1">
            <span className="text-lg font-black text-masala-primary leading-none">€{Number(deal.bestPrice).toFixed(2)}</span>
            <span className="text-xs text-masala-text-muted line-through mb-0.5">€{Number(deal.comparePrice).toFixed(2)}</span>
          </div>
          <p className="text-xs font-bold text-green-600 mb-3">Save €{Number(deal.savingsAmount).toFixed(2)}</p>
          
          <Link 
            href={`/api/redirect?pid=${deal.productId}&store=${deal.storeId || deal.storeName}`}
            target="_blank"
            className="w-full py-2 bg-masala-primary/10 text-masala-primary hover:bg-masala-primary hover:text-white rounded-xl font-bold text-xs flex items-center justify-center transition-colors"
          >
            BUY NOW
          </Link>
        </div>
      </div>
    </div>
  );
}

function DealCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-masala-border p-3 flex flex-col h-full animate-pulse">
      <div className="aspect-square rounded-xl bg-masala-muted mb-3" />
      <div className="h-4 bg-masala-muted rounded w-full mb-1" />
      <div className="h-4 bg-masala-muted rounded w-2/3 mb-4" />
      <div className="mt-auto">
        <div className="h-6 bg-masala-muted rounded w-1/2 mb-1" />
        <div className="h-3 bg-masala-muted rounded w-1/3 mb-3" />
        <div className="h-8 bg-masala-muted rounded-xl w-full" />
      </div>
    </div>
  );
}

export default function DealsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Loading deals...</div>}>
      <DealsContent />
    </Suspense>
  );
}

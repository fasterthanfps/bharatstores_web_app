'use client';

import { Suspense, useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import ProductCard from '@/components/ui/ProductCard';
import { ProductCardSkeleton } from '@/components/ui/ProductCardSkeleton';
import CompareTray from '@/components/ui/CompareTray';
import FilterSidebar from '@/components/ui/FilterSidebar';
import { useSearchFilters } from '@/hooks/useSearchFilters';
import { getStoreConfig } from '@/lib/stores';
import { useLang } from '@/lib/utils/LanguageContext';
import { Search, RefreshCw, Zap, SlidersHorizontal, X, TrendingDown, PackageCheck, Store, Sparkles } from 'lucide-react';

const SORT_TABS = [
  { id: 'best', labelKey: 'search.tab.best' },
  { id: 'price', labelKey: 'search.tab.price' },
  { id: 'pricePerKg', labelKey: 'search.tab.pricePerKg' },
  { id: 'stock', labelKey: 'search.tab.stock' },
] as const;

const CATEGORY_TABS = [
  { id: 'all',     label: 'All' },
  { id: 'rice',    label: 'Rice & Atta' },
  { id: 'spices',  label: 'Spices' },
  { id: 'snacks',  label: 'Snacks' },
  { id: 'dairy',   label: 'Dairy' },
  { id: 'dal',     label: 'Dal' },
  { id: 'frozen',  label: 'Frozen' },
  { id: 'tea',     label: 'Tea' },
];

const STORE_NAMES_DISPLAY = ['Dookan', 'Jamoona', 'Swadesh', 'Namma Markt', 'Angaadi', 'Little India', 'Spice Village', 'Grocera'];

function SearchPageContent() {
  const { t } = useLang();
  const searchParams = useSearchParams();
  const { filters, setFilters, clearFilters, hasActiveFilters, activeFilterCount } = useSearchFilters();
  const displayQuery = filters.q.trim();

  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [pollCount, setPollCount] = useState(0);
  const [elapsedSecs, setElapsedSecs] = useState(0);
  const [filterOpen, setFilterOpen] = useState(false);
  const [compareItems, setCompareItems] = useState<any[]>([]);
  const [backgroundPollCount, setBackgroundPollCount] = useState(0);
  const [insightsOpen, setInsightsOpen] = useState(false);
  const [insights, setInsights] = useState<any>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [timeLabel, setTimeLabel] = useState<string>('');

  useEffect(() => {
    if (!lastUpdated) {
      setTimeLabel('');
      return;
    }
    const updateLabel = () => {
      const diffMs = Date.now() - lastUpdated.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins < 1) {
        setTimeLabel('Just updated');
      } else {
        setTimeLabel(`${diffMins}m ago`);
      }
    };
    updateLabel();
    const interval = setInterval(updateLabel, 30000);
    return () => clearInterval(interval);
  }, [lastUpdated]);

  const refreshingRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const searchStartRef = useRef<number>(Date.now());

  const stopTimer = () => { if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; } };
  const startTimer = () => {
    stopTimer();
    searchStartRef.current = Date.now();
    setElapsedSecs(0);
    timerRef.current = setInterval(() => setElapsedSecs(Math.floor((Date.now() - searchStartRef.current) / 1000)), 1000);
  };

  const buildSearchUrl = useCallback(() => {
    const p = new URLSearchParams();
    if (filters.q) p.set('q', filters.q);
    if (filters.sort && filters.sort !== 'best') p.set('sort', filters.sort);
    if (filters.stores.length > 0) p.set('stores', filters.stores.join(','));
    if (filters.maxPrice < 100) p.set('maxPrice', String(filters.maxPrice));
    if (filters.minPrice > 0) p.set('minPrice', String(filters.minPrice));
    if (filters.priceMode !== 'range') p.set('priceMode', filters.priceMode);
    if (filters.quantity) p.set('quantity', filters.quantity);
    if (filters.brands.length > 0) p.set('brands', filters.brands.join(','));
    if (filters.types.length > 0) p.set('types', filters.types.join(','));
    if (filters.sugar.length > 0) p.set('sugar', filters.sugar.join(','));
    if (filters.inStockOnly) p.set('inStock', 'true');
    return `/api/search?${p.toString()}`;
  }, [filters]);

  const fetchResults = useCallback(async (): Promise<boolean> => {
    if (!filters.q || filters.q.length < 2) return false;
    try {
      const res = await fetch(buildSearchUrl());
      const data = await res.json();
      const listings = data.data?.listings || [];
      const isRefreshing = data.data?.refreshing === true;
      const apiInsights = data.data?.insights || null;

      setResults(listings);
      setInsights(apiInsights);
      setLoading(false);
      setLastUpdated(new Date());
      if (listings.length > 0 && !isRefreshing) stopTimer();

      if (isRefreshing && !refreshingRef.current) { 
        setRefreshing(true); 
        refreshingRef.current = true; 
      } else if (!isRefreshing) { 
        setRefreshing(false); 
        refreshingRef.current = false; 
        setBackgroundPollCount(0); // Reset count once fresh
      }

      return listings.length > 0;
    } catch { setLoading(false); return false; }
  }, [buildSearchUrl, filters.q]);

  useEffect(() => {
    setLoading(true);
    setResults([]);
    setPollCount(0);
    setRefreshing(false);
    refreshingRef.current = false;
    startTimer();
    if (filters.q.length >= 2) fetchResults();
    else { setLoading(false); stopTimer(); }
    return () => stopTimer();
  }, [searchParams.toString()]);

  useEffect(() => {
    if (results.length > 0 || pollCount >= 8 || filters.q.length < 2) return;
    if (loading) return;
    const t = setTimeout(async () => { const found = await fetchResults(); if (!found) setPollCount(c => c + 1); }, 4000);
    return () => clearTimeout(t);
  }, [results, pollCount, fetchResults, filters.q, loading]);

  useEffect(() => {
    if (!refreshing || !results.length || backgroundPollCount >= 3) {
      if (backgroundPollCount >= 3 && refreshing) {
        setRefreshing(false);
        refreshingRef.current = false;
      }
      return;
    }
    const t = setTimeout(() => {
      setBackgroundPollCount(prev => prev + 1);
      fetchResults();
    }, 8000); // 8s interval for background updates
    return () => clearTimeout(t);
  }, [refreshing, results.length, backgroundPollCount, fetchResults]);

  const isPolling = results.length === 0 && pollCount < 8 && !loading && filters.q.length >= 2;
  const isTimedOut = results.length === 0 && pollCount >= 8 && !loading;

  const handleRefresh = useCallback(async () => {
    setLoading(true);
    setRefreshing(true);
    refreshingRef.current = true;
    startTimer();
    try {
      const res = await fetch(`/api/search/refresh?q=${encodeURIComponent(filters.q)}&sort=${filters.sort}`, { method: 'POST' });
      const data = await res.json();
      if (data.success) { 
        setResults(data.data?.listings || []); 
        setLoading(false); 
        setLastUpdated(new Date());
      }
      else await fetchResults();
    } catch { await fetchResults(); }
    finally { stopTimer(); setRefreshing(false); refreshingRef.current = false; }
  }, [filters.q, filters.sort, fetchResults]);

  const handleCompareToggle = (listing: any) => {
    setCompareItems(prev => {
      const exists = prev.find(i => i.id === listing.id);
      if (exists) return prev.filter(i => i.id !== listing.id);
      if (prev.length >= 3) return prev;
      return [...prev, listing];
    });
  };

  const exactResults = results.filter((l: any) => (l._score ?? 0) >= 80);
  const relatedResults = results.filter((l: any) => (l._score ?? 0) < 80 && (l._score ?? 0) > 0);
  const totalCount = results.length;
  const inStockResults = results.filter((l: any) =>
    Array.isArray(l.allPrices) ? l.allPrices.some((p: any) => p.availability !== 'OUT_OF_STOCK') : true
  );
  const outOfStockResults = results.filter((l: any) =>
    Array.isArray(l.allPrices) ? l.allPrices.every((p: any) => p.availability === 'OUT_OF_STOCK') : false
  );
  const bestDeal = inStockResults[0];
  const lowestPerKg = inStockResults
    .flatMap((l: any) => l.allPrices || [])
    .filter((p: any) => p.availability !== 'OUT_OF_STOCK' && typeof p.price_per_kg === 'number' && p.price_per_kg > 0)
    .sort((a: any, b: any) => a.price_per_kg - b.price_per_kg)[0];
  const matchedStoresCount = new Set(
    inStockResults.flatMap((l: any) => (l.allPrices || []).map((p: any) => (p.store_name || '').toLowerCase().trim()))
  ).size;
  const inStockIds = new Set(inStockResults.map((l: any) => l.id));
  const exactInStockResults = exactResults.filter((l: any) => inStockIds.has(l.id));
  const relatedInStockResults = relatedResults.filter((l: any) => inStockIds.has(l.id));

  const activeCategory = (filters as any).category ?? 'all';

  return (
    <div className="min-h-screen pb-24 bg-masala-bg search-results-page">

      {/* ═══ LAYER 1: Insight bar — 28px ═══ */}
      {!loading && totalCount > 0 && (
        <div className="bg-masala-primary/5 border-b border-masala-border/30">
          <div className="max-w-[1600px] mx-auto w-full">
            <button
              onClick={() => setInsightsOpen(v => !v)}
              className="w-full flex items-center justify-between px-4 py-2.5 text-xs transition-colors duration-200 hover:bg-masala-primary/5 cursor-pointer"
            >
              <span className="font-bold text-masala-primary flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-masala-primary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-masala-primary"></span>
                </span>
                <span className="uppercase tracking-wider text-[10px] font-black">Live Insights</span>
                <span className="text-masala-text-muted font-normal">|</span>
                <span>{totalCount} results</span>
                {insights?.bestPrice && (
                  <>
                    <span className="text-masala-text-muted font-normal">·</span>
                    <span>from €{insights.bestPrice.toFixed(2)}</span>
                  </>
                )}
                {insights?.storeCount && (
                  <>
                    <span className="text-masala-text-muted font-normal">·</span>
                    <span>{insights.storeCount} stores</span>
                  </>
                )}
              </span>
              <span className="text-masala-primary text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                {insightsOpen ? 'Hide Details ▲' : 'View Insights ▼'}
              </span>
            </button>

            {/* Collapsible Stats grid */}
            {insights && (
              <div className={`${
                insightsOpen ? 'grid animate-insights-slide' : 'hidden'
              } grid-cols-2 md:grid-cols-4 gap-3 p-4 bg-masala-muted/30 border-t border-masala-border/40`}>
                
                {/* Card 1: Best Deal */}
                {insights.bestDeal && (
                  <div className="bg-white/80 backdrop-blur-md rounded-2xl p-3.5 border border-masala-border/50 shadow-[0_2px_8px_rgba(139,32,32,0.03)] hover:-translate-y-0.5 hover:shadow-[0_6px_16px_rgba(139,32,32,0.06)] hover:border-masala-primary/30 transition-all duration-300 flex items-start gap-3 animate-card-stagger-1 col-span-2 sm:col-span-1">
                    <div className="w-9 h-9 rounded-xl bg-masala-primary/5 flex items-center justify-center text-masala-primary flex-shrink-0">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-black uppercase tracking-wider text-masala-text-muted">Best Deal</p>
                      <p className="text-base font-black text-masala-primary mt-0.5">
                        €{insights.bestDeal.price?.toFixed(2)}
                      </p>
                      <p className="text-[11px] font-bold text-masala-text truncate mt-0.5 leading-none" title={insights.bestDeal.name}>
                        {insights.bestDeal.name}
                      </p>
                    </div>
                  </div>
                )}

                {/* Card 2: Lowest per unit / kg */}
                {insights.lowestPerKg && (
                  <div className="bg-white/80 backdrop-blur-md rounded-2xl p-3.5 border border-masala-border/50 shadow-[0_2px_8px_rgba(139,32,32,0.03)] hover:-translate-y-0.5 hover:shadow-[0_6px_16px_rgba(139,32,32,0.06)] hover:border-masala-primary/30 transition-all duration-300 flex items-start gap-3 animate-card-stagger-2">
                    <div className="w-9 h-9 rounded-xl bg-masala-accent/5 flex items-center justify-center text-masala-accent flex-shrink-0">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                      </svg>
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-black uppercase tracking-wider text-masala-text-muted">Best Value</p>
                      <p className="text-base font-black text-masala-text mt-0.5">
                        €{insights.lowestPerKg.toFixed(2)}/kg
                      </p>
                      <p className="text-[11px] font-bold text-masala-text-light mt-0.5 leading-none truncate">
                        Weight basis ratio
                      </p>
                    </div>
                  </div>
                )}

                {/* Card 3: In stock */}
                {insights.inStockCount !== undefined && (
                  <div className="bg-white/80 backdrop-blur-md rounded-2xl p-3.5 border border-masala-border/50 shadow-[0_2px_8px_rgba(139,32,32,0.03)] hover:-translate-y-0.5 hover:shadow-[0_6px_16px_rgba(139,32,32,0.06)] hover:border-masala-primary/30 transition-all duration-300 flex items-start gap-3 animate-card-stagger-3">
                    <div className="w-9 h-9 rounded-xl bg-masala-success/5 flex items-center justify-center text-masala-success flex-shrink-0">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-black uppercase tracking-wider text-masala-text-muted">In Stock</p>
                      <p className="text-base font-black text-masala-text mt-0.5">
                        {insights.inStockCount} items
                      </p>
                      <p className="text-[11px] font-bold text-masala-success mt-0.5 leading-none truncate">
                        Ready to ship
                      </p>
                    </div>
                  </div>
                )}

                {/* Card 4: Supermarkets compared */}
                {insights.storeCount !== undefined && (
                  <div className="bg-white/80 backdrop-blur-md rounded-2xl p-3.5 border border-masala-border/50 shadow-[0_2px_8px_rgba(139,32,32,0.03)] hover:-translate-y-0.5 hover:shadow-[0_6px_16px_rgba(139,32,32,0.06)] hover:border-masala-primary/30 transition-all duration-300 flex items-start gap-3 animate-card-stagger-4">
                    <div className="w-9 h-9 rounded-xl bg-masala-primary/5 flex items-center justify-center text-masala-primary flex-shrink-0">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-black uppercase tracking-wider text-masala-text-muted">Supermarkets</p>
                      <p className="text-base font-black text-masala-text mt-0.5">
                        {insights.storeCount} compared
                      </p>
                      <p className="text-[11px] font-bold text-masala-text-light mt-0.5 leading-none truncate">
                        Real-time scrapes
                      </p>
                    </div>
                  </div>
                )}

              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══ LAYER 3: Result count & Refresh ═══ */}
      {!loading && totalCount > 0 && (
        <div className="max-w-[1600px] mx-auto w-full px-3 flex items-center justify-between pt-2 pb-1">
          <p className="text-[10px] text-masala-text-muted font-bold">
            {totalCount} {t('search.resultsFor')} &ldquo;{filters.q.trim()}&rdquo;
          </p>
          <div className="flex items-center gap-2">
            {timeLabel && (
              <span className="text-[9px] font-bold text-masala-primary bg-masala-primary/5 border border-masala-primary/10 px-2 py-0.5 rounded-md animate-fade-in flex items-center gap-1">
                <span className="w-1 h-1 rounded-full bg-masala-primary animate-pulse"></span>
                {timeLabel}
              </span>
            )}
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              id="search-refresh-prices-btn"
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider transition-all duration-300 shadow-sm border border-masala-border/40 cursor-pointer ${
                refreshing 
                  ? 'bg-masala-primary/10 text-masala-primary animate-pulse cursor-not-allowed'
                  : 'bg-white hover:bg-masala-pill text-masala-text hover:text-masala-primary hover:shadow active:scale-95'
              }`}
            >
              <RefreshCw className={`h-3 w-3 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? t('search.loading') : t('search.refreshPrices')}
            </button>
          </div>
        </div>
      )}

      {/* ═══ LAYER 4: PRODUCT GRID — starts at ~128px from sticky header ═══ */}
      <div className="px-3 pt-2 pb-6 flex gap-8 max-w-[1600px] mx-auto w-full">
        <FilterSidebar isMobileOpen={filterOpen} onMobileClose={() => setFilterOpen(false)} resultCount={inStockResults.length} />
        
        <div className="flex-1 min-w-0">
          {loading && filters.q && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              {Array.from({ length: 6 }).map((_, i) => <ProductCardSkeleton key={i} />)}
            </div>
          )}

          {isPolling && <ScrapingProgress query={displayQuery} pollCount={pollCount} elapsedSecs={elapsedSecs} onRetry={fetchResults} />}

          {isTimedOut && <NoResults query={displayQuery} onRefresh={handleRefresh} />}

          {exactInStockResults.length > 0 && (
            <div className="mb-8">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                {exactInStockResults.map((listing: any, i: number) => (
                  <ProductCard
                    key={listing.id}
                    listing={{ ...listing, rank: i + 1 }}
                    searchQuery={displayQuery}
                    position={i + 1}
                    isBestPrice={i === 0}
                    isCompared={compareItems.some(c => c.id === listing.id)}
                    onCompareToggle={() => handleCompareToggle(listing)}
                  />
                ))}
              </div>
            </div>
          )}

          {relatedInStockResults.length > 0 && (
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-3">
                <div className="h-4 w-1 rounded-full bg-masala-border" />
                <p className="text-[10px] font-black uppercase tracking-widest text-masala-text-muted">
                  {t('search.relatedProducts')}
                </p>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                {relatedInStockResults.map((listing: any, i: number) => (
                  <ProductCard
                    key={listing.id}
                    listing={listing}
                    searchQuery={displayQuery}
                    position={exactInStockResults.length + i + 1}
                    isCompared={compareItems.some(c => c.id === listing.id)}
                    onCompareToggle={() => handleCompareToggle(listing)}
                  />
                ))}
              </div>
            </div>
          )}

          {outOfStockResults.length > 0 && (
            <div className="mt-8">
              <div className="flex items-center gap-2 mb-3">
                <div className="h-4 w-1 rounded-full bg-red-200" />
                <p className="text-[10px] font-black uppercase tracking-widest text-red-500">
                  {t('search.unavailableTitle')}
                </p>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 opacity-90">
                {outOfStockResults.map((listing: any, i: number) => (
                  <ProductCard
                    key={`oos-${listing.id}`}
                    listing={listing}
                    searchQuery={displayQuery}
                    position={totalCount + i + 1}
                    isCompared={compareItems.some(c => c.id === listing.id)}
                    onCompareToggle={() => handleCompareToggle(listing)}
                  />
                ))}
              </div>
            </div>
          )}

          {exactInStockResults.length === 0 && relatedInStockResults.length === 0 && inStockResults.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              {inStockResults.map((listing: any, i: number) => (
                <ProductCard
                  key={listing.id}
                  listing={{ ...listing, rank: i + 1 }}
                  searchQuery={displayQuery}
                  position={i + 1}
                  isBestPrice={i === 0}
                  isCompared={compareItems.some(c => c.id === listing.id)}
                  onCompareToggle={() => handleCompareToggle(listing)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <CompareTray
        items={compareItems}
        onRemove={id => setCompareItems(prev => prev.filter(i => i.id !== id))}
        onClear={() => setCompareItems([])}
      />

      {/* Floating mobile filters button */}
      <button
        onClick={() => setFilterOpen(true)}
        className="fixed bottom-6 right-6 z-40 lg:hidden shadow-[0_8px_30px_rgba(139,32,32,0.15)] bg-masala-primary hover:bg-masala-primary/95 text-white font-extrabold text-xs uppercase tracking-widest py-3.5 px-5 rounded-full flex items-center gap-2 hover:scale-105 active:scale-95 transition-all duration-200"
      >
        <SlidersHorizontal className="h-4 w-4 text-white" />
        Filters
        {hasActiveFilters && (
          <span className="bg-white text-masala-primary w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black leading-none">
            {activeFilterCount}
          </span>
        )}
      </button>
    </div>
  );
}

function ScrapingProgress({ query, pollCount, elapsedSecs, onRetry }: {
  query: string; pollCount: number; elapsedSecs: number; onRetry: () => void;
}) {
  const { t } = useLang();
  const progress = Math.min(Math.max(10, (pollCount / 8) * 85 + (elapsedSecs / 30) * 15), 90);
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-8 animate-fade-in">
      <div className="relative w-20 h-20 rounded-[1.5rem] bg-white border border-masala-border shadow-sm flex items-center justify-center">
        <Search className="h-9 w-9 text-masala-primary" />
        <span className="absolute -top-1 -right-1 flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-masala-primary opacity-75" />
          <span className="relative inline-flex rounded-full h-3 w-3 bg-masala-primary" />
        </span>
      </div>
      <div className="text-center space-y-2 max-w-sm px-4">
        <h2 className="text-2xl font-black text-masala-text" style={{ fontFamily: 'Fraunces, serif' }}>
          {t('search.searchingFor')} &ldquo;{query}&rdquo;
        </h2>
        <p className="text-masala-text-muted text-sm">{t('search.checkingLive')}</p>
        <span className="inline-flex items-center gap-1.5 text-xs font-black text-masala-primary bg-white px-3 py-1.5 rounded-full border border-masala-border">
          <Zap className="h-3 w-3" /> {elapsedSecs}s {t('search.elapsed')}
        </span>
      </div>
      <div className="w-full max-w-md space-y-4 px-4">
        <div className="relative w-full h-2 bg-masala-border/30 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-masala-primary to-masala-accent rounded-full transition-all duration-1000" style={{ width: `${progress}%` }} />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {STORE_NAMES_DISPLAY.map((store, i) => {
            const isDone = elapsedSecs > (i + 1) * 4;
            const isActive = !isDone && elapsedSecs > i * 3;
            return (
              <div key={store} className={`px-2 py-1.5 rounded-xl border text-[9px] font-black uppercase tracking-widest flex items-center gap-1 transition-all ${
                isDone ? 'bg-emerald-50 border-emerald-100 text-emerald-700'
                  : isActive ? 'bg-masala-pill border-masala-primary/30 text-masala-primary'
                  : 'bg-white border-masala-border text-masala-text-light'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${isDone ? 'bg-emerald-500' : isActive ? 'bg-masala-primary animate-pulse' : 'bg-masala-border'}`} />
                {store.split(' ')[0]}
              </div>
            );
          })}
        </div>
      </div>
      <button onClick={onRetry} className="px-6 py-3 rounded-2xl bg-white border border-masala-border text-sm font-bold text-masala-text hover:bg-masala-pill shadow-sm transition-all min-h-[44px] flex items-center gap-2">
        {t('search.checkNow')}
      </button>
    </div>
  );
}

function NoResults({ query, onRefresh }: { query: string; onRefresh: () => void }) {
  const { t } = useLang();
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-6 animate-fade-in px-4">
      <span className="text-6xl">🛒</span>
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-black text-masala-text" style={{ fontFamily: 'Fraunces, serif' }}>{t('search.notFoundTitle')}</h2>
        <p className="text-masala-text-muted text-sm max-w-sm">
          {t('search.notFoundDesc').replace('{query}', query)}
        </p>
      </div>
      <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto px-6 sm:px-0">
        <button onClick={onRefresh} className="flex-1 sm:flex-none px-8 py-3.5 rounded-2xl bg-masala-primary text-white text-sm font-black hover:bg-masala-secondary shadow-lg shadow-masala-primary/20 transition-all flex items-center justify-center gap-2 min-h-[48px]">
          <RefreshCw className="h-4 w-4" /> {t('search.tryAgain')}
        </button>
        <a href="/" className="flex-1 sm:flex-none px-8 py-3.5 rounded-2xl bg-white border border-masala-border text-sm font-bold text-masala-text hover:bg-masala-pill transition-all min-h-[48px] flex items-center justify-center">
          {t('search.browseCategories')}
        </a>
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen py-10 px-4 bg-masala-bg">
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {[...Array(8)].map((_, i) => <ProductCardSkeleton key={i} />)}
          </div>
        </div>
      </div>
    }>
      <SearchPageContent />
    </Suspense>
  );
}

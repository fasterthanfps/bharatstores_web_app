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

      setResults(listings);
      setLoading(false);
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
      if (data.success) { setResults(data.data?.listings || []); setLoading(false); }
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

  return (
    <div className="min-h-screen pb-24 bg-masala-bg">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        {/* Results header */}
        {displayQuery && !loading && (
          <div className="mb-5 animate-fade-in">
            {/* Count + query + refresh */}
            <div className="flex items-center justify-between gap-3 mb-3">
              <div className="min-w-0">
                <p className="text-[11px] font-bold text-masala-text-muted uppercase tracking-wider">
                  {totalCount} {t('search.resultsFor')}
                </p>
                <h1 className="text-lg sm:text-2xl font-black text-masala-text leading-tight truncate" style={{ fontFamily: 'Fraunces, serif' }}>
                  &ldquo;{displayQuery}&rdquo;
                </h1>
              </div>

              <button
                onClick={handleRefresh}
                disabled={refreshing}
                title={t('search.refreshPrices')}
                className={`flex-shrink-0 w-11 h-11 rounded-2xl border border-masala-border bg-white text-masala-text shadow-sm flex items-center justify-center hover:border-masala-primary hover:text-masala-primary transition-all active:scale-90 ${refreshing ? 'opacity-60 cursor-not-allowed' : ''}`}
              >
                <RefreshCw className={`h-4.5 w-4.5 ${refreshing ? 'animate-spin text-masala-primary' : ''}`} style={{ width: '18px', height: '18px' }} />
              </button>
            </div>

            {/* Sort tabs + Filter button */}
            <div className="sticky top-[56px] md:top-20 z-30 bg-masala-bg/90 backdrop-blur-md -mx-4 px-4 sm:mx-0 sm:px-0 py-3 mb-4 border-b border-masala-border/50 lg:border-none">
              <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
                <div className="flex items-center bg-white border border-masala-border rounded-2xl p-1 gap-0.5 shadow-sm flex-shrink-0">
                  {SORT_TABS.map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setFilters({ sort: tab.id })}
                      className={`px-3.5 py-2 rounded-xl text-[11px] font-black transition-all whitespace-nowrap min-h-[36px] ${
                        filters.sort === tab.id
                          ? 'bg-masala-primary text-white shadow-sm'
                          : 'text-masala-text-muted hover:text-masala-text'
                      }`}
                    >
                      {t(tab.labelKey)}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setFilterOpen(true)}
                  className={`lg:hidden flex items-center gap-2 px-4 py-2 rounded-2xl border min-h-[36px] text-[12px] font-bold whitespace-nowrap flex-shrink-0 shadow-sm transition-all active:scale-95 ${
                    activeFilterCount > 0
                      ? 'bg-masala-primary text-white border-masala-primary'
                      : 'bg-white border-masala-border text-masala-text hover:border-masala-primary'
                  }`}
                >
                  <SlidersHorizontal className="h-4 w-4" />
                  {t('search.filters')}
                  {activeFilterCount > 0 && (
                    <span className="w-5 h-5 rounded-full bg-white text-masala-primary text-[10px] font-black flex items-center justify-center">
                      {activeFilterCount}
                    </span>
                  )}
                </button>
              </div>
            </div>

            {totalCount > 0 && (
              <div className="mb-5 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-2.5">
                <div className="rounded-2xl border border-emerald-200 bg-white px-3 py-2.5">
                  <p className="text-[10px] font-black uppercase tracking-wider text-emerald-700 flex items-center gap-1">
                    <Sparkles className="h-3.5 w-3.5" /> {t('search.bestDeal')}
                  </p>
                  <p className="text-sm font-black text-masala-text truncate mt-1">{bestDeal?.product_name ?? t('search.noInStockDeals')}</p>
                </div>
                <div className="rounded-2xl border border-masala-border bg-white px-3 py-2.5">
                  <p className="text-[10px] font-black uppercase tracking-wider text-masala-text-muted flex items-center gap-1">
                    <TrendingDown className="h-3.5 w-3.5" /> {t('search.lowestPricePerKg')}
                  </p>
                  <p className="text-sm font-black text-masala-primary mt-1">
                    {lowestPerKg?.price_per_kg ? `€${Number(lowestPerKg.price_per_kg).toFixed(2)}${t('search.perKg')}` : t('search.notAvailable')}
                  </p>
                </div>
                <div className="rounded-2xl border border-masala-border bg-white px-3 py-2.5">
                  <p className="text-[10px] font-black uppercase tracking-wider text-masala-text-muted flex items-center gap-1">
                    <PackageCheck className="h-3.5 w-3.5" /> {t('search.inStock')}
                  </p>
                  <p className="text-sm font-black text-masala-text mt-1">{inStockResults.length} {t('home.stat.products').toLowerCase()}</p>
                </div>
                <div className="rounded-2xl border border-masala-border bg-white px-3 py-2.5">
                  <p className="text-[10px] font-black uppercase tracking-wider text-masala-text-muted flex items-center gap-1">
                    <Store className="h-3.5 w-3.5" /> {t('search.storesMatched')}
                  </p>
                  <p className="text-sm font-black text-masala-text mt-1">{matchedStoresCount}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Main layout */}
        <div className="flex gap-8">
          {/* Sidebar */}
          <FilterSidebar isMobileOpen={filterOpen} onMobileClose={() => setFilterOpen(false)} resultCount={inStockResults.length} />

          <div className="flex-1 min-w-0">
            {/* Loading skeletons */}
            {loading && filters.q && (
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                {[...Array(8)].map((_, i) => <ProductCardSkeleton key={i} />)}
              </div>
            )}

            {/* Polling progress */}
            {isPolling && <ScrapingProgress query={displayQuery} pollCount={pollCount} elapsedSecs={elapsedSecs} onRetry={fetchResults} />}

            {/* Timed out */}
            {isTimedOut && <NoResults query={displayQuery} onRefresh={handleRefresh} />}

            {/* Exact matches */}
            {exactInStockResults.length > 0 && (
              <div className="mb-10">
                <div className="flex items-center gap-2 mb-4">
                  <div className="h-5 w-1 rounded-full bg-masala-primary" />
                  <p className="text-[11px] font-black uppercase tracking-widest text-masala-primary">
                    {exactInStockResults.length} {exactInStockResults.length === 1 ? t('search.exactMatch') : t('search.exactMatches')}
                  </p>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
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

            {/* Related */}
            {relatedInStockResults.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="h-5 w-1 rounded-full bg-masala-border" />
                  <p className="text-[11px] font-black uppercase tracking-widest text-masala-text-muted">
                    {relatedInStockResults.length} {t('search.relatedProducts')}
                  </p>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
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
              <div className="mt-10">
                <div className="flex items-center gap-2 mb-4">
                  <div className="h-5 w-1 rounded-full bg-red-200" />
                  <p className="text-[11px] font-black uppercase tracking-widest text-red-500">
                    {outOfStockResults.length} {t('search.unavailableTitle')}
                  </p>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 opacity-90">
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

            {/* Fallback */}
            {exactInStockResults.length === 0 && relatedInStockResults.length === 0 && inStockResults.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
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
      </div>

      <CompareTray
        items={compareItems}
        onRemove={id => setCompareItems(prev => prev.filter(i => i.id !== id))}
        onClear={() => setCompareItems([])}
      />
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
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
            {[...Array(8)].map((_, i) => <ProductCardSkeleton key={i} />)}
          </div>
        </div>
      </div>
    }>
      <SearchPageContent />
    </Suspense>
  );
}

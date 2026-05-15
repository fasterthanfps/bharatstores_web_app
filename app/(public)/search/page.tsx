'use client';

import { Suspense, useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import SearchAutocomplete from '@/components/search/SearchAutocomplete';
import ProductCard from '@/components/ui/ProductCard';
import { ProductCardSkeleton } from '@/components/ui/ProductCardSkeleton';
import CompareTray from '@/components/ui/CompareTray';
import FilterSidebar from '@/components/ui/FilterSidebar';
import { useSearchFilters } from '@/hooks/useSearchFilters';
import { getStoreConfig } from '@/lib/stores';
import { Search, RefreshCw, Zap, SlidersHorizontal, X } from 'lucide-react';

const SORT_TABS = [
  { id: 'best', label: 'BEST' },
  { id: 'price', label: 'PRICE' },
  { id: 'pricePerKg', label: '€/KG' },
  { id: 'stock', label: 'STOCK' },
] as const;

const STORE_NAMES_DISPLAY = ['Dookan', 'Jamoona', 'Swadesh', 'Namma Markt', 'Angaadi', 'Little India', 'Spice Village', 'Grocera'];

function SearchPageContent() {
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
      if (listings.length > 0) stopTimer();

      if (isRefreshing && !refreshingRef.current) { setRefreshing(true); refreshingRef.current = true; }
      else if (!isRefreshing) { setRefreshing(false); refreshingRef.current = false; }

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
    if (!refreshing || !results.length) return;
    const t = setTimeout(() => fetchResults(), 6000);
    return () => clearTimeout(t);
  }, [refreshing, results, fetchResults]);

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

  return (
    <div className="min-h-screen pb-24">
      {/* Sticky search bar */}
      <div className="sticky top-0 z-40 bg-masala-bg/95 backdrop-blur-md border-b border-masala-border shadow-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-3">
          <SearchAutocomplete initialQuery={filters.q} size="header" />
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
        {/* Results header */}
        {displayQuery && !loading && (
          <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
            <div className="flex items-center gap-3 flex-wrap">
              {exactResults.length > 0 && (
                <span className="px-3 py-1 bg-masala-pill rounded-full text-[11px] font-black uppercase tracking-widest text-masala-primary border border-masala-border">
                  {exactResults.length} Exact
                </span>
              )}
              <h2 className="text-xl sm:text-2xl font-black text-masala-text" style={{ fontFamily: 'Fraunces, serif' }}>
                {totalCount > 0 ? `${totalCount} results for ` : `No results for `}
                <span className="text-masala-primary">&ldquo;{displayQuery}&rdquo;</span>
              </h2>
              
              {/* REFRESH BUTTON (FIX) */}
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-masala-border bg-white text-[11px] font-black uppercase tracking-widest hover:border-masala-primary hover:text-masala-primary transition-all active:scale-95 ${refreshing ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                <RefreshCw className={`h-3 w-3 ${refreshing ? 'animate-spin' : ''}`} />
                {refreshing ? 'Refreshing...' : 'Refresh Prices'}
              </button>
            </div>

            {/* Sort tabs + mobile filter button */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1 bg-white border border-masala-border rounded-xl p-1">
                {SORT_TABS.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setFilters({ sort: tab.id })}
                    className={`px-3 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-wider transition-all ${
                      filters.sort === tab.id
                        ? 'bg-masala-primary text-white shadow-sm'
                        : 'text-masala-text-muted hover:text-masala-text'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setFilterOpen(true)}
                className="lg:hidden relative flex items-center gap-1.5 px-3 py-2 bg-white border border-masala-border rounded-xl text-[12px] font-semibold text-masala-text hover:border-masala-primary/40 transition-colors min-h-[44px]"
              >
                <SlidersHorizontal className="h-4 w-4" />
                Filters
                {activeFilterCount > 0 && (
                  <span className="w-5 h-5 rounded-full bg-masala-primary text-white text-[10px] font-black flex items-center justify-center flex-shrink-0">
                    {activeFilterCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Active filter chips */}
        {hasActiveFilters && displayQuery && (
          <div className="flex flex-wrap items-center gap-2 mb-4">
            {filters.stores.map(storeId => {
              const config = getStoreConfig(storeId);
              return (
                <button
                  key={storeId}
                  onClick={() => setFilters({ stores: filters.stores.filter(s => s !== storeId) })}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-all hover:opacity-80"
                  style={{ background: config.color, color: config.textColor, borderColor: config.textColor + '30' }}
                >
                  {config.label}
                  <X className="h-3 w-3" />
                </button>
              );
            })}
            {filters.inStockOnly && (
              <button
                onClick={() => setFilters({ inStockOnly: false })}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-masala-success-bg text-masala-success text-xs font-bold border border-masala-success/20 hover:opacity-80 transition-all"
              >
                In Stock Only <X className="h-3 w-3" />
              </button>
            )}
            {filters.maxPrice < 100 && (
              <button
                onClick={() => setFilters({ maxPrice: 100 })}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-masala-pill text-masala-text text-xs font-bold border border-masala-border hover:opacity-80 transition-all"
              >
                Max €{filters.maxPrice} <X className="h-3 w-3" />
              </button>
            )}
            <button
              onClick={clearFilters}
              className="text-xs text-masala-text-muted hover:text-masala-primary underline ml-1 transition-colors"
            >
              Clear all
            </button>
          </div>
        )}

        {/* Main layout */}
        <div className="flex gap-6">
          <FilterSidebar isMobileOpen={filterOpen} onMobileClose={() => setFilterOpen(false)} />

          <div className="flex-1 min-w-0">
            {/* Loading skeletons */}
            {loading && filters.q && (
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
                {[...Array(8)].map((_, i) => <ProductCardSkeleton key={i} />)}
              </div>
            )}

            {/* Polling progress */}
            {isPolling && <ScrapingProgress query={displayQuery} pollCount={pollCount} elapsedSecs={elapsedSecs} onRetry={fetchResults} />}

            {/* Timed out */}
            {isTimedOut && <NoResults query={displayQuery} onRefresh={handleRefresh} />}

            {/* Exact matches */}
            {exactResults.length > 0 && (
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <span className="h-5 w-1 rounded-full bg-masala-primary block" />
                  <p className="text-xs font-black uppercase tracking-widest text-masala-primary">
                    {exactResults.length} Exact {exactResults.length === 1 ? 'Match' : 'Matches'}
                  </p>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
                  {exactResults.map((listing: any, i: number) => (
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
            {relatedResults.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <span className="h-5 w-1 rounded-full bg-masala-border block" />
                  <p className="text-xs font-black uppercase tracking-widest text-masala-text-muted">
                    {relatedResults.length} Related Products
                  </p>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
                  {relatedResults.map((listing: any, i: number) => (
                    <ProductCard
                      key={listing.id}
                      listing={listing}
                      searchQuery={displayQuery}
                      position={exactResults.length + i + 1}
                      isCompared={compareItems.some(c => c.id === listing.id)}
                      onCompareToggle={() => handleCompareToggle(listing)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Fallback */}
            {exactResults.length === 0 && relatedResults.length === 0 && results.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
                {results.map((listing: any, i: number) => (
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
      <div className="text-center space-y-2 max-w-sm">
        <h2 className="text-2xl font-black text-masala-text" style={{ fontFamily: 'Fraunces, serif' }}>
          Searching for &ldquo;{query}&rdquo;
        </h2>
        <p className="text-masala-text-muted text-sm">Checking live prices across 8 Indian grocery stores…</p>
        <span className="inline-flex items-center gap-1.5 text-xs font-black text-masala-primary bg-masala-pill px-3 py-1.5 rounded-full border border-masala-border">
          <Zap className="h-3 w-3" /> {elapsedSecs}s elapsed
        </span>
      </div>
      <div className="w-full max-w-md space-y-3">
        <div className="relative w-full h-2 bg-masala-border/30 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-masala-primary to-masala-accent rounded-full transition-all duration-1000" style={{ width: `${progress}%` }} />
        </div>
        <div className="grid grid-cols-4 gap-1.5">
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
      <button onClick={onRetry} className="px-6 py-3 rounded-2xl bg-white border border-masala-border text-sm font-bold text-masala-text hover:bg-masala-pill transition-all min-h-[44px] flex items-center gap-2">
        Check now →
      </button>
    </div>
  );
}

function NoResults({ query, onRefresh }: { query: string; onRefresh: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-6 animate-fade-in">
      <span className="text-6xl">🛒</span>
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-black text-masala-text" style={{ fontFamily: 'Fraunces, serif' }}>Not Found in Stores</h2>
        <p className="text-masala-text-muted text-sm max-w-sm">
          No products for <span className="text-masala-primary font-bold">&quot;{query}&quot;</span>. Try a different search term.
        </p>
      </div>
      <div className="flex gap-3 flex-wrap justify-center">
        <button onClick={onRefresh} className="px-6 py-3 rounded-2xl bg-masala-primary text-white text-sm font-black hover:bg-masala-secondary transition-all flex items-center gap-2 min-h-[44px]">
          <RefreshCw className="h-4 w-4" /> Try Again
        </button>
        <a href="/" className="px-6 py-3 rounded-2xl bg-white border border-masala-border text-sm font-bold text-masala-text hover:bg-masala-muted transition-all min-h-[44px] flex items-center">
          Browse Categories
        </a>
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen py-10 px-4">
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
            {[...Array(8)].map((_, i) => <ProductCardSkeleton key={i} />)}
          </div>
        </div>
      </div>
    }>
      <SearchPageContent />
    </Suspense>
  );
}

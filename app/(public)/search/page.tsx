'use client';

import { Suspense, useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import SearchBar from '@/components/search/SearchBar';
import ComparisonGrid from '@/components/comparison/ComparisonGrid';
import { Search, RefreshCw, Zap } from 'lucide-react';

const STORE_NAMES = [
    'Dookan', 'Jamoona', 'Swadesh', 'Namma Markt',
    'Angaadi', 'Little India', 'Spice Village', 'Grocera',
];

function SearchPageContent() {
    const searchParams = useSearchParams();
    const query = searchParams.get('q') ?? '';
    const sort = searchParams.get('sort') ?? 'price';

    const [results, setResults] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [fresh, setFresh] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [pollCount, setPollCount] = useState(0);
    const [exactCount, setExactCount] = useState(0);
    const [relatedCount, setRelatedCount] = useState(0);
    const [elapsedSecs, setElapsedSecs] = useState(0);
    const refreshingRef = useRef(false);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const searchStartRef = useRef<number>(Date.now());

    const stopTimer = () => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
    };

    const startTimer = () => {
        stopTimer();
        searchStartRef.current = Date.now();
        setElapsedSecs(0);
        timerRef.current = setInterval(() => {
            setElapsedSecs(Math.floor((Date.now() - searchStartRef.current) / 1000));
        }, 1000);
    };

    const fetchResults = useCallback(async (): Promise<boolean> => {
        if (!query || query.length < 2) return false;
        try {
            const res = await fetch(`/api/search?q=${encodeURIComponent(query)}&sort=${sort}`);
            const data = await res.json();
            const listings = data.data?.listings || [];
            const isFresh = data.data?.fresh !== false;
            const isRefreshing = data.data?.refreshing === true;

            setResults(listings);
            setFresh(isFresh);
            setExactCount(data.data?.exactCount ?? 0);
            setRelatedCount(data.data?.relatedCount ?? 0);
            setLoading(false);

            if (listings.length > 0) stopTimer();

            if (isRefreshing && !refreshingRef.current) {
                setRefreshing(true);
                refreshingRef.current = true;
            } else if (isFresh && !isRefreshing) {
                setRefreshing(false);
                refreshingRef.current = false;
            }

            return listings.length > 0;
        } catch {
            setLoading(false);
            return false;
        }
    }, [query, sort]);

    // On query change: reset and fetch
    useEffect(() => {
        setLoading(true);
        setResults([]);
        setPollCount(0);
        setRefreshing(false);
        refreshingRef.current = false;
        startTimer();
        if (query.length >= 2) fetchResults();
        else { setLoading(false); stopTimer(); }
        return () => stopTimer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [query]);

    // Poll while no results yet (cold cache — scraper is running)
    // Poll every 4s for a max of 8 attempts (~32s total)
    useEffect(() => {
        if (results.length > 0 || pollCount >= 8 || query.length < 2) return;
        const timer = setTimeout(async () => {
            const found = await fetchResults();
            if (!found) setPollCount(c => c + 1);
        }, 4000);
        return () => clearTimeout(timer);
    }, [results, pollCount, fetchResults, query]);

    // When a background refresh is in progress, poll every 6s to pick up fresh data
    useEffect(() => {
        if (!refreshing || !results.length) return;
        const timer = setTimeout(async () => {
            await fetchResults();
        }, 6000);
        return () => clearTimeout(timer);
    }, [refreshing, results, fetchResults]);

    const isPolling = results.length === 0 && pollCount < 8 && !loading && query.length >= 2;
    const isTimedOut = results.length === 0 && pollCount >= 8 && !loading;

    // ↻ Manual hard refresh
    const handleRefresh = useCallback(async () => {
        setLoading(true);
        setRefreshing(false);
        refreshingRef.current = false;
        startTimer();
        try {
            const res = await fetch(
                `/api/search/refresh?q=${encodeURIComponent(query)}&sort=${sort}`,
                { method: 'POST' }
            );
            const data = await res.json();
            if (data.success) {
                setResults(data.data?.listings || []);
                setExactCount(data.data?.exactCount ?? 0);
                setRelatedCount(data.data?.relatedCount ?? 0);
                setFresh(true);
            } else {
                await fetchResults();
            }
        } catch {
            await fetchResults();
        } finally {
            setLoading(false);
            stopTimer();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [query, sort, fetchResults]);

    return (
        <div className="min-h-screen px-4 sm:px-6 lg:px-8 py-8">
            <div className="mx-auto max-w-4xl">
                <div className="mb-10">
                    <SearchBar initialQuery={query} size="header" />
                </div>

                {!query && (
                    <div className="text-center py-20 text-masala-text/40 font-medium">
                        Bitte gib einen Suchbegriff ein.
                    </div>
                )}

                {/* Initial loading skeleton */}
                {query && loading && results.length === 0 && <LoadingSkeleton />}

                {/* Live scraping progress */}
                {query && isPolling && <ScrapingProgress query={query} pollCount={pollCount} elapsedSecs={elapsedSecs} onRetry={fetchResults} />}

                {/* Timed out — no results */}
                {query && isTimedOut && (
                    <NoResults query={query} onRefresh={handleRefresh} />
                )}

                {/* Results found */}
                {query && results.length > 0 && !loading && (
                    <>
                        {refreshing && (
                            <div className="flex items-center gap-3 mb-6 px-5 py-3 rounded-2xl bg-masala-pill border border-masala-border text-masala-primary text-xs font-bold animate-fade-in w-fit shadow-sm">
                                <RefreshCw className="h-4 w-4 animate-spin" />
                                Prices refreshing in background...
                            </div>
                        )}
                        {/* Exact matches section */}
                        {exactCount > 0 && (
                            <div className="mb-2">
                                <div className="flex items-center gap-2 mb-4">
                                    <span className="h-5 w-1 rounded-full bg-masala-primary block" />
                                    <h2 className="text-xs font-black uppercase tracking-widest text-masala-primary">
                                        {exactCount} Exact {exactCount === 1 ? 'Match' : 'Matches'}
                                    </h2>
                                </div>
                                <ComparisonGrid
                                    listings={results.filter((l: any) => (l._score ?? 0) >= 80)}
                                    query={query}
                                    fresh={fresh}
                                    onRefresh={handleRefresh}
                                    isRefreshing={loading}
                                />
                            </div>
                        )}

                        {/* Related items section */}
                        {relatedCount > 0 && (
                            <div className="mt-8">
                                <div className="flex items-center gap-2 mb-4">
                                    <span className="h-5 w-1 rounded-full bg-masala-text/20 block" />
                                    <h2 className="text-xs font-black uppercase tracking-widest text-masala-text/50">
                                        {relatedCount} Related Products
                                    </h2>
                                    <span className="text-[10px] text-masala-text/40 font-medium ml-1">(similar or related items)</span>
                                </div>
                                <ComparisonGrid
                                    listings={results.filter((l: any) => (l._score ?? 0) < 80 && (l._score ?? 0) > 0)}
                                    query={query}
                                    fresh={fresh}
                                    onRefresh={handleRefresh}
                                    isRefreshing={loading}
                                />
                            </div>
                        )}

                        {/* Fallback: no score metadata (old cache) */}
                        {exactCount === 0 && relatedCount === 0 && (
                            <ComparisonGrid
                                listings={results}
                                query={query}
                                fresh={fresh}
                                onRefresh={handleRefresh}
                                isRefreshing={loading}
                            />
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

// ── Scraping Progress State ────────────────────────────────────────────────────
function ScrapingProgress({
    query,
    pollCount,
    elapsedSecs,
    onRetry,
}: {
    query: string;
    pollCount: number;
    elapsedSecs: number;
    onRetry: () => void;
}) {
    const progress = Math.min(Math.max(10, (pollCount / 8) * 85 + (elapsedSecs / 30) * 15), 90);

    return (
        <div className="flex flex-col items-center justify-center py-16 px-4 gap-8 animate-fade-in">
            {/* Animated icon */}
            <div className="relative">
                <div className="absolute inset-0 bg-masala-primary/10 blur-3xl rounded-full scale-150" />
                <div className="relative w-24 h-24 rounded-[2rem] bg-white border border-masala-border shadow-sm flex items-center justify-center">
                    <div className="relative">
                        <Search className="h-10 w-10 text-masala-primary" />
                        <span className="absolute -top-1 -right-1 flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-masala-primary opacity-75" />
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-masala-primary" />
                        </span>
                    </div>
                </div>
            </div>

            {/* Text */}
            <div className="text-center space-y-3 max-w-sm">
                <h2 className="text-2xl sm:text-3xl font-black font-serif text-masala-text">
                    Searching for &ldquo;{query}&rdquo;
                </h2>
                <p className="text-masala-text/60 text-sm leading-relaxed">
                    We&apos;re searching live across <strong className="text-masala-text font-bold">8 Indian grocery stores</strong> in Europe.
                    Results appear as each store responds.
                </p>
                <div className="inline-flex items-center gap-2 text-xs font-black text-masala-primary bg-masala-pill px-4 py-2 rounded-full border border-masala-border">
                    <Zap className="h-3.5 w-3.5" />
                    {elapsedSecs}s elapsed
                </div>
            </div>

            {/* Progress bar */}
            <div className="w-full max-w-md space-y-5">
                <div className="relative w-full h-2.5 bg-masala-border/30 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-masala-primary to-masala-secondary rounded-full transition-all duration-1000 ease-out"
                        style={{ width: `${progress}%` }}
                    />
                    {/* Shimmer effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
                </div>

                {/* Store status indicators */}
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-3">
                    {STORE_NAMES.map((store, i) => {
                        const isDone = elapsedSecs > (i + 1) * 5;
                        const isActive = !isDone && elapsedSecs > i * 4;
                        return (
                            <div
                                key={store}
                                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-2xl border text-[10px] font-black uppercase tracking-widest transition-all duration-500 ${isDone
                                    ? 'bg-emerald-50 border-emerald-100 text-emerald-700'
                                    : isActive
                                        ? 'bg-masala-pill border-masala-primary/30 text-masala-primary'
                                        : 'bg-white border-masala-border text-masala-text/30'
                                    }`}
                            >
                                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${isDone
                                    ? 'bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.4)]'
                                    : isActive
                                        ? 'bg-masala-primary animate-pulse'
                                        : 'bg-masala-border'
                                    }`} />
                                {store}
                            </div>
                        );
                    })}
                </div>
            </div>

            <button
                onClick={onRetry}
                className="px-6 py-3 rounded-2xl bg-white border border-masala-border text-sm font-bold text-masala-text hover:bg-masala-pill hover:border-masala-primary/30 transition-all shadow-sm flex items-center gap-2 group"
            >
                Check now
                <span className="group-hover:translate-x-1 transition-transform">→</span>
            </button>
        </div>
    );
}

// ── No Results (timed out) ────────────────────────────────────────────────────
function NoResults({ query, onRefresh }: { query: string; onRefresh: () => void }) {
    return (
        <div className="flex flex-col items-center justify-center py-24 px-4 gap-6 animate-fade-in">
            <div className="relative">
                <div className="absolute inset-0 bg-masala-primary/10 blur-3xl rounded-full" />
                <div className="relative w-24 h-24 rounded-[2rem] bg-white border border-masala-border flex items-center justify-center text-5xl shadow-sm rotate-3 hover:rotate-0 transition-transform duration-500">
                    🛒
                </div>
            </div>
            <div className="text-center space-y-3">
                <h2 className="text-3xl font-black font-serif text-masala-text">Not Found in Stores</h2>
                <p className="text-masala-text/60 text-sm max-w-sm mx-auto leading-relaxed">
                    No products found for <span className="text-masala-primary font-bold">&quot;{query}&quot;</span> across our partner stores.<br />
                    This product may not be stocked or try a different search term.
                </p>
            </div>
            <div className="flex gap-3 flex-wrap justify-center">
                <button
                    onClick={onRefresh}
                    className="px-6 py-3 rounded-2xl bg-masala-primary text-white text-sm font-black uppercase tracking-widest hover:bg-masala-secondary transition-all shadow-md flex items-center gap-2"
                >
                    <RefreshCw className="h-4 w-4" />
                    Try Again
                </button>
                <a
                    href="/"
                    className="px-6 py-3 rounded-2xl bg-white border border-masala-border text-sm font-bold text-masala-text hover:bg-masala-pill transition-all shadow-sm"
                >
                    Browse Categories
                </a>
            </div>
        </div>
    );
}

// ── Loading Skeleton ──────────────────────────────────────────────────────────
function LoadingSkeleton() {
    return (
        <div className="space-y-6 animate-fade-in">
            {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-[2.5rem] border border-masala-border p-6 flex flex-col sm:flex-row gap-6 shadow-sm" style={{ opacity: 1 - (i - 1) * 0.2 }}>
                    <div className="flex sm:flex-col items-center gap-4 sm:gap-5 flex-shrink-0">
                        <div className="w-8 h-8 rounded-2xl bg-masala-pill animate-pulse" />
                        <div className="w-28 h-28 rounded-3xl bg-masala-pill animate-pulse" />
                    </div>
                    <div className="flex-1 space-y-4">
                        <div className="flex justify-between items-start gap-4">
                            <div className="space-y-3 flex-1">
                                <div className="h-3 w-20 bg-masala-pill rounded-full animate-pulse" />
                                <div className="h-7 w-3/4 bg-masala-pill rounded-xl animate-pulse" />
                                <div className="h-4 w-24 bg-masala-pill rounded-full animate-pulse" />
                                <div className="flex gap-2 pt-1">
                                    <div className="h-6 w-20 bg-masala-pill rounded-full animate-pulse" />
                                    <div className="h-6 w-16 bg-masala-pill rounded-full animate-pulse" />
                                </div>
                            </div>
                            <div className="h-24 w-32 bg-masala-pill rounded-3xl animate-pulse" />
                        </div>
                        <div className="flex gap-3 pt-4 border-t border-masala-border/50">
                            <div className="h-12 flex-1 bg-masala-pill rounded-2xl animate-pulse" />
                            <div className="h-12 w-32 bg-masala-pill rounded-2xl animate-pulse" />
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}

export default function SearchPage() {
    return (
        <Suspense fallback={<LoadingSkeleton />}>
            <SearchPageContent />
        </Suspense>
    );
}

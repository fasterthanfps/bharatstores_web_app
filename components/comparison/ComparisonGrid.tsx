'use client';

import { useState, useMemo } from 'react';
import { ArrowUpDown, RefreshCw, AlertCircle, Sparkles } from 'lucide-react';
import ListingCard from './ListingCard';
import type { ListingWithStore } from '@/types/api';

type SortKey = 'relevance' | 'price' | 'price_per_kg' | 'availability';

interface ComparisonGridProps {
    listings: ListingWithStore[];
    query: string;
    fresh: boolean;
    onRefresh?: () => void;
    isRefreshing?: boolean;
    lastUpdated?: string;
}

export default function ComparisonGrid({
    listings,
    query,
    fresh,
    onRefresh,
    isRefreshing,
    lastUpdated,
}: ComparisonGridProps) {
    // Default to relevance — preserves the API-ranked order (Kissan Jam first)
    const [sortKey, setSortKey] = useState<SortKey>('relevance');

    const sorted = useMemo(() => {
        return [...listings].sort((a, b) => {
            if (sortKey === 'relevance') {
                // Primary: API relevance score desc
                const sa = a._score ?? 0;
                const sb = b._score ?? 0;
                if (sb !== sa) return sb - sa;
                // Tiebreak: IN_STOCK before out-of-stock
                const aIn = a.availability === 'IN_STOCK' ? 0 : 1;
                const bIn = b.availability === 'IN_STOCK' ? 0 : 1;
                if (aIn !== bIn) return aIn - bIn;
                // Tiebreak: price asc
                return (a.price ?? 999) - (b.price ?? 999);
            }

            if (sortKey === 'price') {
                const valA = a.price ?? 999;
                const valB = b.price ?? 999;
                if (valA === 0 && valB !== 0) return 1;
                if (valB === 0 && valA !== 0) return -1;
                return valA - valB;
            }

            if (sortKey === 'price_per_kg') {
                const aPkg = a.price_per_kg ?? 999999;
                const bPkg = b.price_per_kg ?? 999999;
                if (aPkg === 0 && bPkg !== 0) return 1;
                if (bPkg === 0 && aPkg !== 0) return -1;
                return aPkg - bPkg;
            }

            // availability: IN_STOCK first
            const order = { IN_STOCK: 0, LOW_STOCK: 1, UNKNOWN: 2, UPCOMING: 3, OUT_OF_STOCK: 4 };
            return (
                (order[a.availability as keyof typeof order] ?? 2) -
                (order[b.availability as keyof typeof order] ?? 2)
            );
        });
    }, [listings, sortKey]);

    const lowestValidPrice = sorted.find(l => (l.price ?? 0) > 0)?.price ?? null;

    if (listings.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-24 text-center animate-fade-in">
                <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-[2rem] bg-masala-pill border border-masala-border shadow-sm animate-float">
                    <AlertCircle className="h-10 w-10 text-masala-primary" />
                </div>
                <h3 className="text-2xl font-black font-serif text-masala-text mb-3">No products found</h3>
                <p className="text-masala-text/60 text-sm max-w-sm mx-auto leading-relaxed">
                    No products were found for &quot;<strong className="text-masala-text font-bold">{query}</strong>&quot;. The shops are being
                    searched in the background — please try again in 30 seconds.
                </p>
                {onRefresh && (
                    <button
                        onClick={onRefresh}
                        disabled={isRefreshing}
                        className="mt-8 inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-white border border-masala-border text-masala-text hover:bg-masala-pill hover:border-masala-primary/30 transition-all font-bold text-sm shadow-sm disabled:opacity-50"
                    >
                        <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                        Search again
                    </button>
                )}
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Header row */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                <div className="flex flex-col gap-1">
                    <h2 className="text-[10px] sm:text-xs font-black text-masala-text/40 uppercase tracking-[0.2em] flex items-center gap-2">
                        <span className="text-masala-primary animate-count">{listings.length}</span> results for
                    </h2>
                    <h3 className="text-2xl sm:text-3xl font-black font-serif text-masala-text truncate max-w-[300px] sm:max-w-md">
                        &quot;{query}&quot;
                    </h3>
                    {!fresh && (
                        <div className="inline-flex items-center gap-2 text-[10px] font-black bg-masala-pill text-masala-primary border border-masala-border rounded-full px-3 py-1.5 w-fit mt-2 shadow-sm animate-fade-in">
                            <AlertCircle className="h-3.5 w-3.5" />
                            STALE DATA — REFRESHING
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-3">
                    {/* Sort controls */}
                    <div className="flex-1 sm:flex-initial flex items-center gap-1.5 p-1.5 bg-white border border-masala-border rounded-[1.25rem] shadow-sm">
                        <SortButton
                            active={sortKey === 'relevance'}
                            onClick={() => setSortKey('relevance')}
                            icon={<Sparkles className="h-3 w-3" />}
                        >
                            Best
                        </SortButton>
                        <SortButton
                            active={sortKey === 'price'}
                            onClick={() => setSortKey('price')}
                        >
                            Price
                        </SortButton>
                        <SortButton
                            active={sortKey === 'price_per_kg'}
                            onClick={() => setSortKey('price_per_kg')}
                        >
                            €/kg
                        </SortButton>
                        <SortButton
                            active={sortKey === 'availability'}
                            onClick={() => setSortKey('availability')}
                        >
                            Stock
                        </SortButton>
                    </div>

                    {onRefresh && (
                        <button
                            onClick={onRefresh}
                            disabled={isRefreshing}
                            className="flex h-11 w-11 items-center justify-center rounded-2xl border border-masala-border bg-white text-masala-text/60 hover:text-masala-primary hover:border-masala-primary/30 transition-all shadow-sm disabled:opacity-50"
                            title="Refresh prices"
                        >
                            <RefreshCw className={`h-5 w-5 ${isRefreshing ? 'animate-spin' : ''}`} />
                        </button>
                    )}
                </div>
            </div>

            {/* Listing cards */}
            <div className="grid grid-cols-1 gap-6">
                {sorted.map((listing, index) => (
                    <ListingCard
                        key={listing.id}
                        listing={listing}
                        isLowest={lowestValidPrice !== null && listing.price === lowestValidPrice && index === 0}
                        rank={index + 1}
                        index={index}
                    />
                ))}
            </div>

            {lastUpdated && (
                <p className="text-center text-[10px] font-black uppercase tracking-widest text-masala-text/30">
                    Prices last updated: {lastUpdated}
                </p>
            )}
        </div>
    );
}

function SortButton({
    active,
    onClick,
    children,
    icon,
}: {
    active: boolean;
    onClick: () => void;
    children: React.ReactNode;
    icon?: React.ReactNode;
}) {
    return (
        <button
            onClick={onClick}
            className={`inline-flex items-center gap-1.5 px-3 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all duration-300 ${active
                ? 'bg-masala-primary text-white shadow-md shadow-masala-primary/20 scale-105'
                : 'text-masala-text/50 hover:text-masala-text hover:bg-masala-pill hover:scale-105'
                }`}
        >
            {icon}
            {children}
        </button>
    );
}

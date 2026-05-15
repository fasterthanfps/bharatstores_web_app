'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { ArrowRight, TrendingDown, Zap, BarChart3, Check } from 'lucide-react';
import { formatEUR } from '@/lib/utils/currency';
import { useComparison } from '@/context/ComparisonContext';
import type { ListingWithStore } from '@/types/api';

const HERO_PRODUCTS = [
    { label: 'Basmati Rice',  emoji: '🍚', query: 'basmati rice',  category: 'Staples' },
    { label: 'Amul Ghee',     emoji: '🧈', query: 'amul ghee',     category: 'Dairy'   },
    { label: 'MDH Masala',    emoji: '🌶️', query: 'mdh masala',    category: 'Spices'  },
    { label: 'Toor Dal',      emoji: '🫘', query: 'toor dal',       category: 'Pulses'  },
];

// Deterministic colored store initials badge
const PALETTE: [string, string][] = [
    ['#FFF3E0','#E65100'], ['#E8F5E9','#2E7D32'],
    ['#E3F2FD','#1565C0'], ['#F3E5F5','#6A1B9A'],
    ['#FFF8E1','#F57F17'], ['#E0F7FA','#00695C'],
    ['#FCE4EC','#880E4F'], ['#F1F8E9','#33691E'],
];

function storeColor(name: string): [string, string] {
    const idx = name.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % PALETTE.length;
    return PALETTE[idx];
}

function StoreInitial({ name }: { name: string }) {
    const initials = name.split(/\s+/).map(w => w[0]?.toUpperCase() ?? '').slice(0, 2).join('');
    const [bg, fg] = storeColor(name);
    return (
        <span
            className="w-5 h-5 rounded-md flex-shrink-0 inline-flex items-center justify-center text-[10px] font-black"
            style={{ backgroundColor: bg, color: fg }}
        >
            {initials}
        </span>
    );
}

interface ProductData { query: string; listings: ListingWithStore[]; loading: boolean }

function SkeletonCard() {
    return (
        <div className="rounded-2xl border border-masala-border bg-white/60 p-4 animate-pulse space-y-3">
            <div className="flex gap-3">
                <div className="w-14 h-14 rounded-2xl bg-masala-border/50 flex-shrink-0" />
                <div className="space-y-2 flex-1 pt-1">
                    <div className="h-4 w-28 rounded-lg bg-masala-border/60" />
                    <div className="h-3 w-16 rounded bg-masala-border/40" />
                    <div className="h-3 w-20 rounded bg-masala-border/30" />
                </div>
            </div>
            <div className="space-y-1.5">
                {[0,1,2].map(i => (
                    <div key={i} className="h-9 rounded-xl bg-masala-border/20" />
                ))}
            </div>
            <div className="h-8 rounded-xl bg-masala-border/15" />
        </div>
    );
}

function ProductCard({
    product,
    data,
    index,
}: {
    product: typeof HERO_PRODUCTS[0];
    data: ProductData;
    index: number;
}) {
    const { listings, loading } = data;
    const { addItem, removeItem, isInComparison } = useComparison();
    const inComparison = isInComparison(product.query);

    const handleCompare = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (inComparison) {
            removeItem(product.query);
        } else {
            addItem({ query: product.query, label: product.label, emoji: product.emoji, listings });
        }
    }, [inComparison, product, listings, addItem, removeItem]);

    if (loading) return <SkeletonCard />;

    // Group by store, cheapest in-stock per store
    const byStore = new Map<string, ListingWithStore>();
    for (const l of listings) {
        if (!l.store_name || l.availability === 'OUT_OF_STOCK' || l.price <= 0) continue;
        const key = l.store_name.toLowerCase();
        const cur = byStore.get(key);
        if (!cur || l.price < cur.price) byStore.set(key, l);
    }

    const storeEntries = Array.from(byStore.entries())
        .sort((a, b) => a[1].price - b[1].price)
        .slice(0, 3);

    const prices = storeEntries.map(([, l]) => l.price);
    const lowestPrice  = prices.length > 0 ? prices[0] : null;
    const highestPrice = prices.length > 0 ? prices[prices.length - 1] : null;
    const saving = (lowestPrice && highestPrice && highestPrice > lowestPrice)
        ? highestPrice - lowestPrice : 0;

    const featuredImg  = storeEntries[0]?.[1]?.image_url  ?? listings[0]?.image_url;
    const weightLabel  = storeEntries[0]?.[1]?.weight_label ?? listings[0]?.weight_label;

    const hasData = storeEntries.length > 0;

    return (
        <div
            className="group relative rounded-2xl border border-masala-border/50 bg-white/85 backdrop-blur-md overflow-hidden hover:border-masala-primary/30 hover:shadow-xl hover:shadow-masala-primary/8 transition-all duration-300 hover:-translate-y-0.5 flex flex-col"
            style={{ animationDelay: `${index * 0.08}s` }}
        >
            {/* Link covers the informational part */}
            <Link
                href={`/search?q=${encodeURIComponent(product.query)}`}
                className="block p-4 flex-1"
            >
                {/* Product header */}
                <div className="flex gap-3 mb-4">
                    <div className="relative w-14 h-14 flex-shrink-0 rounded-2xl bg-masala-pill overflow-hidden">
                        {featuredImg ? (
                            <img
                                src={featuredImg}
                                alt={product.label}
                                className="w-full h-full object-contain p-1.5 group-hover:scale-110 transition-transform duration-500"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-3xl select-none">
                                {product.emoji}
                            </div>
                        )}
                    </div>

                    <div className="flex-1 min-w-0 pt-0.5">
                        <div className="flex items-start justify-between gap-1">
                            <h3 className="text-sm font-black text-masala-text group-hover:text-masala-primary transition-colors leading-tight">
                                {product.label}
                            </h3>
                            <ArrowRight className="h-3.5 w-3.5 text-masala-text/20 group-hover:text-masala-primary group-hover:translate-x-0.5 transition-all duration-300 flex-shrink-0 mt-0.5" />
                        </div>

                        {/* Category + weight */}
                        <div className="flex items-center gap-1.5 mt-1">
                            <span className="text-[10px] font-bold text-masala-text/40 uppercase tracking-widest">
                                {product.category}
                            </span>
                            {weightLabel ? (
                                <span className="text-[10px] font-bold text-masala-primary/70 bg-masala-primary/6 px-1.5 py-0.5 rounded-md">
                                    {weightLabel}
                                </span>
                            ) : null}
                        </div>

                        {/* Price range */}
                        <div className="mt-1.5 h-4">
                            {lowestPrice !== null ? (
                                <p className="text-xs font-black text-emerald-600">
                                    {formatEUR(lowestPrice)}
                                    {saving > 0.01 ? (
                                        <span className="text-masala-text/30 font-medium text-[10px]">
                                            {' '}· save {formatEUR(saving)}
                                        </span>
                                    ) : null}
                                </p>
                            ) : null}
                        </div>
                    </div>
                </div>

                {/* Store rows */}
                <div className="space-y-1.5">
                    {hasData ? storeEntries.map(([storeKey, listing]) => {
                        const isBest = listing.price === lowestPrice;
                        return (
                            <div
                                key={storeKey}
                                className={`flex items-center justify-between px-3 py-2 rounded-xl border transition-colors duration-200 ${
                                    isBest
                                        ? 'bg-emerald-50/90 border-emerald-200/80 shadow-sm shadow-emerald-500/8'
                                        : 'bg-gray-50/60 border-gray-100'
                                }`}
                            >
                                <div className="flex items-center gap-2">
                                    <StoreInitial name={listing.store_name ?? ''} />
                                    <span className={`text-xs font-bold truncate max-w-[80px] ${isBest ? 'text-emerald-900' : 'text-masala-text/70'}`}>
                                        {listing.store_name}
                                    </span>
                                </div>
                                <div className="flex items-center gap-1.5 flex-shrink-0">
                                    {isBest ? (
                                        <div className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-emerald-100 border border-emerald-200/60">
                                            <TrendingDown className="h-2.5 w-2.5 text-emerald-600" />
                                            <span className="text-[9px] font-black text-emerald-700 uppercase tracking-wider">Best</span>
                                        </div>
                                    ) : null}
                                    <span className={`text-sm font-black tabular-nums ${isBest ? 'text-emerald-700' : 'text-masala-text'}`}>
                                        {formatEUR(listing.price)}
                                    </span>
                                </div>
                            </div>
                        );
                    }) : (
                        <div className="py-5 flex flex-col items-center gap-2 rounded-xl bg-masala-pill/30 border border-dashed border-masala-border/50">
                            <span className="text-2xl opacity-25 select-none">{product.emoji}</span>
                            <p className="text-[11px] font-bold text-masala-text/30 uppercase tracking-wider">
                                Loading prices…
                            </p>
                        </div>
                    )}
                </div>
            </Link>

            {/* Compare button — outside the link, stable DOM always renders both icons */}
            <div className="px-4 pb-4 pt-2 border-t border-masala-border/30 flex-shrink-0">
                <button
                    type="button"
                    onClick={handleCompare}
                    className={`
                        w-full flex items-center justify-center gap-1.5 py-2 rounded-xl
                        text-[11px] font-black uppercase tracking-wider
                        border transition-all duration-200 active:scale-95
                        ${inComparison
                            ? 'bg-masala-primary/8 border-masala-primary/30 text-masala-primary hover:bg-red-50 hover:border-red-200 hover:text-red-500'
                            : 'bg-transparent border-masala-border/40 text-masala-text/40 hover:border-masala-primary/40 hover:text-masala-primary hover:bg-masala-primary/5'
                        }
                    `}
                >
                    {/* Always rendered — toggled via hidden class to keep DOM shape stable */}
                    <BarChart3 className={`h-3 w-3 flex-shrink-0 ${inComparison ? 'hidden' : ''}`} aria-hidden />
                    <Check      className={`h-3 w-3 flex-shrink-0 ${inComparison ? '' : 'hidden'}`} aria-hidden />
                    <span>{inComparison ? 'Added — remove' : 'Add to compare'}</span>
                </button>
            </div>
        </div>
    );
}

export default function HeroProductGrid() {
    const [productData, setProductData] = useState<ProductData[]>(
        HERO_PRODUCTS.map(p => ({ query: p.query, listings: [], loading: true }))
    );

    useEffect(() => {
        HERO_PRODUCTS.forEach((product, index) => {
            fetch(`/api/search?q=${encodeURIComponent(product.query)}&sort=price`)
                .then(r => r.json())
                .then(json => {
                    setProductData(prev => {
                        const next = [...prev];
                        next[index] = {
                            query: product.query,
                            listings: json?.data?.listings ?? [],
                            loading: false,
                        };
                        return next;
                    });
                })
                .catch(() => {
                    setProductData(prev => {
                        const next = [...prev];
                        next[index] = { ...next[index], loading: false };
                        return next;
                    });
                });
        });
    }, []);

    const anyLoading = productData.some(d => d.loading);

    return (
        <div className="relative">
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-masala-primary/10 flex items-center justify-center">
                        <Zap className="h-3.5 w-3.5 text-masala-primary" />
                    </div>
                    <span className="text-xs font-black text-masala-text/60 uppercase tracking-[0.18em]">
                        Live Prices
                    </span>
                </div>

                {anyLoading ? (
                    <span className="text-[10px] font-bold text-masala-text/30 bg-masala-pill px-2.5 py-1 rounded-full animate-pulse">
                        Loading…
                    </span>
                ) : (
                    <span className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200/60 px-2.5 py-1 rounded-full">
                        <span className="relative flex h-1.5 w-1.5">
                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-60" />
                            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        </span>
                        Updated
                    </span>
                )}
            </div>

            {/* 2×2 grid */}
            <div className="grid grid-cols-2 gap-3">
                {HERO_PRODUCTS.map((product, i) => (
                    <ProductCard
                        key={product.query}
                        product={product}
                        data={productData[i]}
                        index={i}
                    />
                ))}
            </div>

            {/* Footer hint */}
            <div className="mt-4 flex items-center justify-between px-0.5">
                <Link
                    href="/search?q=basmati+rice"
                    className="inline-flex items-center gap-1.5 text-[11px] font-bold text-masala-primary/50 hover:text-masala-primary transition-colors group"
                >
                    Browse all products
                    <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
                </Link>
                <span className="text-[10px] text-masala-text/25 font-medium">
                    Select 2–3 to compare
                </span>
            </div>
        </div>
    );
}

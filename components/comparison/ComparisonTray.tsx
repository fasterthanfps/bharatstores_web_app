'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { X, ArrowRight, GitCompareArrows, Trash2, ExternalLink, TrendingDown, ChevronUp } from 'lucide-react';
import { formatEUR } from '@/lib/utils/currency';
import { useComparison } from '@/context/ComparisonContext';

/** Colored initials badge for store names */
function StoreBadge({ name, size = 'sm' }: { name: string; size?: 'sm' | 'md' | 'lg' }) {
    const initials = name
        .split(/\s+/)
        .map(w => w[0]?.toUpperCase())
        .slice(0, 2)
        .join('');

    // Deterministic color from store name
    const colors = [
        ['#FFF3E0', '#E65100'],
        ['#E8F5E9', '#2E7D32'],
        ['#E3F2FD', '#1565C0'],
        ['#F3E5F5', '#6A1B9A'],
        ['#FFF8E1', '#F57F17'],
        ['#E0F7FA', '#00695C'],
        ['#FCE4EC', '#880E4F'],
    ];
    const idx = name.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % colors.length;
    const [bg, text] = colors[idx];

    const sizeClass = size === 'lg' ? 'w-8 h-8 text-sm' : size === 'md' ? 'w-6 h-6 text-xs' : 'w-5 h-5 text-[10px]';

    return (
        <span
            className={`${sizeClass} rounded-lg font-black flex items-center justify-center flex-shrink-0`}
            style={{ backgroundColor: bg, color: text }}
        >
            {initials}
        </span>
    );
}

/** Full comparison modal overlay */
function ComparisonModal() {
    const { items, removeItem, clearItems, closeModal } = useComparison();
    const ref = useRef<HTMLDivElement>(null);

    // Close on Escape key
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.key === 'Escape') closeModal();
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [closeModal]);

    // All unique store names across all items
    const allStores = Array.from(
        new Set(
            items.flatMap(item =>
                item.listings
                    .filter(l => l.availability !== 'OUT_OF_STOCK' && l.price > 0)
                    .map(l => l.store_name ?? '')
                    .filter(Boolean)
            )
        )
    ).sort();

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4"
            style={{ backdropFilter: 'blur(12px)', backgroundColor: 'rgba(0,0,0,0.5)' }}
            onClick={e => { if (e.target === e.currentTarget) closeModal(); }}
        >
            <div
                ref={ref}
                className="relative w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-[2rem] bg-[#FDFBF7] shadow-2xl border border-white/60"
                style={{ animation: 'slideUp 0.35s cubic-bezier(0.16,1,0.3,1)' }}
            >
                {/* Header */}
                <div className="sticky top-0 z-10 flex items-center justify-between px-8 py-5 bg-[#FDFBF7]/90 backdrop-blur-md border-b border-masala-border/50">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-masala-primary/10 flex items-center justify-center">
                            <GitCompareArrows className="h-5 w-5 text-masala-primary" />
                        </div>
                        <div>
                            <h2 className="text-lg font-black text-masala-text">Price Comparison</h2>
                            <p className="text-xs text-masala-text/50 font-medium">{items.length} products · all Indian shops in Germany</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={clearItems}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-masala-text/50 hover:text-red-500 hover:bg-red-50 transition-all duration-200"
                        >
                            <Trash2 className="h-3.5 w-3.5" />
                            Clear all
                        </button>
                        <button
                            onClick={closeModal}
                            className="w-9 h-9 rounded-xl bg-masala-pill hover:bg-masala-border transition-colors flex items-center justify-center"
                        >
                            <X className="h-4 w-4 text-masala-text/70" />
                        </button>
                    </div>
                </div>

                <div className="p-6 sm:p-8">
                    {/* Product column headers */}
                    <div
                        className="grid gap-4 mb-8"
                        style={{ gridTemplateColumns: `180px repeat(${items.length}, 1fr)` }}
                    >
                        <div /> {/* spacer */}
                        {items.map(item => {
                            const allListings = item.listings.filter(l => l.availability !== 'OUT_OF_STOCK' && l.price > 0);
                            const lowestPrice = allListings.length > 0 ? Math.min(...allListings.map(l => l.price)) : null;
                            const featuredImg = allListings[0]?.image_url;

                            return (
                                <div key={item.query} className="relative text-center group">
                                    <button
                                        onClick={() => removeItem(item.query)}
                                        className="absolute -top-2 -right-2 w-6 h-6 bg-white border border-masala-border rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm hover:bg-red-50 hover:border-red-200 z-10"
                                    >
                                        <X className="h-3 w-3 text-masala-text/50" />
                                    </button>
                                    <div className="relative w-20 h-20 mx-auto mb-3 rounded-2xl bg-masala-pill overflow-hidden">
                                        {featuredImg ? (
                                            <img src={featuredImg} alt={item.label} className="w-full h-full object-contain p-2" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-4xl">{item.emoji}</div>
                                        )}
                                    </div>
                                    <p className="font-black text-masala-text text-sm leading-tight mb-1">{item.label}</p>
                                    {lowestPrice !== null && (
                                        <p className="text-xs text-emerald-600 font-bold">From {formatEUR(lowestPrice)}</p>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* Store-by-store price comparison table */}
                    <div className="space-y-2">
                        <div
                            className="grid gap-4 px-4 py-2"
                            style={{ gridTemplateColumns: `180px repeat(${items.length}, 1fr)` }}
                        >
                            <span className="text-[11px] font-black text-masala-text/40 uppercase tracking-widest">Store</span>
                            {items.map(item => (
                                <span key={item.query} className="text-[11px] font-black text-masala-text/40 uppercase tracking-widest text-center">
                                    Price
                                </span>
                            ))}
                        </div>

                        {allStores.map((storeName, rowIdx) => {
                            // Find each item's listing for this store
                            const rowListings = items.map(item => {
                                const listings = item.listings.filter(
                                    l => l.store_name?.toLowerCase() === storeName.toLowerCase()
                                        && l.availability !== 'OUT_OF_STOCK'
                                        && l.price > 0
                                );
                                listings.sort((a, b) => a.price - b.price);
                                return listings[0] ?? null;
                            });

                            const rowPrices = rowListings.map(l => l?.price).filter(Boolean) as number[];
                            const rowBest = rowPrices.length > 0 ? Math.min(...rowPrices) : null;

                            return (
                                <div
                                    key={storeName}
                                    className={`
                                        grid gap-4 items-center px-4 py-3.5 rounded-2xl border
                                        transition-all duration-200
                                        ${rowIdx % 2 === 0 ? 'bg-white border-masala-border/30' : 'bg-masala-pill/30 border-transparent'}
                                        hover:border-masala-primary/20 hover:shadow-sm
                                    `}
                                    style={{ gridTemplateColumns: `180px repeat(${items.length}, 1fr)` }}
                                >
                                    {/* Store name */}
                                    <div className="flex items-center gap-2.5">
                                        <StoreBadge name={storeName} size="md" />
                                        <span className="text-sm font-bold text-masala-text/80">{storeName}</span>
                                    </div>

                                    {/* Price per product */}
                                    {rowListings.map((listing, colIdx) => {
                                        const isBest = listing && rowBest !== null && listing.price === rowBest;
                                        return (
                                            <div key={colIdx} className="text-center">
                                                {listing ? (
                                                    <div className="flex flex-col items-center gap-1">
                                                        <div className="flex items-center gap-1.5 justify-center">
                                                            {isBest && (
                                                                <TrendingDown className="h-3 w-3 text-emerald-500" />
                                                            )}
                                                            <span className={`text-base font-black ${isBest ? 'text-emerald-700' : 'text-masala-text'}`}>
                                                                {formatEUR(listing.price)}
                                                            </span>
                                                        </div>
                                                        {listing.weight_label && (
                                                            <span className="text-[10px] text-masala-text/40 font-medium">
                                                                {listing.weight_label}
                                                            </span>
                                                        )}
                                                        <a
                                                            href={listing.product_url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            onClick={e => e.stopPropagation()}
                                                            className="inline-flex items-center gap-1 text-[10px] font-bold text-masala-primary/50 hover:text-masala-primary transition-colors"
                                                        >
                                                            Visit
                                                            <ExternalLink className="h-2.5 w-2.5" />
                                                        </a>
                                                    </div>
                                                ) : (
                                                    <span className="text-masala-text/20 text-lg font-black">–</span>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            );
                        })}
                    </div>

                    {/* Savings summary */}
                    {items.length > 1 && (
                        <div className="mt-8 p-5 rounded-2xl bg-emerald-50 border border-emerald-200/60">
                            <p className="text-sm font-black text-emerald-800 mb-3 flex items-center gap-2">
                                <TrendingDown className="h-4 w-4" />
                                Best deals at a glance
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                {items.map(item => {
                                    const validListings = item.listings
                                        .filter(l => l.availability !== 'OUT_OF_STOCK' && l.price > 0);
                                    if (validListings.length === 0) return null;
                                    const sorted = [...validListings].sort((a, b) => a.price - b.price);
                                    const best = sorted[0];
                                    const worst = sorted[sorted.length - 1];
                                    const saving = worst.price - best.price;

                                    return (
                                        <div key={item.query} className="bg-white rounded-xl p-3 border border-emerald-100">
                                            <p className="text-xs font-bold text-masala-text/60 mb-1">{item.label}</p>
                                            <p className="text-sm font-black text-emerald-700">
                                                Best: {formatEUR(best.price)}
                                                <span className="text-masala-text/40 font-medium"> @ {best.store_name}</span>
                                            </p>
                                            {saving > 0 && (
                                                <p className="text-[11px] text-emerald-500 font-bold mt-0.5">
                                                    Save {formatEUR(saving)} vs most expensive
                                                </p>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

/** Floating tray at the bottom of the screen */
export default function ComparisonTray() {
    const { items, removeItem, clearItems, isOpen, openModal, closeModal } = useComparison();

    if (items.length === 0) return null;

    return (
        <>
            {/* Floating Tray */}
            <div
                className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl border border-white/60 shadow-2xl shadow-black/20"
                style={{
                    background: 'rgba(28,20,10,0.92)',
                    backdropFilter: 'blur(20px)',
                    animation: 'slideUp 0.4s cubic-bezier(0.16,1,0.3,1)',
                }}
            >
                {/* Product thumbnails */}
                <div className="flex items-center gap-2">
                    {items.map((item, idx) => (
                        <div
                            key={item.query}
                            className="relative group"
                            style={{ animation: `slideUp 0.3s ${idx * 0.08}s both cubic-bezier(0.16,1,0.3,1)` }}
                        >
                            <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 overflow-hidden flex items-center justify-center">
                                {item.listings[0]?.image_url ? (
                                    <img src={item.listings[0].image_url} className="w-full h-full object-contain p-1" alt="" />
                                ) : (
                                    <span className="text-xl">{item.emoji}</span>
                                )}
                            </div>
                            <button
                                onClick={() => removeItem(item.query)}
                                className="absolute -top-1.5 -right-1.5 w-4.5 h-4.5 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <X className="h-2.5 w-2.5 text-white" />
                            </button>
                        </div>
                    ))}

                    {/* Empty slots */}
                    {Array.from({ length: 3 - items.length }).map((_, i) => (
                        <div
                            key={`empty-${i}`}
                            className="w-10 h-10 rounded-xl border-2 border-dashed border-white/20 flex items-center justify-center"
                        >
                            <span className="text-white/20 text-lg font-black">+</span>
                        </div>
                    ))}
                </div>

                <div className="w-px h-8 bg-white/10 mx-1" />

                {/* Text */}
                <div className="hidden sm:block">
                    <p className="text-white text-xs font-black leading-none">{items.length}/3 products</p>
                    <p className="text-white/40 text-[10px] font-medium leading-none mt-0.5">ready to compare</p>
                </div>

                {/* Compare button */}
                <button
                    onClick={openModal}
                    disabled={items.length < 2}
                    className="
                        flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-sm
                        bg-masala-primary text-white
                        hover:bg-masala-primary/90 active:scale-95
                        disabled:opacity-40 disabled:cursor-not-allowed
                        transition-all duration-200 shadow-lg shadow-masala-primary/40
                    "
                >
                    <GitCompareArrows className="h-4 w-4" />
                    Compare{items.length >= 2 ? ` (${items.length})` : ''}
                </button>

                {/* Clear */}
                <button
                    onClick={clearItems}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all duration-200"
                >
                    <X className="h-4 w-4" />
                </button>
            </div>

            {/* Comparison Modal */}
            {isOpen && <ComparisonModal />}
        </>
    );
}

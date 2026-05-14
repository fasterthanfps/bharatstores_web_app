'use client';

import Image from 'next/image';
import { Package, Clock, TrendingDown, Zap } from 'lucide-react';
import AvailabilityBadge from './AvailabilityBadge';
import PricePerKgBadge from './PricePerKgBadge';
import AffiliateBuyButton from './AffiliateBuyButton';
import { formatEUR } from '@/lib/utils/currency';
import type { ListingWithStore } from '@/types/api';

interface ListingCardProps {
    listing: ListingWithStore;
    isLowest: boolean;
    rank: number;
    index?: number;
}

export default function ListingCard({ listing, isLowest, rank, index = 0 }: ListingCardProps) {
    const savings =
        listing.compare_price && listing.compare_price > listing.price
            ? listing.compare_price - listing.price
            : null;

    const lastScraped = listing.last_scraped_at
        ? getRelativeTime(new Date(listing.last_scraped_at))
        : null;

    const isSoldOut = listing.availability === 'OUT_OF_STOCK';
    const isUpcoming = listing.availability === 'UPCOMING';
    const isUnavailable = isSoldOut || isUpcoming;
    const isInStock = listing.availability === 'IN_STOCK';

    return (
        <article
            className={`listing-card animate-card relative overflow-hidden rounded-[2rem] border flex flex-col sm:flex-row group
                ${isLowest && !isUnavailable
                    ? 'bg-gradient-to-br from-emerald-50/80 via-white to-white border-emerald-200 shadow-md shadow-emerald-100/50'
                    : 'bg-white border-masala-border shadow-sm'
                }
                ${isUnavailable ? 'opacity-55' : ''}
            `}
            style={{ animationDelay: `${Math.min(index * 60, 540)}ms` }}
        >
            {/* Left accent stripe */}
            <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-[2rem] transition-all duration-500 group-hover:w-1.5 ${
                isLowest && !isUnavailable
                    ? 'bg-gradient-to-b from-emerald-400 to-emerald-300'
                    : rank === 1
                        ? 'bg-gradient-to-b from-masala-primary to-masala-secondary'
                        : 'bg-masala-border group-hover:bg-masala-primary/40'
            }`} />

            {/* Card body */}
            <div className="flex flex-col sm:flex-row flex-1 gap-5 p-5 pl-6">

                {/* Left column: rank + image */}
                <div className="flex sm:flex-col items-center gap-4 sm:gap-3 flex-shrink-0">
                    {/* Rank badge */}
                    <span
                        className={`animate-rank flex h-7 w-7 items-center justify-center rounded-xl text-[10px] font-black tracking-wider transition-all duration-300 group-hover:scale-110 ${
                            rank === 1
                                ? 'bg-masala-primary text-white shadow-sm shadow-masala-primary/30'
                                : rank <= 3
                                    ? 'bg-masala-pill text-masala-primary border border-masala-border'
                                    : 'bg-masala-pill/60 text-masala-text/40 border border-masala-border'
                        }`}
                        style={{ animationDelay: `${Math.min(index * 60 + 80, 620)}ms` }}
                    >
                        {rank}
                    </span>

                    {/* Product image */}
                    <div className={`relative w-24 h-24 sm:w-20 sm:h-20 rounded-2xl overflow-hidden flex items-center justify-center p-2.5 transition-all duration-500 group-hover:shadow-md ${
                        isLowest && !isUnavailable
                            ? 'bg-emerald-50 border border-emerald-100'
                            : 'bg-masala-pill/60 border border-masala-border group-hover:border-masala-primary/20'
                    }`}>
                        {listing.image_url ? (
                            <Image
                                src={listing.image_url}
                                alt={listing.product_name ?? 'Product image'}
                                width={96}
                                height={96}
                                className={`object-contain w-full h-full transition-all duration-500 ${isUnavailable ? 'grayscale' : 'group-hover:scale-110'}`}
                                unoptimized
                            />
                        ) : (
                            <Package className="h-8 w-8 text-masala-text/15" />
                        )}
                    </div>
                </div>

                {/* Right column: content */}
                <div className="flex-1 min-w-0 flex flex-col justify-between gap-4">

                    {/* Top section: store name + product name + price */}
                    <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0 flex-1">
                            {/* Store + badges row */}
                            <div className="flex flex-wrap items-center gap-2 mb-1.5">
                                <span className="text-[9px] font-black text-masala-primary/80 uppercase tracking-[0.25em]">
                                    {listing.store_name}
                                </span>
                                {isLowest && !isUnavailable && (
                                    <span className="animate-float-badge inline-flex items-center gap-1 text-[9px] font-black bg-emerald-500 text-white rounded-full px-2 py-0.5 uppercase tracking-wider shadow-sm shadow-emerald-200">
                                        <TrendingDown className="h-2.5 w-2.5" />
                                        Best Price
                                    </span>
                                )}
                                {isInStock && !isLowest && rank <= 3 && (
                                    <span className="inline-flex items-center gap-1 text-[9px] font-black bg-masala-pill text-masala-primary border border-masala-border rounded-full px-2 py-0.5 uppercase tracking-wider">
                                        <Zap className="h-2.5 w-2.5" />
                                        In Stock
                                    </span>
                                )}
                            </div>

                            {/* Product name */}
                            <h3 className={`font-black font-serif text-lg sm:text-xl leading-snug transition-colors duration-300 ${
                                isUnavailable
                                    ? 'text-masala-text/35'
                                    : 'text-masala-text group-hover:text-masala-primary'
                            }`}>
                                {listing.product_name ?? 'Unknown Product'}
                            </h3>

                            {/* Weight */}
                            {listing.weight_label && (
                                <p className="text-[11px] text-masala-text/35 mt-1.5 flex items-center gap-1.5 font-semibold">
                                    <Package className="h-3 w-3 text-masala-primary/25" />
                                    {listing.weight_label}
                                </p>
                            )}
                        </div>

                        {/* Price block */}
                        <div className={`text-right flex-shrink-0 rounded-2xl px-4 py-3 min-w-[106px] transition-all duration-300 ${
                            isLowest && !isUnavailable
                                ? 'bg-emerald-500/10 border border-emerald-200'
                                : 'bg-masala-pill/60 border border-masala-border group-hover:border-masala-primary/15'
                        }`}>
                            <span
                                className={`animate-price-pop block text-2xl sm:text-3xl font-black font-serif tracking-tight ${
                                    isLowest && !isUnavailable ? 'text-emerald-600' : 'text-masala-text'
                                }`}
                                style={{ animationDelay: `${Math.min(index * 60 + 130, 670)}ms` }}
                            >
                                {listing.price > 0 ? formatEUR(listing.price) : '—'}
                            </span>
                            {savings && (
                                <div className="mt-0.5 flex flex-col items-end">
                                    <span className="text-[10px] text-masala-text/30 line-through font-bold">
                                        {formatEUR(listing.compare_price!)}
                                    </span>
                                    <span className="text-[10px] font-black text-emerald-600">
                                        −{formatEUR(savings)}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Divider */}
                    <div className="h-px bg-masala-border/40" />

                    {/* Bottom section: badges + buy button */}
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                        {/* Badges */}
                        <div className="flex items-center gap-2 flex-wrap">
                            <AvailabilityBadge availability={listing.availability} small />
                            <PricePerKgBadge pricePerKg={listing.price_per_kg} isLowest={isLowest && !isUnavailable} />
                            {lastScraped && (
                                <span className="inline-flex items-center gap-1.5 text-[9px] text-masala-text/35 font-bold uppercase tracking-widest bg-masala-pill/50 px-2.5 py-1.5 rounded-lg border border-masala-border/60">
                                    <Clock className="h-3 w-3" />
                                    {lastScraped}
                                </span>
                            )}
                        </div>

                        {/* Buy button */}
                        <AffiliateBuyButton
                            listingId={listing.id}
                            storeName={listing.store_name ?? ''}
                            size="md"
                            isDisabled={isUnavailable}
                            text={isUpcoming ? 'Coming Soon' : isSoldOut ? 'Sold Out' : undefined}
                        />
                    </div>
                </div>
            </div>
        </article>
    );
}

function getRelativeTime(date: Date): string {
    const diffMs = Date.now() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${Math.floor(diffHours / 24)}d ago`;
}

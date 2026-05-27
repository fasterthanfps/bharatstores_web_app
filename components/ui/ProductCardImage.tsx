'use client';

import { useState, useEffect } from 'react';
import { ShoppingCart, Plus, Check, ExternalLink, ChevronDown, ChevronUp, Zap } from 'lucide-react';
import { buildRedirectUrl } from '@/lib/utm';
import { getStoreConfig } from '@/lib/stores';
import type { GroupedListing } from '@/lib/search/engine';
import { getProductPlaceholder } from '@/lib/utils/image';

interface ProductCardImageProps {
    listing: GroupedListing;
    onCompareToggle?: () => void;
    isCompared?: boolean;
    isBestPrice?: boolean;
    searchQuery?: string;
    position?: number;
    storeSlug: string;
    store: ReturnType<typeof getStoreConfig>;
    hasOtherPrices: boolean;
    showOtherStores: boolean;
    setShowOtherStores: (show: boolean) => void;
}

export default function ProductCardImage({
    listing,
    onCompareToggle,
    isCompared,
    isBestPrice,
    searchQuery,
    position,
    storeSlug,
    store,
    hasOtherPrices,
    showOtherStores,
    setShowOtherStores,
}: ProductCardImageProps) {
    const bestPriceListing = listing.allPrices[0];
    const redirectUrl = buildRedirectUrl({
        productId: bestPriceListing.id,
        storeSlug,
        searchQuery,
        position,
    });

    const [imgSrc, setImgSrc] = useState(listing.image_url || getProductPlaceholder(listing.product_category, listing.product_name));

    useEffect(() => {
        setImgSrc(listing.image_url || getProductPlaceholder(listing.product_category, listing.product_name));
    }, [listing.image_url, listing.product_category, listing.product_name]);

    return (
        <div className="relative bg-gradient-to-b from-masala-muted/20 to-masala-muted/40 aspect-[4/3] flex items-center justify-center overflow-hidden">
            <img
                src={imgSrc}
                alt={listing.product_name}
                className="w-full h-full object-contain p-3 group-hover:scale-[1.04] transition-transform duration-400"
                loading="lazy"
                onError={() => {
                    const fallback = getProductPlaceholder(listing.product_category, listing.product_name);
                    if (imgSrc !== fallback) {
                        setImgSrc(fallback);
                    }
                }}
            />

            {/* Store badge — bottom left */}
            <div className="absolute bottom-2 left-2 flex items-center gap-1 flex-wrap">
                <span
                    className="px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wide shadow-sm"
                    style={{ background: store.color, color: store.textColor }}
                >
                    {store.label}
                </span>
                {hasOtherPrices && (
                    <span className="px-2 py-0.5 rounded-md bg-white/90 text-[9px] font-black text-masala-text border border-masala-border shadow-sm">
                        +{listing.allPrices.length - 1}
                    </span>
                )}
            </div>

            {/* Best deal badge — top right */}
            {isBestPrice && (
                <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-emerald-500 text-white shadow-md flex items-center gap-1">
                    <Zap className="h-2.5 w-2.5" />
                    Best
                </span>
            )}

            {/* Other stores compare toggle */}
            {hasOtherPrices && (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        setShowOtherStores(!showOtherStores);
                    }}
                    className="absolute bottom-2 right-2 w-8 h-8 rounded-full border border-masala-border/50 bg-white/90 backdrop-blur-sm flex items-center justify-center text-masala-text hover:bg-masala-muted/50 transition-colors"
                >
                    {showOtherStores ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                </button>
            )}
        </div>
    );
}
'use client';

import { useState } from 'react';
import { ShoppingCart, Plus, Check, ExternalLink, ChevronDown, ChevronUp, Zap, GitCompare } from 'lucide-react';
import { buildRedirectUrl } from '@/lib/utm';
import { getStoreConfig } from '@/lib/stores';
import { useSmartCart } from '@/stores/useSmartCart';
import type { GroupedListing } from '@/lib/search/engine';

interface ProductCardProps {
  listing: GroupedListing;
  onCompareToggle?: () => void;
  isCompared?: boolean;
  isBestPrice?: boolean;
  searchQuery?: string;
  position?: number;
}

export default function ProductCard({
  listing, onCompareToggle, isCompared, isBestPrice, searchQuery, position,
}: ProductCardProps) {
  const [showOtherStores, setShowOtherStores] = useState(false);
  const { addItem, removeItem, items } = useSmartCart();

  const bestPriceListing = listing.allPrices[0];
  const store = getStoreConfig(bestPriceListing.store_name ?? '');
  const storeSlug = bestPriceListing.store_name?.toLowerCase().replace(/\s+/g, '') ?? '';

  const redirectUrl = buildRedirectUrl({
    productId: bestPriceListing.id,
    storeSlug,
    searchQuery,
    position,
  });

  const isInCart = items.some((i) => i.productId === listing.id && i.storeSlug === storeSlug);
  const hasOtherPrices = listing.allPrices.length > 1;
  const isInStock = bestPriceListing.availability !== 'OUT_OF_STOCK';
  const otherPrices = listing.allPrices.slice(1, 4);

  return (
    <div className={`bg-white rounded-2xl overflow-hidden border transition-all duration-200 flex flex-col group ${
      isBestPrice ? 'border-emerald-200 shadow-md shadow-emerald-50' : 'border-masala-border hover:border-masala-primary/40 hover:shadow-md'
    }`}>

      {/* ── Image Block ───────────────────────────────── */}
      <div className="relative bg-gradient-to-b from-masala-muted/20 to-masala-muted/40 aspect-[4/3] flex items-center justify-center overflow-hidden">
        {listing.image_url ? (
          <img
            src={listing.image_url}
            alt={listing.product_name}
            className="w-full h-full object-contain p-3 group-hover:scale-[1.04] transition-transform duration-400"
            loading="lazy"
          />
        ) : (
          <span className="text-4xl select-none">🛒</span>
        )}

        {/* Compare Toggle — top left */}
        <button
          onClick={(e) => {
            e.preventDefault();
            onCompareToggle?.();
          }}
          className={`absolute top-2.5 left-2.5 w-8.5 h-8.5 rounded-full border transition-all duration-300 flex items-center justify-center shadow-sm hover:shadow-md z-10 ${
            isCompared 
              ? 'bg-gradient-to-br from-indigo-500 to-indigo-600 border-indigo-500 text-white scale-110 shadow-lg shadow-indigo-500/20' 
              : 'bg-white/95 backdrop-blur-sm border-indigo-100 text-indigo-500 hover:text-indigo-600 hover:border-indigo-300 hover:scale-105'
          }`}
          title={isCompared ? 'Remove from comparison' : 'Add to compare'}
        >
          {isCompared ? <Check className="h-4 w-4 stroke-[3]" /> : <GitCompare className="h-4 w-4" />}
        </button>

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
      </div>

      {/* ── Info Block ───────────────────────────────── */}
      <div className="p-3 flex flex-col gap-2 flex-1">

        {/* Product name */}
        <h3 className="text-[13px] font-bold text-masala-text leading-snug line-clamp-2">
          {listing.product_name}
        </h3>

        {/* Category + weight */}
        <p className="text-[11px] text-masala-text-muted capitalize">
          {listing.product_category}
          {bestPriceListing.weight_label && <> · {bestPriceListing.weight_label}</>}
        </p>

        {/* Price row */}
        <div className="flex items-end justify-between mt-auto">
          <div>
            <span className="text-[9px] text-masala-text-muted uppercase font-bold tracking-wider block mb-0.5">Best Price</span>
            <span className="text-[22px] font-black text-masala-primary leading-none" style={{ fontFamily: 'Fraunces, serif' }}>
              €{listing.bestPrice.toFixed(2)}
            </span>
            {bestPriceListing.price_per_kg && (
              <span className="text-[10px] text-masala-text-muted block">
                €{bestPriceListing.price_per_kg.toFixed(2)}/kg
              </span>
            )}
          </div>

          {/* Stock status */}
          <div className={`flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full ${
            isInStock ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${isInStock ? 'bg-emerald-500' : 'bg-red-400'}`} />
            {isInStock ? 'In Stock' : 'Out'}
          </div>
        </div>

        {/* Action row */}
        <div className="flex items-center gap-1.5 pt-1">
          <a
            href={redirectUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 h-[38px] sm:h-[42px] bg-masala-primary hover:bg-masala-secondary text-white text-[11px] sm:text-[12px] font-black rounded-xl flex items-center justify-center gap-1 sm:gap-1.5 active:scale-95 transition-all shadow-sm shadow-masala-primary/10 group/btn"
          >
            <span>Buy Now</span>
            <ExternalLink className="h-3 w-3 sm:h-3.5 sm:w-3.5 flex-shrink-0 opacity-70 group-hover/btn:opacity-100 transition-opacity" />
          </a>

          <button
            onClick={() => {
              if (isInCart) {
                removeItem(listing.id, storeSlug);
              } else {
                addItem({
                  productId: listing.id,
                  productName: listing.product_name,
                  imageUrl: listing.image_url ?? '',
                  storeSlug,
                  storeName: store.label,
                  price: listing.bestPrice,
                  weight: bestPriceListing.weight_label ?? '',
                  url: bestPriceListing.product_url,
                  storeHandle: bestPriceListing.store_handle,
                  variantId: bestPriceListing.variant_id,
                });
              }
            }}
            className={`h-[38px] w-[38px] sm:h-[42px] sm:w-[42px] rounded-xl border transition-all duration-300 flex-shrink-0 flex items-center justify-center active:scale-90 ${
              isInCart
                ? 'bg-gradient-to-br from-emerald-500 to-teal-600 border-emerald-500 text-white shadow-md shadow-emerald-500/20 scale-105'
                : 'bg-white border-emerald-100 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 hover:scale-105'
            }`}
            aria-label={isInCart ? 'Remove from cart' : 'Add to cart'}
          >
            {isInCart ? <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4 stroke-[3]" /> : <ShoppingCart className="h-3.5 w-3.5 sm:h-4 sm:w-4" />}
          </button>
        </div>

        {/* Compare other stores (expandable) */}
        {hasOtherPrices && (
          <div className="border-t border-masala-border/60 pt-2 mt-1">
            <button
              onClick={() => setShowOtherStores(!showOtherStores)}
              className="w-full flex items-center justify-between text-[11px] font-bold text-masala-text-muted hover:text-masala-primary transition-colors py-0.5"
            >
              <span>Compare {listing.allPrices.length - 1} more {listing.allPrices.length - 1 === 1 ? 'store' : 'stores'}</span>
              {showOtherStores ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </button>

            {showOtherStores && (
              <div className="mt-2 space-y-1 animate-fade-in">
                {otherPrices.map((p) => {
                  const s = getStoreConfig(p.store_name);
                  const pUrl = buildRedirectUrl({ productId: p.id, storeSlug: p.store_name.toLowerCase().replace(/\s+/g, '') });
                  const pInStock = p.availability !== 'OUT_OF_STOCK';
                  return (
                    <a
                      key={p.id}
                      href={pUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between py-1.5 px-2 rounded-xl hover:bg-masala-muted/50 transition-colors group/row"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className="w-5 h-5 rounded-md text-[8px] font-black flex items-center justify-center flex-shrink-0"
                          style={{ background: s.color, color: s.textColor }}
                        >
                          {s.initials}
                        </span>
                        <span className="text-[12px] text-masala-text">{s.label}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {!pInStock && (
                          <span className="text-[9px] text-red-400 font-bold">Out</span>
                        )}
                        <span className="text-[12px] font-bold text-masala-text">€{p.price.toFixed(2)}</span>
                        <ExternalLink className="h-3 w-3 text-masala-text-light opacity-0 group-hover/row:opacity-100 transition-opacity" />
                      </div>
                    </a>
                  );
                })}
                {listing.allPrices.length > 4 && (
                  <p className="text-[10px] text-masala-text-muted text-center pt-1">
                    + {listing.allPrices.length - 4} more stores
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

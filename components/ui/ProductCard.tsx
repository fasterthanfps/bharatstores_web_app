'use client';

import { useState, useMemo, useEffect } from 'react';
import { useSmartCart } from '@/stores/useSmartCart';
import { getStoreConfig } from '@/lib/stores';
import { buildRedirectUrl } from '@/lib/utm';
import { Heart, Plus, Minus } from 'lucide-react';
import ProductModal from './ProductModal';
import type { GroupedListing } from '@/lib/search/engine';
import { useRouter } from 'next/navigation';
import { getProductPlaceholder } from '@/lib/utils/image';

interface ProductCardProps {
  listing: GroupedListing;
  rank?: number;
  searchQuery?: string;
  isCompared?: boolean;
  onCompareToggle?: () => void;
  isBestPrice?: boolean;
  position?: number;
}

export default function ProductCard({ listing, rank, searchQuery, isCompared, onCompareToggle, isBestPrice, position }: ProductCardProps) {
  const router = useRouter();
  const [modalOpen,    setModalOpen]    = useState(false);
  const candidateImages = useMemo(() => {
    const urls = new Set<string>();
    if (listing.image_url) urls.add(listing.image_url);
    if (listing.allPrices) {
      listing.allPrices.forEach(p => {
        if (p.image_url) urls.add(p.image_url);
      });
    }
    const fallback = getProductPlaceholder(listing.product_category, listing.product_name);
    return [...Array.from(urls), fallback];
  }, [listing.image_url, listing.allPrices, listing.product_category, listing.product_name]);

  const [imageIndex, setImageIndex] = useState(0);

  useEffect(() => {
    setImageIndex(0);
  }, [candidateImages]);

  const currentImgSrc = candidateImages[imageIndex];
  const [wishlisted,   setWishlisted]   = useState(false);

  const { addItem, removeItem, items, updateQuantity } = useSmartCart();

  const bestStorePrice = useMemo(() => listing.allPrices?.[0] || {
    id: listing.id,
    store_name: listing.bestStore || '',
    price: listing.bestPrice,
    availability: 'UNKNOWN',
    product_url: '',
    image_url: listing.image_url,
    weight_label: null,
    price_per_kg: null,
  }, [listing.allPrices, listing.id, listing.bestStore, listing.bestPrice, listing.image_url]);

  const storeSlug = useMemo(() => bestStorePrice.store_name.toLowerCase().replace(/\s+/g, ''), [bestStorePrice.store_name]);
  const storeConfig = useMemo(() => getStoreConfig(bestStorePrice.store_name), [bestStorePrice.store_name]);

  const cartItem  = useMemo(() => items.find(i => i.productId === listing.id && i.storeSlug === storeSlug), [items, listing.id, storeSlug]);
  const inCart    = !!cartItem;

  // Original vs current price for savings display
  const currentPrice  = listing.bestPrice;
  const originalPrice = listing.originalPrice ?? null;

  // Show badge ONLY when:
  // 1. originalPrice exists in DB (scraped from compare_at_price)
  // 2. originalPrice is genuinely > currentPrice by at least 2%
  // 3. Discount is under 80% (sanity guard against bad scraper data)
  const discount = originalPrice != null && originalPrice > 0
    ? (originalPrice - currentPrice) / originalPrice
    : null;

  const savingsPct = (
    discount !== null &&
    discount >= 0.02 &&
    discount < 0.80
  ) ? Math.round(discount * 100) : null;

  // Freshness
  const minutesAgo = (bestStorePrice as any).last_updated
    ? Math.floor((Date.now() - new Date((bestStorePrice as any).last_updated).getTime()) / 60000)
    : null;
  const isLive = minutesAgo !== null && minutesAgo < 60;

  const inStockStores = useMemo(() => listing.allPrices?.filter(s => s.availability !== 'OUT_OF_STOCK') || [], [listing.allPrices]);

  return (
    <>
      <div
        className="group relative bg-white rounded-[24px] p-2.5 sm:p-3 cursor-pointer border border-masala-border/40
          transition-all duration-300 hover:-translate-y-1 active:scale-[0.98] hover:shadow-[0_8px_24px_rgba(139,32,32,0.06)] hover:border-masala-primary/20 flex flex-col justify-between h-full"
        style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}
        onClick={() => setModalOpen(true)}
      >
        <div>
          {/* ── IMAGE ZONE ── */}
          <div className="relative w-full aspect-square bg-[#F6F1EA]/60 rounded-[18px] overflow-hidden mb-2.5">
            <img
              src={currentImgSrc}
              alt={listing.product_name}
              className="absolute inset-0 w-full h-full object-contain p-3
                group-hover:scale-105 transition-transform duration-300"
              onError={() => {
                if (imageIndex < candidateImages.length - 1) {
                  setImageIndex(prev => prev + 1);
                }
              }}
              loading="lazy"
            />

            {/* Wishlist heart — top right */}
            <button
              onClick={e => { e.stopPropagation(); setWishlisted(v => !v); }}
              className="absolute top-2 right-2 w-7.5 h-7.5 rounded-full bg-white/80 backdrop-blur-sm
                flex items-center justify-center shadow-sm hover:bg-white transition-colors z-10"
            >
              <Heart className={`w-3.5 h-3.5 transition-colors ${wishlisted ? 'fill-masala-primary text-masala-primary' : 'text-masala-text-muted'}`} />
            </button>

            {/* Rank badge — top left (only for top 3) */}
            {rank && rank <= 3 && (
              <div className={`absolute top-2 left-2 w-6.5 h-6.5 rounded-full flex items-center
                justify-center text-[10px] font-black text-white shadow-sm z-10 ${
                rank === 1 ? 'bg-masala-primary' :
                rank === 2 ? 'bg-masala-primary/80' :
                'bg-masala-primary/60'
              }`}>
                {rank}
              </div>
            )}

            {/* BEST PRICE badge */}
            {inStockStores.length > 1 && isBestPrice && (
              <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded-full bg-[#0C6E3D]
                text-white text-[8px] font-black uppercase tracking-wide shadow-sm z-10 leading-none">
                Best Price
              </div>
            )}

            {/* Price savings badge (e.g. 11% OFF) — top left overlay */}
            {savingsPct !== null && (
              <div className="absolute top-2 left-2 z-10 px-2 py-0.5 rounded-full
                bg-[#0C6E3D] text-white text-[10px] font-black shadow-sm leading-tight">
                {savingsPct}% OFF
              </div>
            )}
          </div>

          {/* ── CONTENT ZONE ── */}
          <div className="px-1 space-y-1.5">
            {/* Store & Weight Row */}
            <div className="flex items-center justify-between flex-wrap gap-1">
              <span
                className="px-1.5 py-0.5 rounded-md text-[8px] font-black tracking-wide"
                style={{ background: storeConfig.color, color: storeConfig.textColor }}
              >
                {storeConfig.label.toUpperCase()}
              </span>
              <span className="text-[10px] font-bold text-masala-text-muted bg-masala-muted/30 px-1.5 py-0.5 rounded-md leading-none">
                {bestStorePrice.weight_label || '1 pc'}
              </span>
            </div>

            {/* Product name — clamped to exactly 2 lines for card uniformity in a grid */}
            <p className="text-[12px] sm:text-[13px] font-bold text-masala-text leading-snug line-clamp-2 min-h-[34px] sm:min-h-[36px]" title={listing.product_name}>
              {listing.product_name}
            </p>

            {/* Price row */}
            <div className="flex items-baseline gap-1.5 flex-wrap">
              <span
                className="text-[18px] sm:text-[20px] font-black text-masala-text leading-none"
                style={{ fontFamily: 'Fraunces, serif' }}
              >
                €{currentPrice.toFixed(2)}
              </span>
              {savingsPct !== null && originalPrice !== null && (
                <span className="text-[12px] text-masala-text-muted line-through">
                  €{originalPrice.toFixed(2)}
                </span>
              )}
            </div>

            {/* Per kg */}
            {bestStorePrice.price_per_kg && bestStorePrice.price_per_kg !== currentPrice ? (
              <p className="text-[9px] text-masala-text-muted font-medium leading-none">
                €{bestStorePrice.price_per_kg.toFixed(2)}/kg
              </p>
            ) : (
              <div className="h-[9px]" /> /* spacing placeholder to align grids */
            )}

            {/* More stores info & live status */}
            <div className="flex items-center gap-1.5 text-[9px] text-masala-text-muted py-0.5">
              {inStockStores.length > 1 && (
                <span>+{inStockStores.length - 1} more stores</span>
              )}
              {isLive && (
                <span className="flex items-center gap-0.5 text-green-600 font-bold ml-auto">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                  Live
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ── SEPARATE ACTIONS ROW AT ABSOLUTE BOTTOM ── */}
        <div className="mt-2.5 pt-2 border-t border-masala-border/20 flex items-center justify-between gap-1.5 w-full">
          {/* Buy Now button */}
          <div onClick={e => e.stopPropagation()} className="flex-1">
            <a
              href={buildRedirectUrl({
                productId: bestStorePrice.id || listing.id,
                storeSlug: storeSlug,
                searchQuery: searchQuery,
                position: rank ?? position,
              })}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center w-full py-2 rounded-xl
                bg-masala-primary text-white text-[11px] font-black shadow-md
                hover:bg-masala-secondary hover:shadow-masala-primary/10 hover:scale-[1.02] active:scale-95 transition-all duration-200"
            >
              Buy Now
            </a>
          </div>

          {/* Add to Smart Cart / Quantity controls */}
          <div onClick={e => e.stopPropagation()} className="flex-shrink-0">
            {!inCart ? (
              <button
                onClick={() => addItem({
                  productId: listing.id,
                  productName: listing.product_name,
                  imageUrl: listing.image_url ?? '',
                  storeSlug: storeSlug,
                  storeName: storeConfig.label,
                  price: currentPrice,
                  weight: bestStorePrice.weight_label ?? '',
                  url: bestStorePrice.product_url,
                  storeHandle: bestStorePrice.store_handle,
                  variantId: bestStorePrice.variant_id,
                })}
                className="flex items-center justify-center w-8 h-8 rounded-xl
                  bg-emerald-600 hover:bg-emerald-700 text-white shadow-md active:scale-90 transition-all duration-200"
                title="Add to Smart Cart"
              >
                <Plus className="w-3.5 h-3.5 stroke-[3]" />
              </button>
            ) : (
              <div className="flex items-center bg-emerald-600 text-white rounded-xl overflow-hidden shadow-md h-8">
                <button
                  onClick={() => updateQuantity(listing.id, storeSlug, (cartItem?.quantity ?? 1) - 1)}
                  className="w-6.5 h-full flex items-center justify-center hover:bg-emerald-700 transition-colors"
                >
                  <Minus className="w-3 h-3 stroke-[3]" />
                </button>
                <span className="text-[10px] font-black min-w-[14px] text-center px-0.5 select-none">
                  {cartItem?.quantity}
                </span>
                <button
                  onClick={() => updateQuantity(listing.id, storeSlug, (cartItem?.quantity ?? 0) + 1)}
                  className="w-6.5 h-full flex items-center justify-center hover:bg-emerald-700 transition-colors"
                >
                  <Plus className="w-3 h-3 stroke-[3]" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal */}
      {modalOpen && (
        <ProductModal
          productId={listing.id}
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          isCompared={isCompared}
          onCompareToggle={onCompareToggle}
          searchQuery={searchQuery}
          position={rank ?? position}
        />
      )}
    </>
  );
}

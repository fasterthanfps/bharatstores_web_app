'use client';

import { useState, useMemo } from 'react';
import { useSmartCart } from '@/stores/useSmartCart';
import { getStoreConfig } from '@/lib/stores';
import { buildRedirectUrl } from '@/lib/utm';
import { Heart, Plus, Minus } from 'lucide-react';
import ProductModal from './ProductModal';
import type { GroupedListing } from '@/lib/search/engine';
import { useRouter } from 'next/navigation';

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
  const [imgError,     setImgError]     = useState(false);
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
  const originalPrice = listing.originalPrice ?? (currentPrice * 1.12); // fallback +12%
  const hasSavings    = originalPrice > currentPrice * 1.01;
  const savingsPct    = hasSavings ? Math.round(((originalPrice - currentPrice) / originalPrice) * 100) : 0;

  // Freshness
  const minutesAgo = (bestStorePrice as any).last_updated
    ? Math.floor((Date.now() - new Date((bestStorePrice as any).last_updated).getTime()) / 60000)
    : null;
  const isLive = minutesAgo !== null && minutesAgo < 60;

  const inStockStores = useMemo(() => listing.allPrices?.filter(s => s.availability !== 'OUT_OF_STOCK') || [], [listing.allPrices]);

  return (
    <>
      <div
        className="group relative bg-white rounded-[24px] p-2 cursor-pointer border border-masala-border/40
          transition-all duration-300 hover:-translate-y-1 active:scale-[0.98] hover:shadow-[0_8px_24px_rgba(139,32,32,0.06)] hover:border-masala-primary/20 space-y-3"
        style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}
        onClick={() => setModalOpen(true)}
      >

        {/* ══ IMAGE ZONE ══ */}
        <div className="relative w-full aspect-square bg-[#F6F1EA]/60 rounded-[18px] overflow-hidden">

          {/* Product image — fills the zone */}
          {!imgError && listing.image_url ? (
            <img
              src={listing.image_url}
              alt={listing.product_name}
              className="absolute inset-0 w-full h-full object-contain p-3
                group-hover:scale-105 transition-transform duration-300"
              onError={() => setImgError(true)}
              loading="lazy"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-5xl">🛒</div>
          )}

          {/* Wishlist heart — top right */}
          <button
            onClick={e => { e.stopPropagation(); setWishlisted(v => !v); }}
            className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-white/80 backdrop-blur-sm
              flex items-center justify-center shadow-sm hover:bg-white transition-colors z-10"
          >
            <Heart className={`w-4 h-4 transition-colors ${wishlisted ? 'fill-masala-primary text-masala-primary' : 'text-masala-text-muted'}`} />
          </button>

          {/* Rank badge — top left (only for top 3) */}
          {rank && rank <= 3 && (
            <div className={`absolute top-2.5 left-2.5 w-7 h-7 rounded-full flex items-center
              justify-center text-[11px] font-black text-white shadow-sm z-10 ${
              rank === 1 ? 'bg-masala-primary' :
              rank === 2 ? 'bg-masala-primary/80' :
              'bg-masala-primary/60'
            }`}>
              {rank}
            </div>
          )}

          {/* BEST PRICE badge — shown if this is the best across stores */}
          {inStockStores.length > 1 && isBestPrice && (
            <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-full bg-[#0C6E3D]
              text-white text-[9px] font-black uppercase tracking-wide shadow-sm z-10">
              Best Price
            </div>
          )}

          {/* ── OVERLAY ROW: Weight (left) + ADD button (right) ── */}
          <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between p-2 z-10">

            {/* Weight pill — dark, like Blinkit */}
            <div className="px-2.5 py-1 rounded-lg bg-[#1C1410]/75 backdrop-blur-sm">
              <p className="text-white text-[11px] font-black leading-none truncate max-w-[60px]">{bestStorePrice.weight_label || '1 pc'}</p>
            </div>

            {/* ADD / quantity control */}
            <div onClick={e => e.stopPropagation()}>
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
                  className="flex items-center justify-center gap-1 px-3 py-2 rounded-xl
                    bg-masala-primary text-white text-xs font-black shadow-lg
                    hover:bg-masala-secondary active:scale-95 transition-all add-btn-tap"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>ADD</span>
                </button>
              ) : (
                <div className="flex items-center gap-1 bg-masala-primary rounded-xl overflow-hidden shadow-lg">
                  <button
                    onClick={() => updateQuantity(listing.id, storeSlug, (cartItem?.quantity ?? 1) - 1)}
                    className="w-8 h-8 flex items-center justify-center text-white hover:bg-masala-secondary transition-colors"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-white text-sm font-black min-w-[20px] text-center">
                    {cartItem?.quantity}
                  </span>
                  <button
                    onClick={() => updateQuantity(listing.id, storeSlug, (cartItem?.quantity ?? 0) + 1)}
                    className="w-8 h-8 flex items-center justify-center text-white hover:bg-masala-secondary transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ══ CONTENT ZONE — bottom of card ══ */}
        <div className="px-2 pt-1 pb-2 space-y-1.5">

          {/* Price row — MOST PROMINENT */}
          <div className="flex items-baseline gap-1.5 flex-wrap">
            <span
              className="text-[22px] font-black text-masala-text leading-none"
              style={{ fontFamily: 'Fraunces, serif' }}
            >
              €{currentPrice.toFixed(2)}
            </span>
            {hasSavings && (
              <span className="text-[13px] text-masala-text-muted line-through leading-none">
                €{originalPrice.toFixed(2)}
              </span>
            )}
            {savingsPct > 0 && (
              <span className="text-[10px] font-black text-[#0C6E3D] bg-green-50 px-1.5 py-0.5 rounded-md leading-none">
                {savingsPct}% OFF
              </span>
            )}
          </div>

          {/* Per kg */}
          {bestStorePrice.price_per_kg && bestStorePrice.price_per_kg !== currentPrice && (
            <p className="text-[10px] text-masala-text-muted font-medium leading-none">
              €{bestStorePrice.price_per_kg.toFixed(2)}/kg
            </p>
          )}

          {/* Product name — full, NOT truncated, 3 lines max */}
          <p className="text-[13px] font-semibold text-masala-text leading-snug line-clamp-3">
            {listing.product_name}
          </p>

          {/* Store badge row */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span
              className="px-2 py-0.5 rounded-md text-[9px] font-black"
              style={{ background: storeConfig.color, color: storeConfig.textColor }}
            >
              {storeConfig.label.toUpperCase()}
            </span>
            {inStockStores.length > 1 && (
              <span className="text-[10px] text-masala-text-muted">
                +{inStockStores.length - 1} more
              </span>
            )}
            {/* Live dot */}
            {isLive && (
              <span className="flex items-center gap-1 text-[10px] text-green-600 font-bold ml-auto">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                Live
              </span>
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

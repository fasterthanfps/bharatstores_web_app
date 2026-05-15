'use client';

import { Clock, ShoppingCart, Plus, Check } from 'lucide-react';
import { buildRedirectUrl } from '@/lib/utm';
import { getStoreConfig } from '@/lib/stores';

interface ListingShape {
  id: string;
  product_name: string;
  store_name: string;
  price: number;
  price_per_kg?: number;
  availability: string;
  product_url: string;
  image_url?: string;
  weight_label?: string;
  last_scraped_at: string;
  product_category?: string;
  _score?: number;
  rank?: number;
}

interface ProductCardProps {
  listing: ListingShape;
  onCompareToggle?: () => void;
  isCompared?: boolean;
  isBestPrice?: boolean;
  searchQuery?: string;
  position?: number;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const h = Math.floor(diff / 3_600_000);
  const m = Math.floor(diff / 60_000);
  if (h >= 24) return `${Math.floor(h / 24)}d ago`;
  if (h >= 1)  return `${h}h ago`;
  return `${m}m ago`;
}

export default function ProductCard({
  listing, onCompareToggle, isCompared, isBestPrice, searchQuery, position,
}: ProductCardProps) {
  const inStock = listing.availability === 'IN_STOCK' || listing.availability === 'UNKNOWN';
  const store   = getStoreConfig(listing.store_name ?? '');

  // FIX 4: only show price/kg when the product is sold by weight and value is distinct
  const showPricePerKg =
    listing.price_per_kg &&
    listing.price_per_kg !== listing.price &&
    (listing.weight_label?.toLowerCase().includes('kg') ||
      listing.weight_label?.toLowerCase().includes('g'));

  // Build tracked redirect URL (FIX from Prompt B)
  const redirectUrl = buildRedirectUrl({
    productId:   listing.id,
    storeSlug:   listing.store_name?.toLowerCase().replace(/\s+/g, '') ?? '',
    searchQuery,
    position,
  });

  return (
    <div className="listing-card bg-white rounded-2xl overflow-hidden border border-masala-border hover:shadow-lg transition-all duration-300 flex flex-col group">

      {/* ── Image area ─────────────────────────────────────────────────── */}
      <div className="relative aspect-square bg-masala-muted flex items-center justify-center p-4 overflow-hidden">
        {listing.image_url ? (
          <img
            src={listing.image_url}
            alt={listing.product_name}
            className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
            onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
        ) : (
          <span className="text-5xl group-hover:scale-110 transition-transform duration-300">🛒</span>
        )}

        {/* FIX 2: Store + status badges aligned in a single row */}
        <div className="absolute top-2 left-2 right-2 flex items-center justify-between z-10">
          {/* Store pill */}
          <span
            className="px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest shadow-sm border"
            style={{
              background: store.color,
              color: store.textColor,
              borderColor: store.textColor + '30',
            }}
          >
            {store.initials}
          </span>

          {/* Status pill */}
          {isBestPrice ? (
            <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-emerald-100 text-emerald-700">
              Best Price
            </span>
          ) : inStock ? (
            <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-blue-50 text-blue-700">
              In Stock
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-gray-100 text-gray-500">
              Out of Stock
            </span>
          )}
        </div>

        {/* Rank badge */}
        {listing.rank && listing.rank <= 3 && (
          <div className="absolute bottom-2 left-2 w-6 h-6 rounded-full bg-masala-primary text-white text-[11px] font-black flex items-center justify-center">
            {listing.rank}
          </div>
        )}
      </div>

      {/* ── Info area ───────────────────────────────────────────────────── */}
      <div className="p-3 flex flex-col gap-1.5 flex-1">
        {/* Product name */}
        <p className="text-[13px] font-semibold text-masala-text leading-tight line-clamp-2 min-h-[2.5rem]">
          {listing.product_name}
        </p>

        {/* Weight */}
        {listing.weight_label && (
          <p className="text-[11px] text-masala-text-muted">{listing.weight_label}</p>
        )}

        {/* Price row */}
        <div className="flex items-baseline gap-2 mt-auto">
          <span
            className="text-[22px] font-bold text-masala-primary leading-none"
            style={{ fontFamily: 'Fraunces, serif' }}
          >
            €{(listing.price ?? 0).toFixed(2)}
          </span>
          {/* FIX 4: conditional price/kg */}
          {showPricePerKg && (
            <span className="text-[11px] text-masala-text-muted">
              €{listing.price_per_kg!.toFixed(2)}/kg
            </span>
          )}
        </div>

        {/* Freshness + stock */}
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 text-[11px] text-masala-text-light">
            <Clock className="h-3 w-3" />
            {timeAgo(listing.last_scraped_at)}
          </span>
          <span className={`flex items-center gap-1 text-[11px] font-medium ${inStock ? 'text-emerald-600' : 'text-masala-text-light'}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${inStock ? 'bg-emerald-500' : 'bg-gray-300'}`} />
            {inStock ? 'Available' : 'Unavailable'}
          </span>
        </div>

        {/* Buy Now — tracked redirect */}
        <a
          href={redirectUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full h-9 mt-1 bg-masala-primary text-white text-[12px] font-bold rounded-xl flex items-center justify-center gap-1.5 hover:bg-masala-secondary active:scale-[0.97] transition-all"
          onClick={() => {
            // Optimistic local tracking
            if (typeof window !== 'undefined') {
              try {
                const recent = JSON.parse(localStorage.getItem('bs-clicked') ?? '[]');
                localStorage.setItem('bs-clicked', JSON.stringify(
                  [{ id: listing.id, store: listing.store_name, ts: Date.now() }, ...recent].slice(0, 20)
                ));
              } catch { /* ignore */ }
            }
          }}
        >
          <ShoppingCart className="h-3.5 w-3.5" />
          Buy Now
        </a>

        {/* FIX 3: Prominent Add to Compare button */}
        {onCompareToggle && (
          <button
            onClick={onCompareToggle}
            className={`w-full h-9 rounded-xl border-2 text-[12px] font-bold flex items-center justify-center gap-1.5 transition-all active:scale-[0.97] ${
              isCompared
                ? 'border-masala-primary text-masala-primary bg-masala-primary/5'
                : 'border-masala-border text-masala-text hover:border-masala-primary hover:text-masala-primary'
            }`}
          >
            {isCompared ? (
              <><Check className="h-3.5 w-3.5" /> Added to Compare</>
            ) : (
              <><Plus className="h-3.5 w-3.5" /> Add to Compare</>
            )}
          </button>
        )}
      </div>
    </div>
  );
}

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

  const showPricePerKg =
    listing.price_per_kg &&
    listing.price_per_kg !== listing.price &&
    (listing.weight_label?.toLowerCase().includes('kg') ||
      listing.weight_label?.toLowerCase().includes('g'));

  const redirectUrl = buildRedirectUrl({
    productId:   listing.id,
    storeSlug:   listing.store_name?.toLowerCase().replace(/\s+/g, '') ?? '',
    searchQuery,
    position,
  });

  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-masala-border hover:shadow-md transition-all duration-300 flex flex-col group">
      {/* Image area */}
      <div className="relative aspect-square bg-masala-muted/30 flex items-center justify-center p-3 sm:p-4 overflow-hidden">
        {listing.image_url ? (
          <img
            src={listing.image_url}
            alt={listing.product_name}
            className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
            onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
        ) : (
          <span className="text-4xl sm:text-5xl group-hover:scale-110 transition-transform duration-500">🛒</span>
        )}

        <div className="absolute top-2 left-2 right-2 flex items-center justify-between z-10">
          <span
            className="px-1.5 py-0.5 rounded text-[8px] sm:text-[9px] font-black uppercase tracking-widest shadow-sm border"
            style={{ background: store.color, color: store.textColor, borderColor: store.textColor + '30' }}
          >
            {store.initials}
          </span>

          {isBestPrice ? (
            <span className="px-1.5 py-0.5 rounded-full text-[8px] sm:text-[9px] font-black uppercase bg-emerald-100 text-emerald-700 shadow-sm">
              Best Price
            </span>
          ) : inStock ? (
            <span className="px-1.5 py-0.5 rounded-full text-[8px] sm:text-[9px] font-black uppercase bg-blue-50 text-blue-700">
              In Stock
            </span>
          ) : (
            <span className="px-1.5 py-0.5 rounded-full text-[8px] sm:text-[9px] font-black uppercase bg-gray-100 text-gray-500">
              Out of Stock
            </span>
          )}
        </div>

        {listing.rank && listing.rank <= 3 && (
          <div className="absolute bottom-2 left-2 w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-masala-primary text-white text-[10px] sm:text-[11px] font-black flex items-center justify-center shadow-lg">
            {listing.rank}
          </div>
        )}
      </div>

      {/* Info area */}
      <div className="p-2.5 sm:p-3 flex flex-col gap-1 sm:gap-1.5 flex-1">
        <p className="text-[12px] sm:text-[13px] font-bold text-masala-text leading-tight line-clamp-2 min-h-[2.4rem] sm:min-h-[2.5rem]">
          {listing.product_name}
        </p>

        {listing.weight_label && (
          <p className="text-[10px] sm:text-[11px] text-masala-text-muted font-medium">{listing.weight_label}</p>
        )}

        <div className="flex items-baseline gap-1.5 mt-auto">
          <span className="text-[20px] sm:text-[22px] font-black text-masala-primary leading-none" style={{ fontFamily: 'Fraunces, serif' }}>
            €{(listing.price ?? 0).toFixed(2)}
          </span>
          {showPricePerKg && (
            <span className="text-[10px] sm:text-[11px] text-masala-text-muted">
              €{listing.price_per_kg!.toFixed(2)}/kg
            </span>
          )}
        </div>

        <div className="flex items-center gap-2.5 mb-1">
          <span className="flex items-center gap-1 text-[10px] text-masala-text-light">
            <Clock className="h-2.5 w-2.5" />
            {timeAgo(listing.last_scraped_at)}
          </span>
          <span className={`flex items-center gap-1 text-[10px] font-bold ${inStock ? 'text-emerald-600' : 'text-masala-text-light'}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${inStock ? 'bg-emerald-500' : 'bg-gray-300'}`} />
            {inStock ? 'Live' : 'Out'}
          </span>
        </div>

        <div className="space-y-1.5">
          <a
            href={redirectUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full h-8 sm:h-9 bg-masala-primary text-white text-[11px] sm:text-[12px] font-black rounded-lg sm:rounded-xl flex items-center justify-center gap-1.5 hover:bg-masala-secondary active:scale-[0.96] transition-all shadow-sm"
          >
            <ShoppingCart className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
            BUY NOW
          </a>

          {onCompareToggle && (
            <button
              onClick={onCompareToggle}
              className={`w-full h-8 sm:h-9 rounded-lg sm:rounded-xl border-2 text-[11px] sm:text-[12px] font-black flex items-center justify-center gap-1.5 transition-all active:scale-[0.96] ${
                isCompared
                  ? 'border-masala-primary text-masala-primary bg-masala-primary/5'
                  : 'border-masala-border text-masala-text hover:border-masala-primary hover:text-masala-primary'
              }`}
            >
              {isCompared ? (
                <><Check className="h-3 w-3 sm:h-3.5 sm:w-3.5" /> ADDED</>
              ) : (
                <><Plus className="h-3 w-3 sm:h-3.5 sm:w-3.5" /> COMPARE</>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

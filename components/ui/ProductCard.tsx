'use client';

import { useState, useMemo } from 'react';
import { useSmartCart } from '@/stores/useSmartCart';
import type { GroupedListing } from '@/lib/search/engine';
import ProductCardImage from './ProductCardImage';
import ProductCardInfo from './ProductCardInfo';
import ProductModal from './ProductModal';
import { buildRedirectUrl } from '@/lib/utm';
import { getStoreConfig } from '@/lib/stores';
import { ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';

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
  const [modalOpen, setModalOpen] = useState(false);
  const { addItem, removeItem, items } = useSmartCart();

  // Memoize expensive calculations with fallbacks for undefined or empty allPrices
  const bestPriceListing = useMemo(() => listing.allPrices?.[0] || {
    id: listing.id,
    store_name: listing.bestStore || '',
    price: listing.bestPrice,
    availability: 'UNKNOWN',
    product_url: '',
    image_url: listing.image_url,
    weight_label: null,
    price_per_kg: null,
  }, [listing.allPrices, listing.id, listing.bestStore, listing.bestPrice, listing.image_url]);

  const store = useMemo(() => getStoreConfig(bestPriceListing.store_name ?? ''), [bestPriceListing.store_name]);
  const storeSlug = useMemo(() => bestPriceListing.store_name?.toLowerCase().replace(/\s+/g, '') ?? '', [bestPriceListing.store_name]);

  const redirectUrl = useMemo(() => buildRedirectUrl({
    productId: bestPriceListing.id,
    storeSlug,
    searchQuery,
    position,
  }), [bestPriceListing.id, storeSlug, searchQuery, position]);

  const isInCart = useMemo(() => items.some((i) => i.productId === listing.id && i.storeSlug === storeSlug), [items, listing.id, storeSlug]);
  const hasOtherPrices = useMemo(() => (listing.allPrices?.length ?? 0) > 1, [listing.allPrices?.length]);
  const isInStock = useMemo(() => bestPriceListing.availability !== 'OUT_OF_STOCK', [bestPriceListing.availability]);
  const otherPrices = useMemo(() => listing.allPrices?.slice(1, 4) ?? [], [listing.allPrices]);

  return (
    <>
      <div 
        onClick={() => setModalOpen(true)}
        className={`cursor-pointer bg-white rounded-2xl overflow-hidden border transition-all duration-200 flex flex-col group ${isBestPrice ? 'border-emerald-200 shadow-md shadow-emerald-50' : 'border-masala-border hover:border-masala-primary/40 hover:shadow-md'
        }`}
      >
        <ProductCardImage
          listing={listing}
          onCompareToggle={onCompareToggle}
          isCompared={isCompared}
          isBestPrice={isBestPrice}
          searchQuery={searchQuery}
          position={position}
          storeSlug={storeSlug}
          store={store}
          hasOtherPrices={hasOtherPrices}
          showOtherStores={showOtherStores}
          setShowOtherStores={setShowOtherStores}
        />

        <ProductCardInfo
          listing={listing}
          isInCart={isInCart}
          isInStock={isInStock}
          storeSlug={storeSlug}
          storeLabel={store.label}
          bestPrice={listing.bestPrice}
          pricePerKg={bestPriceListing.price_per_kg}
          productName={listing.product_name}
          productCategory={listing.product_category}
          weightLabel={bestPriceListing.weight_label}
          productUrl={bestPriceListing.product_url}
          imageUrl={listing.image_url}
          onAddToCart={() => {
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
          }}
          onRemoveFromCart={() => {
            removeItem(listing.id, storeSlug);
          }}
        />

        {/* Compare other stores (expandable) */}
        {hasOtherPrices && (
          <div className="border-t border-masala-border/60 pt-2 mt-1" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setShowOtherStores(!showOtherStores)}
              className="w-full flex items-center justify-between text-[11px] font-bold text-masala-text-muted hover:text-masala-primary transition-colors py-0.5"
            >
              <span>Compare {(listing.allPrices?.length ?? 0) - 1} more {(listing.allPrices?.length ?? 0) - 1 === 1 ? 'store' : 'stores'}</span>
              {showOtherStores ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </button>

            {showOtherStores && (
              <div className="mt-2 space-y-1 animate-fade-in">
                {otherPrices.map((p) => {
                  const s = getStoreConfig(p.store_name);
                  const pSlug = p.store_name.toLowerCase().replace(/\s+/g, '');
                  const pUrl = buildRedirectUrl({ productId: p.id, storeSlug: pSlug, searchQuery, position });
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
                {(listing.allPrices?.length ?? 0) > 4 && (
                  <p className="text-[10px] text-masala-text-muted text-center pt-1">
                    + {(listing.allPrices?.length ?? 0) - 4} more stores
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {modalOpen && (
        <ProductModal
          productId={listing.id}
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          isCompared={isCompared}
          onCompareToggle={onCompareToggle}
          searchQuery={searchQuery}
          position={position}
        />
      )}
    </>
  );
}

'use client';

import { useState, useEffect, useMemo } from 'react';
import PriceChart from './PriceChart';
import { getStoreConfig } from '@/lib/stores';
import { getDeliveryInfo } from '@/lib/storeDelivery';
import { buildRedirectUrl } from '@/lib/utm';
import { useSmartCart } from '@/stores/useSmartCart';
import { 
  X, 
  ShoppingCart, 
  Check, 
  ExternalLink, 
  TrendingDown, 
  Truck, 
  Info,
  Sparkles,
  AlertTriangle
} from 'lucide-react';

interface ProductModalProps {
  productId: string;
  isOpen: boolean;
  onClose: () => void;
  isCompared?: boolean;
  onCompareToggle?: () => void;
  searchQuery?: string;
  position?: number;
}

export default function ProductModal({
  productId: initialProductId,
  isOpen,
  onClose,
  isCompared,
  onCompareToggle,
  searchQuery,
  position,
}: ProductModalProps) {
  const [productId, setProductId] = useState(initialProductId);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeStore, setActiveStore] = useState<string>('');

  const { addItem, removeItem, items } = useSmartCart();

  // Keep state in sync with prop if it changes from outside
  useEffect(() => {
    if (initialProductId) {
      setProductId(initialProductId);
    }
  }, [initialProductId]);

  // Load product detail and price history
  useEffect(() => {
    if (!isOpen || !productId) return;

    setLoading(true);
    setError(null);
    fetch(`/api/products/${productId}`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load product details');
        return res.json();
      })
      .then((resData) => {
        setData(resData);
        // Default to cheapest in-stock offer; fallback to cheapest.
        if (resData?.product?.prices?.length > 0) {
          const sorted = [...resData.product.prices].sort((a: any, b: any) => Number(a.price) - Number(b.price));
          const bestInStock = sorted.find((p: any) => p.inStock);
          setActiveStore((bestInStock || sorted[0]).storeSlug);
        }
      })
      .catch((err) => {
        console.error('Error fetching modal details:', err);
        setError(err.message || 'Something went wrong');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [isOpen, productId]);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Prevent scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const product = data?.product;
  const history = data?.history || [];
  const alternatives = data?.alternatives || [];

  // Active store's listing/price details
  const activeListing = useMemo(() => {
    if (!product?.prices) return null;
    return product.prices.find((p: any) => p.storeSlug === activeStore);
  }, [product, activeStore]);

  const storeConfig = useMemo(() => {
    if (!activeStore) return null;
    return getStoreConfig(activeStore);
  }, [activeStore]);

  const deliveryInfo = useMemo(() => {
    if (!activeStore) return null;
    return getDeliveryInfo(activeStore);
  }, [activeStore]);

  const sortedPrices = useMemo(() => {
    if (!product?.prices) return [];
    return [...product.prices].sort((a: any, b: any) => Number(a.price) - Number(b.price));
  }, [product]);

  // Filter history for the active store
  const activeStoreHistory = useMemo(() => {
    return history
      .filter((h: any) => h.storeSlug === activeStore)
      .map((h: any) => ({
        date: h.recordedAt,
        price: h.price,
        storeSlug: h.storeSlug,
      }));
  }, [history, activeStore]);

  // Check if active store item is already in smart cart
  const isSelectedInCart = useMemo(() => {
    return items.some((i) => i.productId === productId && i.storeSlug === activeStore);
  }, [items, productId, activeStore]);

  // Compute analytics specifically for active store history
  const storeAnalytics = useMemo(() => {
    if (activeStoreHistory.length === 0) return null;
    const prices = activeStoreHistory.map((h: any) => h.price);
    const avg = prices.reduce((a: number, b: number) => a + b, 0) / prices.length;
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const current = activeListing?.price ?? 0;

    return {
      allTimeHigh: max,
      allTimeLow: min,
      avg30d: avg,
      // Good time to buy if current price is lower than average by 3% or more
      isBuyNow: current > 0 && current < avg * 0.97,
      percentDifference: avg > 0 ? ((avg - current) / avg) * 100 : 0,
    };
  }, [activeStoreHistory, activeListing]);

  // Create deep link redirect URL
  const redirectUrl = useMemo(() => {
    if (!activeListing) return '';
    return buildRedirectUrl({
      productId,
      storeSlug: activeStore,
      searchQuery,
      position,
    });
  }, [productId, activeStore, activeListing, searchQuery, position]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-start sm:items-center justify-center p-4 sm:p-6 md:p-10">
      {/* Backdrop */}
      <div 
        onClick={onClose}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300 animate-fade-in"
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-5xl bg-[#FAF7F2] rounded-[2rem] border border-[#E8E0D4] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.3)] flex flex-col z-10 animate-scale-in duration-200 my-auto">
        
        {/* Header Section */}
        <div className="p-6 pb-4 border-b border-masala-border/60 flex items-start justify-between bg-white/50 backdrop-blur-sm sticky top-0 rounded-t-[2rem] z-20">
          <div className="flex-1 min-w-0 pr-4">
            <span className="text-[10px] font-black uppercase tracking-widest text-masala-primary/80 bg-masala-primary/5 px-2.5 py-1 rounded-full">
              Product Analysis
            </span>
            <h2 
              className="text-xl sm:text-2xl font-black text-masala-text mt-2.5 leading-snug line-clamp-2"
              style={{ fontFamily: 'Fraunces, serif' }}
            >
              {loading ? 'Loading Product details...' : product?.name}
            </h2>
            {!loading && product?.brand && (
              <p className="text-xs font-bold text-masala-text-muted mt-1">
                Brand: <span className="text-masala-text">{product.brand}</span>
              </p>
            )}
          </div>
          <button 
            onClick={onClose}
            className="w-10 h-10 rounded-full border border-masala-border/60 bg-white flex items-center justify-center text-masala-text hover:border-masala-primary hover:text-masala-primary transition-all active:scale-90 flex-shrink-0"
            aria-label="Close details"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Section */}
        <div className="p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="w-12 h-12 rounded-full border-4 border-masala-primary border-t-transparent animate-spin" />
              <p className="text-sm font-bold text-masala-text-muted">Fetching latest prices & analytics...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center text-red-500">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <h3 className="text-base font-black text-masala-text">Failed to load analysis</h3>
              <p className="text-sm text-masala-text-muted max-w-sm">{error}</p>
              <button 
                onClick={onClose}
                className="mt-2 px-5 py-2 rounded-xl bg-masala-primary text-white text-xs font-bold hover:bg-masala-secondary transition-all"
              >
                Go Back
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* Left Column: Image, Store Selection & Actions (5 cols) */}
              <div className="lg:col-span-5 space-y-6">
                
                {/* Image */}
                <div className="relative bg-white rounded-3xl border border-masala-border/80 min-h-[210px] flex items-center justify-center p-4 shadow-sm overflow-hidden group">
                  {product?.imageUrl ? (
                    <img 
                      src={product.imageUrl} 
                      alt={product.name} 
                      className="max-w-full max-h-full object-contain group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <span className="text-6xl">🛒</span>
                  )}
                  {product?.category && (
                    <span className="absolute bottom-3 left-3 bg-masala-bg/90 backdrop-blur-sm border border-masala-border text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md text-masala-text">
                      {product.category}
                    </span>
                  )}
                </div>

                {/* Store Tabs selector */}
                <div className="space-y-2.5">
                  <p className="text-[10px] font-black uppercase tracking-widest text-masala-text-muted">
                    Automatic Similar Product Compare
                  </p>
                  <div className="grid grid-cols-1 gap-2">
                    {sortedPrices.slice(0, 6).map((p: any) => {
                      const isActive = p.storeSlug === activeStore;
                      const s = getStoreConfig(p.storeSlug);
                      return (
                        <button
                          key={p.storeSlug}
                          onClick={() => setActiveStore(p.storeSlug)}
                          className={`w-full flex items-center justify-between p-3 rounded-2xl border transition-all duration-200 ${
                            isActive
                              ? 'bg-white border-masala-primary shadow-sm scale-[1.02]'
                              : 'bg-white/50 border-masala-border/60 hover:bg-white hover:border-masala-border'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span 
                              className="w-7 h-7 rounded-xl text-[10px] font-black flex items-center justify-center"
                              style={{ background: s.color, color: s.textColor }}
                            >
                              {s.initials}
                            </span>
                            <div className="text-left">
                              <span className="text-xs font-bold text-masala-text block leading-none">
                                {s.label}
                              </span>
                              {!p.isExactMatch && (
                                <span className="text-[9px] text-amber-700 font-black uppercase tracking-wide mt-0.5 block">
                                  Similar Match
                                </span>
                              )}
                              {!p.inStock && (
                                <span className="text-[9px] text-red-500 font-black uppercase tracking-wide mt-0.5 block">
                                  Out of Stock
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-sm font-black text-masala-primary block leading-none" style={{ fontFamily: 'Fraunces, serif' }}>
                              €{p.price.toFixed(2)}
                            </span>
                            {p.pricePerKg && (
                              <span className="text-[9px] text-masala-text-muted mt-0.5 block">
                                €{p.pricePerKg.toFixed(2)}/kg
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

              </div>

              {/* Right Column: Pricing Analysis & Deep-link Checkout (7 cols) */}
              <div className="lg:col-span-7 space-y-6">
                
                {/* Store Analytics Overview */}
                {activeListing && (
                  <div className="bg-white rounded-3xl border border-masala-border p-5 space-y-4 shadow-sm">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[9px] font-black uppercase tracking-widest text-masala-text-muted block">
                          Selected Store Best Offer
                        </span>
                        <div className="flex items-baseline gap-2 mt-1">
                          <span className="text-3xl font-black text-masala-primary" style={{ fontFamily: 'Fraunces, serif' }}>
                            €{activeListing.price.toFixed(2)}
                          </span>
                          {activeListing.pricePerKg && (
                            <span className="text-xs text-masala-text-muted">
                              (€{activeListing.pricePerKg.toFixed(2)}/kg)
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Recommend Buy Badge */}
                      {storeAnalytics?.isBuyNow && (
                        <div className="bg-emerald-50 text-emerald-700 px-3.5 py-1.5 rounded-2xl border border-emerald-100 flex items-center gap-1.5 text-xs font-black shadow-sm animate-pulse">
                          <TrendingDown className="h-4 w-4" />
                          <span>🔥 Best Time to Buy!</span>
                        </div>
                      )}
                    </div>

                    {/* Quick Analytics Cards */}
                    {storeAnalytics && (
                      <div className="grid grid-cols-3 gap-2.5 pt-2 border-t border-masala-border/60">
                        <div className="bg-masala-bg/40 p-2.5 rounded-2xl text-center border border-masala-border/40">
                          <span className="text-[9px] font-bold text-masala-text-muted uppercase block mb-1">
                            30d Avg Price
                          </span>
                          <span className="text-sm font-black text-masala-text">
                            €{storeAnalytics.avg30d.toFixed(2)}
                          </span>
                        </div>
                        <div className="bg-emerald-50/20 p-2.5 rounded-2xl text-center border border-emerald-100/30">
                          <span className="text-[9px] font-bold text-emerald-600/80 uppercase block mb-1">
                            All-Time Low
                          </span>
                          <span className="text-sm font-black text-emerald-600">
                            €{storeAnalytics.allTimeLow.toFixed(2)}
                          </span>
                        </div>
                        <div className="bg-red-50/20 p-2.5 rounded-2xl text-center border border-red-100/30">
                          <span className="text-[9px] font-bold text-red-500/80 uppercase block mb-1">
                            All-Time High
                          </span>
                          <span className="text-sm font-black text-red-500">
                            €{storeAnalytics.allTimeHigh.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Savings Insights */}
                    {storeAnalytics && storeAnalytics.percentDifference > 0 && (
                      <p className="text-[11px] font-bold text-emerald-600 bg-emerald-50/30 px-3 py-2 rounded-xl flex items-center gap-2 border border-emerald-100/20">
                        <Sparkles className="h-3.5 w-3.5" />
                        Save {storeAnalytics.percentDifference.toFixed(1)}% compared to the 30-day average price for this store!
                      </p>
                    )}
                  </div>
                )}

                {/* Pure SVG Sparkline Price History Chart */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-black uppercase tracking-widest text-masala-text-muted">
                      30-Day Price Trend ({storeConfig?.label})
                    </p>
                    <span className="text-[10px] font-bold text-masala-text-muted flex items-center gap-1 bg-white px-2 py-0.5 rounded-md border border-masala-border/60">
                      <Info className="h-3 w-3" /> Real-time pricing
                    </span>
                  </div>

                  <div className="h-[170px]">
                    <PriceChart
                      history={activeStoreHistory}
                      currentPrice={activeListing?.price ?? 0}
                      allTimeLow={storeAnalytics?.allTimeLow ?? (activeListing?.price ?? 0)}
                      allTimeHigh={storeAnalytics?.allTimeHigh ?? (activeListing?.price ?? 0)}
                    />
                  </div>
                </div>

                {/* Delivery & Shipping Info */}
                {deliveryInfo && (
                  <div className="bg-white rounded-3xl border border-masala-border p-3 flex items-center gap-3 shadow-sm">
                    <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 border border-indigo-100 flex-shrink-0">
                      <Truck className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-black uppercase tracking-widest text-masala-text-muted leading-none mb-1">
                        Shipping & Delivery
                      </p>
                      <p className="text-xs text-masala-text font-bold leading-normal">
                        {deliveryInfo.deliveryNote}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[9px] font-black text-masala-text-muted uppercase leading-none mb-1">Delivery Time</p>
                      <p className="text-xs font-black text-masala-text">{deliveryInfo.deliveryDays} days</p>
                    </div>
                  </div>
                )}

                {/* Action Buttons Row */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 pt-4">
                  {/* Buy Now (Direct link to active store) */}
                  <a
                    href={redirectUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 h-12 rounded-2xl bg-masala-primary hover:bg-masala-secondary text-white text-xs font-black flex items-center justify-center gap-2 shadow-lg shadow-masala-primary/20 active:scale-[0.98] transition-all"
                  >
                    <span>Buy on {storeConfig?.label}</span>
                    <ExternalLink className="h-4 w-4" />
                  </a>

                  {/* Add/Remove Smart Cart */}
                  <button
                    onClick={() => {
                      if (!activeListing) return;
                      if (isSelectedInCart) {
                        removeItem(productId, activeStore);
                      } else {
                        addItem({
                          productId,
                          productName: product.name,
                          imageUrl: product.imageUrl ?? '',
                          storeSlug: activeStore,
                          storeName: storeConfig?.label ?? '',
                          price: activeListing.price,
                          weight: activeListing.weightLabel ?? '',
                          url: activeListing.url,
                          storeHandle: activeListing.storeHandle,
                          variantId: activeListing.variantId,
                        });
                      }
                    }}
                    className={`h-12 px-6 rounded-2xl border transition-all duration-200 active:scale-95 flex items-center justify-center gap-2 text-xs font-bold ${
                      isSelectedInCart
                        ? 'bg-gradient-to-br from-emerald-500 to-teal-600 border-emerald-500 text-white shadow-md shadow-emerald-500/20'
                        : 'bg-white border-masala-border text-emerald-600 hover:bg-emerald-50 hover:border-emerald-300'
                    }`}
                  >
                    {isSelectedInCart ? (
                      <>
                        <Check className="h-4.5 w-4.5 stroke-[3]" />
                        <span>In Smart Cart</span>
                      </>
                    ) : (
                      <>
                        <ShoppingCart className="h-4.5 w-4.5" />
                        <span>Add to Smart Cart</span>
                      </>
                    )}
                  </button>
                </div>

              </div>

            </div>
          )}

          {/* Alternative Brands Comparison Section */}
          {!loading && !error && alternatives.length > 0 && (
            <div className="mt-8 pt-6 border-t border-masala-border/60 space-y-4">
              <div>
                <h3 className="text-base font-black text-masala-text flex items-center gap-2" style={{ fontFamily: 'Fraunces, serif' }}>
                  <Sparkles className="h-5 w-5 text-masala-primary" />
                  Compare Alternative Brands
                </h3>
                <p className="text-[11px] text-masala-text-muted">
                  Automatically comparing similar {product?.category?.toLowerCase() || 'product'} options from other top brands
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {alternatives.map((alt: any) => (
                  <div 
                    key={alt.id || alt.name} 
                    className="bg-white rounded-2xl border border-masala-border/80 p-4 flex flex-col justify-between hover:border-masala-primary/50 transition-all duration-300 shadow-sm"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-xs font-black text-masala-text line-clamp-2 min-h-[2rem]">
                          {alt.name}
                        </h4>
                        <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-masala-primary/5 text-masala-primary">
                          {alt.brand}
                        </span>
                      </div>
                      {alt.weightLabel && (
                        <span className="text-[10px] text-masala-text-muted block mt-1">
                          Pack: {alt.weightLabel}
                        </span>
                      )}
                    </div>

                    <div className="mt-4 pt-3 border-t border-masala-border/40 flex items-end justify-between">
                      <div>
                        <span className="text-[9px] text-masala-text-muted uppercase font-bold tracking-wider block leading-none mb-1">
                          Best Price
                        </span>
                        <span className="text-lg font-black text-masala-primary" style={{ fontFamily: 'Fraunces, serif' }}>
                          €{alt.bestPrice.toFixed(2)}
                        </span>
                        {alt.bestPricePerKg && (
                          <span className="text-[9px] text-masala-text-muted block mt-0.5">
                            €{alt.bestPricePerKg.toFixed(2)}/kg
                          </span>
                        )}
                      </div>

                      {/* Quick Store Indicator */}
                      <div className="text-right">
                        <span className="text-[8px] text-masala-text-muted uppercase font-bold block leading-none mb-1">
                          Stores
                        </span>
                        <div className="flex -space-x-1.5 justify-end">
                          {alt.prices.map((p: any) => {
                            const s = getStoreConfig(p.storeSlug);
                            return (
                              <span 
                                key={p.storeSlug}
                                title={`${s.label}: €${p.price.toFixed(2)}`}
                                className="w-5 h-5 rounded-full text-[8px] font-black flex items-center justify-center border border-white"
                                style={{ background: s.color, color: s.textColor }}
                              >
                                {s.initials}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Compare within modal action */}
                    <button
                      onClick={() => setProductId(alt.id)}
                      className="mt-3.5 w-full py-2 rounded-xl bg-masala-bg border border-masala-border hover:bg-masala-primary hover:text-white text-masala-text text-[10px] font-black text-center transition-all duration-200 flex items-center justify-center gap-1.5"
                    >
                      <span>Analyze Alternative</span>
                      <ExternalLink className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import PriceChart from './PriceChart';
import { getStoreConfig } from '@/lib/stores';
import { getDeliveryInfo } from '@/lib/storeDelivery';
import { buildRedirectUrl } from '@/lib/utm';
import { useSmartCart } from '@/stores/useSmartCart';
import { getProductPlaceholder } from '@/lib/utils/image';
import { 
  X, 
  ShoppingCart, 
  Check, 
  ExternalLink, 
  TrendingDown, 
  Truck, 
  Info,
  Sparkles,
  AlertTriangle,
  Bell
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
  const [imgSrc, setImgSrc] = useState<string>('');

  const { addItem, removeItem, items } = useSmartCart();

  const [user, setUser] = useState<any>(null);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [alertTargetPrice, setAlertTargetPrice] = useState<string>('');
  const [settingAlert, setSettingAlert] = useState(false);
  const [alertSuccess, setAlertSuccess] = useState<string | null>(null);
  const [alertError, setAlertError] = useState<string | null>(null);

  // Load user profile & existing price alerts if logged in
  useEffect(() => {
    if (!isOpen) return;

    setUser(null);
    setAlerts([]);
    setAlertTargetPrice('');
    setAlertSuccess(null);
    setAlertError(null);

    // Defer the heavy auth/alert load until after the modal slide animation completes
    const timer = setTimeout(() => {
      fetch('/api/alerts')
        .then(async (res) => {
          if (res.ok) {
            const resData = await res.json();
            if (resData.success) {
              setAlerts(resData.data || []);
              // Get user from supabase client
              const { createClient } = await import('@/lib/supabase/client');
              const supabase = createClient();
              const { data: { user: currentUser } } = await supabase.auth.getUser();
              setUser(currentUser);
            }
          }
        })
        .catch((err) => {
          console.error('Error fetching user/alerts:', err);
        });
    }, 350);

    return () => clearTimeout(timer);
  }, [isOpen]);

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
    
    const startMountTime = Date.now();

    fetch(`/api/products/${productId}`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load product details');
        return res.json();
      })
      .then((resData) => {
        const elapsed = Date.now() - startMountTime;
        const delay = Math.max(0, 300 - elapsed);
        
        setTimeout(() => {
          setData(resData);
          // Default to cheapest in-stock offer; fallback to cheapest.
          if (resData?.product?.prices?.length > 0) {
            const sorted = [...resData.product.prices].sort((a: any, b: any) => Number(a.price) - Number(b.price));
            const bestInStock = sorted.find((p: any) => p.inStock);
            setActiveStore((bestInStock || sorted[0]).storeSlug);
          }
          const imageUrl = resData?.product?.imageUrl;
          const category = resData?.product?.category;
          const name = resData?.product?.name;
          setImgSrc(imageUrl || getProductPlaceholder(category, name));
          setLoading(false);
        }, delay);
      })
      .catch((err) => {
        console.error('Error fetching modal details:', err);
        const elapsed = Date.now() - startMountTime;
        const delay = Math.max(0, 300 - elapsed);
        setTimeout(() => {
          setError(err.message || 'Something went wrong');
          setLoading(false);
        }, delay);
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

  // Prevent body scroll AND header interaction while modal is open
  useEffect(() => {
    if (!isOpen) return;
    document.body.style.overflow = 'hidden';
    
    // Find header and lower its z-index temporarily
    const header = document.querySelector('header');
    if (header) {
      header.dataset.prevZ = header.style.zIndex;
      header.style.zIndex = '90'; // below modal z-[100]
    }

    return () => {
      document.body.style.overflow = '';
      const header = document.querySelector('header');
      if (header) {
        header.style.zIndex = header.dataset.prevZ ?? '';
      }
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

  // Enough history to show the price chart (need at least 3 data points)
  const hasEnoughHistory = activeStoreHistory.length >= 3;

  // Create deep link redirect URL
  const redirectUrl = useMemo(() => {
    if (!activeListing) return '';
    return buildRedirectUrl({
      productId: activeListing.id || productId, // Use the specific listing ID if available, fallback to product ID
      storeSlug: activeStore,
      searchQuery,
      position,
    });
  }, [productId, activeStore, activeListing, searchQuery, position]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center sm:p-6"
      style={{
        paddingTop: 'env(safe-area-inset-top, 0px)',
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Backdrop */}
      <div 
        onClick={onClose}
        className="absolute inset-0 bg-black/55 backdrop-blur-sm transition-opacity duration-300 animate-fade-in"
        style={{ 
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.05) 1px, transparent 1px)', 
          backgroundSize: '24px 24px',
          willChange: 'opacity'
        }}
      />

      {/* Modal Container */}
      <div
        className={`
          relative bg-gradient-to-b from-[#FAF9F6] to-[#F5ECE0] border border-[#E8E0D4] shadow-2xl
          flex flex-col z-[101]
          w-full
          
          /* Mobile: bottom sheet */
          rounded-t-3xl max-h-[92vh]
          
          /* Desktop: centered dialog */
          sm:rounded-3xl sm:max-w-4xl sm:max-h-[88vh]
          
          overflow-hidden
          modal-mobile-sheet
        `}
        style={{ height: 'min(92vh, 720px)', willChange: 'transform, opacity' }}
      >
        {/* Mobile drag handle */}
        <div className="sm:hidden flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1 rounded-full bg-masala-border" />
        </div>
        
        {/* Header Section */}
        <div className="p-6 pb-4 border-b border-[#EAE3D8] flex items-start justify-between bg-white/40 backdrop-blur-md sticky top-0 rounded-t-[2.5rem] z-20">
          <div className="flex-1 min-w-0 pr-4">
            {/* Top badge row */}
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-full bg-masala-primary/10 text-masala-primary text-[10px] font-black uppercase tracking-widest">
                Product Comparison
              </span>
              {storeAnalytics?.isBuyNow && (
                <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-green-100 text-green-700 text-[10px] font-black animate-pulse">
                  <TrendingDown className="w-3 h-3" /> Best time to buy
                </span>
              )}
            </div>

            {/* Product name */}
            <h2 className="text-lg sm:text-2xl font-black text-masala-text leading-tight"
              style={{ fontFamily: 'Fraunces, serif' }}>
              {loading ? '—' : product?.name}
            </h2>

            {/* Context line — brand · weight · category */}
            {!loading && product && (
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                {product.brand && product.brand !== product.name && (
                  <span className="text-xs font-semibold text-masala-text-muted">{product.brand}</span>
                )}
                {product.brand && (product.weight || product.weightLabel) && (
                  <span className="text-masala-border text-xs">·</span>
                )}
                {(product.weight || product.weightLabel) && (
                  <span className="text-xs font-semibold text-masala-text-muted">
                    {product.weight || product.weightLabel}
                  </span>
                )}
                {product.category && (
                  <>
                    <span className="text-masala-border text-xs">·</span>
                    <span className="px-2 py-0.5 rounded-full bg-masala-bg border border-masala-border/60 text-[10px] font-bold text-masala-text">
                      {product.category}
                    </span>
                  </>
                )}
              </div>
            )}
          </div>
          <button 
            onClick={onClose}
            className="w-10 h-10 rounded-full border border-masala-border/40 bg-white/95 backdrop-blur-sm flex items-center justify-center text-masala-text hover:border-masala-primary hover:text-masala-primary hover:rotate-90 hover:scale-105 active:scale-95 shadow-sm transition-all duration-300 flex-shrink-0"
            aria-label="Close details"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Section */}
        <div className="p-6 overflow-y-auto flex-1">
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
            <>
            {/* Mobile-only top strip */}
            <div className="md:hidden flex items-center gap-3 px-4 py-3 -mx-6 -mt-6 mb-6 border-b border-masala-border bg-white">
              <div className="w-14 h-14 flex-shrink-0 bg-masala-muted rounded-xl overflow-hidden flex items-center justify-center p-1">
                <img
                  src={imgSrc}
                  alt={product?.name}
                  className="w-full h-full object-contain"
                  onError={() => {
                    const fallback = getProductPlaceholder(product?.category, product?.name);
                    if (imgSrc !== fallback) {
                      setImgSrc(fallback);
                    }
                  }}
                />
              </div>
              <div className="flex gap-1.5 overflow-x-auto scrollbar-none flex-1">
                {product?.prices?.map((p: any) => {
                  const s = getStoreConfig(p.storeSlug);
                  const isActive = p.storeSlug === activeStore;
                  return (
                    <button key={p.storeSlug}
                      onClick={() => setActiveStore(p.storeSlug)}
                      className={`flex-shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border transition-all text-xs ${
                        isActive ? 'border-masala-primary bg-masala-primary/5' : 'border-masala-border bg-white'
                      } ${!p.inStock ? 'opacity-50' : ''}`}>
                      <span className="w-5 h-5 rounded-md text-[8px] font-black flex items-center justify-center"
                        style={{ background: s.color, color: s.textColor }}>
                        {s.initials}
                      </span>
                      <span className={`font-bold ${isActive ? 'text-masala-primary' : 'text-masala-text'}`}>
                        €{p.price.toFixed(2)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* Left Column: Image, Store Selection & Actions (5 cols) */}
              <div className="lg:col-span-5 space-y-6">
                
                {/* Image — fixed height, glowing brand color light halo */}
                <div className="flex-shrink-0 h-[220px] bg-white rounded-3xl border border-masala-border/40 flex items-center justify-center p-4 relative overflow-hidden shadow-inner">
                  {/* Radial gradient bg */}
                  <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_#faf6ef_0%,_#ffffff_80%)]" />
                  {/* Store-colored halo */}
                  {(() => {
                    const best = product?.prices?.find((p: any) => p.inStock);
                    const sc = best ? getStoreConfig(best.storeSlug) : null;
                    return (
                      <div
                        className="absolute inset-4 rounded-xl opacity-25 blur-2xl transition-all duration-500"
                        style={{ background: sc?.color ?? '#f4efe8' }}
                      />
                    );
                  })()}
                  <img
                    src={imgSrc}
                    alt={product?.name}
                    className="relative z-10 max-h-full max-w-full object-contain drop-shadow-xl hover:scale-110 transition-transform duration-500"
                    onError={() => {
                      const fallback = getProductPlaceholder(product?.category, product?.name);
                      if (imgSrc !== fallback) {
                        setImgSrc(fallback);
                      }
                    }}
                  />
                </div>

                {/* Store Tabs selector */}
                <div className="space-y-2.5">
                  <div className="flex items-center gap-2">
                    <p className="text-[9px] font-black uppercase tracking-widest text-masala-text-muted flex-shrink-0">
                      🔄 Compare Stores
                    </p>
                    <div className="flex-1 h-px bg-masala-border" />
                    <span className="text-[9px] text-masala-text-muted flex-shrink-0">
                      {sortedPrices.length} store{sortedPrices.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                    {sortedPrices.slice(0, 6).map((p: any) => {
                      const isActive = p.storeSlug === activeStore;
                      const s = getStoreConfig(p.storeSlug);
                      return (
                        <button
                          key={p.storeSlug}
                          onClick={() => setActiveStore(p.storeSlug)}
                          className={`w-full flex items-center justify-between p-3.5 rounded-2xl border transition-all duration-300 relative overflow-hidden ${
                            isActive
                              ? 'bg-white border-masala-primary shadow-[0_4px_16px_rgba(139,32,32,0.08)] scale-[1.03] z-10'
                              : 'bg-white/40 border-masala-border/50 hover:bg-white hover:border-masala-border hover:scale-[1.01]'
                          }`}
                        >
                          {isActive && (
                            <div 
                              className="absolute left-0 top-0 bottom-0 w-1.5 transition-all duration-300"
                              style={{ background: s.color }}
                            />
                          )}
                          <div className={`flex items-center gap-3 ${isActive ? 'pl-1.5' : ''}`}>
                            <span 
                              className="w-7 h-7 rounded-xl text-[10px] font-black flex items-center justify-center shadow-sm"
                              style={{ background: s.color, color: s.textColor }}
                            >
                              {s.initials}
                            </span>
                            <div className="text-left">
                              <span className="text-xs font-black text-masala-text block leading-none">
                                {s.label}
                              </span>
                              {!p.isExactMatch && (
                                <span className="text-[9px] text-amber-700 font-bold uppercase tracking-wide mt-0.5 block">
                                  Similar Match
                                </span>
                              )}
                              {!p.inStock && (
                                <span className="text-[9px] text-red-500 font-bold uppercase tracking-wide mt-0.5 block">
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
                  <div className="bg-gradient-to-br from-white to-[#FAF6EE] rounded-[2rem] border border-white/60 p-6 space-y-4 shadow-[0_8px_24px_rgba(28,20,16,0.03)] relative overflow-hidden">
                    <div 
                      className="absolute right-0 top-0 w-32 h-32 rounded-full opacity-[0.04] blur-2xl pointer-events-none"
                      style={{ background: storeConfig?.color }}
                    />
                    <div className="flex items-start justify-between relative z-10">
                      <div>
                        <span className="text-[9px] font-black uppercase tracking-widest text-masala-text-muted block">
                          Selected Store Best Offer
                        </span>
                        <div className="flex items-baseline gap-2 mt-1">
                          <span className="text-3xl font-black text-masala-primary" style={{ fontFamily: 'Fraunces, serif' }}>
                            €{activeListing.price.toFixed(2)}
                          </span>
                          {activeListing.pricePerKg && (
                            <span className="text-xs text-masala-text-muted font-semibold">
                              (€{activeListing.pricePerKg.toFixed(2)}/kg)
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Recommend Buy Badge */}
                      {storeAnalytics?.isBuyNow && (
                        <div className="bg-emerald-50 text-emerald-700 px-3.5 py-1.5 rounded-full border border-emerald-100/50 flex items-center gap-1.5 text-xs font-black shadow-sm animate-pulse">
                          <TrendingDown className="h-4 w-4" />
                          <span>🔥 Best Time to Buy!</span>
                        </div>
                      )}
                    </div>

                    {/* Quick Analytics Cards */}
                    {storeAnalytics && (
                      <div className="grid grid-cols-3 gap-3 pt-4 border-t border-masala-border/40 relative z-10">
                        <div className="bg-[#FBF9F6] p-3 rounded-2xl text-center border border-masala-border/30 hover:border-masala-primary/30 transition-colors shadow-sm">
                          <span className="text-[9px] font-bold text-masala-text-muted uppercase block mb-1 tracking-wider">
                            30d Avg Price
                          </span>
                          <span className="text-base font-black text-masala-text">
                            €{storeAnalytics.avg30d.toFixed(2)}
                          </span>
                        </div>
                        <div className="bg-emerald-50/30 p-3 rounded-2xl text-center border border-emerald-100/50 hover:border-emerald-300/30 transition-colors shadow-sm">
                          <span className="text-[9px] font-bold text-emerald-600 uppercase block mb-1 tracking-wider">
                            All-Time Low
                          </span>
                          <span className="text-base font-black text-emerald-600">
                            €{storeAnalytics.allTimeLow.toFixed(2)}
                          </span>
                        </div>
                        <div className="bg-red-50/30 p-3 rounded-2xl text-center border border-red-100/50 hover:border-red-300/30 transition-colors shadow-sm">
                          <span className="text-[9px] font-bold text-red-500 uppercase block mb-1 tracking-wider">
                            All-Time High
                          </span>
                          <span className="text-base font-black text-red-500">
                            €{storeAnalytics.allTimeHigh.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Savings Insights */}
                    {storeAnalytics && storeAnalytics.percentDifference > 0 && (
                      <p className="text-[11px] font-bold text-emerald-600 bg-emerald-50/40 px-3.5 py-2.5 rounded-xl flex items-center gap-2 border border-emerald-100/30 relative z-10">
                        <Sparkles className="h-3.5 w-3.5" />
                        Save {storeAnalytics.percentDifference.toFixed(1)}% compared to the 30-day average price for this store!
                      </p>
                    )}
                  </div>
                )}

                {/* Price History Chart or Insights Card */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-black uppercase tracking-widest text-masala-text-muted">
                      30-Day Price Trend ({storeConfig?.label})
                    </p>
                    <span className="text-[10px] font-bold text-masala-text-muted flex items-center gap-1 bg-white px-2 py-0.5 rounded-md border border-masala-border/60">
                      <Info className="h-3 w-3" /> Real-time pricing
                    </span>
                  </div>

                  {hasEnoughHistory ? (
                    <div className="h-[170px]">
                      <PriceChart
                        history={activeStoreHistory}
                        currentPrice={activeListing?.price ?? 0}
                        allTimeLow={storeAnalytics?.allTimeLow ?? (activeListing?.price ?? 0)}
                        allTimeHigh={storeAnalytics?.allTimeHigh ?? (activeListing?.price ?? 0)}
                      />
                    </div>
                  ) : (
                    <div className="bg-white rounded-2xl border border-masala-border p-4">
                      {/* Header row */}
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-[10px] font-black uppercase tracking-widest text-masala-text-muted">Price Insights</p>
                        <span className="flex items-center gap-1 text-[10px] text-amber-600 font-bold bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                          Tracking started
                        </span>
                      </div>
                      {/* 2×2 insight grid */}
                      <div className="grid grid-cols-2 gap-2">
                        {/* Best store now */}
                        <div className="bg-[#FAF8F5] rounded-xl p-3 border border-masala-border/30">
                          <p className="text-[9px] font-black uppercase text-masala-text-muted mb-1">Best Store Now</p>
                          {(() => {
                            const inStockPrices = product?.prices?.filter((p: any) => p.inStock) ?? [];
                            const best = inStockPrices.reduce((a: any, b: any) => a.price < b.price ? a : b, inStockPrices[0]);
                            const sc = best ? getStoreConfig(best.storeSlug) : null;
                            return best ? (
                              <div className="flex items-center gap-2">
                                <span className="w-6 h-6 rounded-lg text-[9px] font-black flex items-center justify-center flex-shrink-0"
                                  style={{ background: sc?.color, color: sc?.textColor }}>
                                  {sc?.initials}
                                </span>
                                <div>
                                  <p className="text-xs font-bold text-masala-text leading-none">{sc?.label}</p>
                                  <p className="text-sm font-black text-masala-primary leading-none mt-0.5" style={{ fontFamily: 'Fraunces, serif' }}>
                                    €{best.price.toFixed(2)}
                                  </p>
                                </div>
                              </div>
                            ) : <p className="text-xs text-masala-text-muted">No stock</p>;
                          })()}
                        </div>
                        {/* Price spread */}
                        <div className="bg-[#FAF8F5] rounded-xl p-3 border border-masala-border/30">
                          <p className="text-[9px] font-black uppercase text-masala-text-muted mb-1">Price Spread</p>
                          {(() => {
                            const inStockPrices = product?.prices?.filter((p: any) => p.inStock).map((p: any) => p.price) ?? [];
                            if (inStockPrices.length < 2) return <p className="text-xs text-masala-text-muted">Only 1 store</p>;
                            const spread = Math.max(...inStockPrices) - Math.min(...inStockPrices);
                            return (
                              <>
                                <p className="text-sm font-black text-masala-primary" style={{ fontFamily: 'Fraunces, serif' }}>€{spread.toFixed(2)}</p>
                                <p className="text-[9px] text-masala-text-muted mt-0.5">between {inStockPrices.length} stores</p>
                              </>
                            );
                          })()}
                        </div>
                        {/* Best €/kg */}
                        <div className="bg-[#FAF8F5] rounded-xl p-3 border border-masala-border/30">
                          <p className="text-[9px] font-black uppercase text-masala-text-muted mb-1">Best €/kg</p>
                          {(() => {
                            const withKg = product?.prices?.filter((p: any) => p.inStock && p.pricePerKg);
                            if (!withKg?.length) return <p className="text-xs text-masala-text-muted">N/A</p>;
                            const best = withKg.reduce((a: any, b: any) => a.pricePerKg < b.pricePerKg ? a : b);
                            return (
                              <p className="text-sm font-black text-masala-primary" style={{ fontFamily: 'Fraunces, serif' }}>
                                €{best.pricePerKg.toFixed(2)}<span className="text-xs font-normal text-masala-text-muted">/kg</span>
                              </p>
                            );
                          })()}
                        </div>
                        {/* Availability */}
                        <div className="bg-[#FAF8F5] rounded-xl p-3 border border-masala-border/30">
                          <p className="text-[9px] font-black uppercase text-masala-text-muted mb-1">Availability</p>
                          {(() => {
                            const inStock = product?.prices?.filter((p: any) => p.inStock).length ?? 0;
                            const total = product?.prices?.length ?? 0;
                            return (
                              <>
                                <p className="text-sm font-black text-masala-text">
                                  {inStock}<span className="text-masala-text-muted font-normal text-xs">/{total}</span>
                                </p>
                                <p className="text-[9px] text-masala-text-muted mt-0.5">stores in stock</p>
                                <div className="mt-1.5 h-1 bg-masala-border rounded-full overflow-hidden">
                                  <div className="h-full bg-green-500 rounded-full transition-all"
                                    style={{ width: `${total > 0 ? (inStock / total) * 100 : 0}%` }} />
                                </div>
                              </>
                            );
                          })()}
                        </div>
                      </div>
                      <p className="text-[10px] text-masala-text-muted text-center mt-3 pt-3 border-t border-masala-border/50">
                        📈 Price history chart will appear after a few days of tracking
                      </p>
                    </div>
                  )}
                </div>

                {/* 🔄 Similar Category Alternatives Strip */}
                {!loading && !error && alternatives.length > 0 && (
                  <div className="space-y-2.5">
                    <div className="flex items-center gap-2 mb-2">
                      <p className="text-[9px] font-black uppercase tracking-widest text-masala-text-muted flex-shrink-0">
                        🔄 Similar {product?.category}
                      </p>
                      <div className="flex-1 h-px bg-masala-border" />
                      <span className="text-[9px] text-masala-text-muted flex-shrink-0">
                        {alternatives.length} alternatives found
                      </span>
                    </div>

                    {/* Horizontal scrollable strip of max 6 alternatives */}
                    <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-masala-border">
                      {alternatives.slice(0, 6).map((alt: any) => {
                        return (
                          <button
                            key={alt.id || alt.name}
                            onClick={() => setProductId(alt.id)}
                            className="flex-shrink-0 w-[140px] min-w-[130px] bg-white/95 rounded-2xl border border-masala-border/50 p-3.5 flex flex-col justify-between hover:border-masala-primary/60 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 text-left active:scale-[0.97]"
                          >
                            <div className="space-y-1">
                              {/* Brand */}
                              <span className="text-[8px] font-black uppercase tracking-wider text-masala-primary block leading-none">
                                {alt.brand}
                              </span>
                              {/* Name */}
                              <h4 className="text-[10px] font-bold text-masala-text line-clamp-2 leading-tight min-h-[1.5rem]">
                                {alt.name}
                              </h4>
                            </div>

                            {/* Price details at bottom */}
                            <div className="mt-2 pt-2 border-t border-masala-border/40 flex items-baseline justify-between">
                              <span className="text-xs font-black text-masala-primary" style={{ fontFamily: 'Fraunces, serif' }}>
                                €{alt.bestPrice.toFixed(2)}
                              </span>
                              {alt.weightLabel && (
                                <span className="text-[8px] text-masala-text-muted">
                                  {alt.weightLabel}
                                </span>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Delivery & Shipping Info */}
                {deliveryInfo && (
                  <div className="bg-white/80 backdrop-blur-sm rounded-3xl border border-masala-border/40 p-4 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow duration-300">
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

                {/* Smart Recommendation Banner */}
                {(() => {
                  const prices = product?.prices?.filter((p: any) => p.inStock) ?? [];
                  if (prices.length === 0 || !activeListing) return null;
                  const best = prices.reduce((a: any, b: any) => a.price < b.price ? a : b);
                  const isActiveBest = best?.storeSlug === activeStore;
                  const bestConf = getStoreConfig(best.storeSlug);
                  return (
                    <div className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold ${
                      isActiveBest
                        ? 'bg-green-50/80 text-green-700 border border-green-100'
                        : 'bg-amber-50/80 text-amber-700 border border-amber-100'
                    }`}>
                      {isActiveBest ? (
                        <>✅ You&apos;re viewing the best price available</>
                      ) : (
                        <>
                          💡 <span className="font-black">{bestConf.label}</span> has it for&nbsp;
                          <span className="font-black">€{best.price.toFixed(2)}</span>
                          &nbsp;— €{(activeListing.price - best.price).toFixed(2)} cheaper
                        </>
                      )}
                    </div>
                  );
                })()}

                {/* 🔔 Price Alert Section */}
                {activeListing && (
                  <div className="bg-white rounded-3xl border border-masala-border/40 p-5 space-y-3.5 shadow-sm hover:shadow-md transition-shadow duration-300">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600 border border-amber-100 flex-shrink-0">
                        <Bell className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-black uppercase tracking-widest text-masala-text-muted leading-none mb-1">
                          Price Alert
                        </p>
                        <p className="text-xs text-masala-text font-bold leading-normal">
                          Notify me when this product drops below a target price on {storeConfig?.label}.
                        </p>
                      </div>
                    </div>

                    {user ? (
                      (() => {
                        const existingAlert = alerts.find(a => a.listing_id === activeListing.id);
                        if (existingAlert) {
                          return (
                            <div className="bg-emerald-50/50 border border-emerald-100 p-3.5 rounded-2xl flex items-center justify-between gap-3 animate-fade-in">
                              <div className="flex items-center gap-2">
                                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" />
                                <p className="text-xs text-emerald-800 font-bold">
                                  Active alert at <strong className="font-extrabold text-sm text-emerald-950">€{existingAlert.target_price.toFixed(2)}</strong>
                                </p>
                              </div>
                              <button
                                onClick={async () => {
                                  try {
                                    const res = await fetch(`/api/alerts?id=${existingAlert.id}`, { method: 'DELETE' });
                                    const resData = await res.json();
                                    if (resData.success) {
                                      setAlerts(prev => prev.filter(a => a.id !== existingAlert.id));
                                      setAlertSuccess('Alert removed successfully!');
                                      setTimeout(() => setAlertSuccess(null), 3000);
                                    } else {
                                      throw new Error(resData.error?.message || 'Failed to remove alert');
                                    }
                                  } catch (err: any) {
                                    setAlertError(err.message || 'Error removing alert');
                                    setTimeout(() => setAlertError(null), 4000);
                                  }
                                }}
                                className="text-xs font-black text-red-600 hover:text-red-800 transition-colors uppercase tracking-wider"
                              >
                                Delete Alert
                              </button>
                            </div>
                          );
                        }

                        return (
                          <div className="space-y-3">
                            <div className="flex gap-2 items-center">
                              <div className="relative flex-1">
                                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-black text-masala-text-muted">€</span>
                                <input
                                  type="number"
                                  step="0.01"
                                  min="0.01"
                                  value={alertTargetPrice}
                                  onChange={(e) => setAlertTargetPrice(e.target.value)}
                                  placeholder={`Target Price (e.g. ${(activeListing.price * 0.9).toFixed(2)})`}
                                  className="w-full h-11 pl-7 pr-3 rounded-2xl bg-masala-muted/30 border border-masala-border/80 text-xs font-bold text-masala-text placeholder:text-masala-text-muted focus:outline-none focus:ring-2 focus:ring-masala-primary/10 focus:border-masala-primary transition-all"
                                />
                              </div>
                              <button
                                disabled={settingAlert}
                                onClick={async () => {
                                  const target = parseFloat(alertTargetPrice);
                                  if (isNaN(target) || target <= 0) {
                                    setAlertError('Please enter a valid target price');
                                    setTimeout(() => setAlertError(null), 3000);
                                    return;
                                  }
                                  setSettingAlert(true);
                                  try {
                                    const res = await fetch('/api/alerts', {
                                      method: 'POST',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({ listingId: activeListing.id, targetPrice: target }),
                                    });
                                    const resData = await res.json();
                                    if (res.ok && resData.success) {
                                      setAlerts(prev => [resData.data, ...prev]);
                                      setAlertSuccess('Price alert created successfully!');
                                      setAlertTargetPrice('');
                                      setTimeout(() => setAlertSuccess(null), 3000);
                                    } else {
                                      throw new Error(resData.error?.message || 'Failed to create alert');
                                    }
                                  } catch (err: any) {
                                    setAlertError(err.message || 'Error creating alert');
                                    setTimeout(() => setAlertError(null), 4000);
                                  } finally {
                                    setSettingAlert(false);
                                  }
                                }}
                                className="h-11 px-5 rounded-2xl bg-masala-primary hover:bg-masala-secondary text-white text-xs font-black transition-all whitespace-nowrap active:scale-95 disabled:opacity-50"
                              >
                                {settingAlert ? 'Setting...' : 'Set Alert'}
                              </button>
                            </div>
                            
                            {/* Quick recommendation pill */}
                            <div className="flex gap-2 flex-wrap">
                              <button
                                onClick={() => setAlertTargetPrice((activeListing.price * 0.9).toFixed(2))}
                                className="text-[10px] font-bold text-masala-text-muted hover:text-masala-primary bg-masala-muted/20 border border-masala-border/40 hover:border-masala-primary/40 px-2.5 py-1 rounded-xl transition-all"
                              >
                                💡 Set 10% Off (€{(activeListing.price * 0.9).toFixed(2)})
                              </button>
                              <button
                                onClick={() => setAlertTargetPrice((activeListing.price * 0.8).toFixed(2))}
                                className="text-[10px] font-bold text-masala-text-muted hover:text-masala-primary bg-masala-muted/20 border border-masala-border/40 hover:border-masala-primary/40 px-2.5 py-1 rounded-xl transition-all"
                              >
                                💡 Set 20% Off (€{(activeListing.price * 0.8).toFixed(2)})
                              </button>
                            </div>
                          </div>
                        );
                      })()
                    ) : (
                      <div className="bg-[#FAF8F5] border border-masala-border/40 p-3.5 rounded-2xl text-center">
                        <p className="text-xs font-semibold text-masala-text-muted">
                          Want to track prices? <Link href="/login" className="font-black text-masala-primary hover:underline">Log in</Link> or <Link href="/register" className="font-black text-masala-primary hover:underline">Register</Link> to receive email alerts when the price drops!
                        </p>
                      </div>
                    )}

                    {alertSuccess && (
                      <p className="text-[11px] font-bold text-emerald-600 bg-emerald-50/50 border border-emerald-100 px-3 py-1.5 rounded-xl animate-fade-in">
                        ✓ {alertSuccess}
                      </p>
                    )}
                    {alertError && (
                      <p className="text-[11px] font-bold text-red-600 bg-red-50 border border-red-100 px-3 py-1.5 rounded-xl animate-fade-in">
                        ⚠ {alertError}
                      </p>
                    )}
                  </div>
                )}

                {/* Action Buttons Row */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
                  {/* Buy Now (Direct link to active store) */}
                  <a
                    href={redirectUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-grow sm:flex-1 h-12 rounded-2xl bg-masala-primary hover:bg-masala-secondary text-white text-xs font-black flex items-center justify-center gap-2 shadow-lg shadow-masala-primary/10 active:scale-[0.98] transition-all duration-300"
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
                    className={`h-12 px-6 rounded-2xl border transition-all duration-300 active:scale-95 flex items-center justify-center gap-2 text-xs font-black ${
                      isSelectedInCart
                        ? 'bg-gradient-to-r from-emerald-600 to-teal-600 border-transparent text-white shadow-md shadow-emerald-500/10'
                        : 'bg-white border-masala-border text-emerald-600 hover:bg-emerald-50 hover:border-emerald-200'
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
            </>
          )}
        </div>

      </div>
    </div>
  );
}

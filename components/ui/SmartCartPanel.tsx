'use client';

import { useState } from 'react';
import { X, Trash2, Plus, Minus, ShoppingBag } from 'lucide-react';
import { useSmartCart, CartItem } from '@/stores/useSmartCart';
import { getStoreConfig } from '@/lib/stores';
import { getDeliveryInfo } from '@/lib/storeDelivery';
import { buildCartUrl } from '@/lib/cartRedirect';

interface SmartCartPanelProps {
  onClose: () => void;
}

export default function SmartCartPanel({ onClose }: SmartCartPanelProps) {
  const { getItemsByStore, getStoreTotal, clearStore, updateQuantity, removeItem, getTotalItems, clearAll } = useSmartCart();
  const itemsByStore = getItemsByStore();
  const stores = Object.keys(itemsByStore);
  const totalItems = getTotalItems();

  return (
    <div className="fixed right-0 top-0 h-full w-full max-w-[400px] bg-white shadow-2xl z-[60] flex flex-col animate-slide-in-right">

      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-masala-border bg-masala-bg/50">
        <div className="flex items-center gap-2.5">
          <ShoppingBag className="h-5 w-5 text-masala-primary" />
          <h2 className="text-lg font-black text-masala-text">Smart Cart</h2>
          <span className="px-2 py-0.5 rounded-full bg-masala-primary text-white text-[11px] font-black">
            {totalItems} item{totalItems !== 1 ? 's' : ''}
          </span>
        </div>
        <button
          onClick={onClose}
          className="rounded-lg p-1.5 text-masala-text-muted hover:text-masala-text hover:bg-masala-border/50 transition-colors"
          aria-label="Close cart"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {stores.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-16 gap-4">
            <div className="w-20 h-20 rounded-full bg-masala-muted/50 flex items-center justify-center">
              <ShoppingBag className="h-9 w-9 text-masala-text-muted" />
            </div>
            <div>
              <p className="font-bold text-masala-text text-lg">Your Smart Cart is empty</p>
              <p className="text-sm text-masala-text-muted mt-1">
                Add products from search results to compare & checkout
              </p>
            </div>
          </div>
        ) : (
          stores.map((storeSlug) => (
            <StoreSection
              key={storeSlug}
              storeSlug={storeSlug}
              items={itemsByStore[storeSlug]}
              storeTotal={getStoreTotal(storeSlug)}
              onClearStore={() => clearStore(storeSlug)}
              onUpdateQty={(pid, slug, qty) => updateQuantity(pid, slug, qty)}
              onRemove={(pid, slug) => removeItem(pid, slug)}
            />
          ))
        )}
      </div>

      {/* Footer hint */}
      {stores.length > 0 && (
        <div className="px-5 py-3 border-t border-masala-border bg-masala-bg/50 flex items-center justify-between gap-3">
          <p className="text-[11px] text-masala-text-muted flex-1">
            💡 Items saved locally. Click &quot;Checkout at Store&quot; to buy.
          </p>
          <button
            onClick={clearAll}
            className="text-[11px] font-bold text-red-400 hover:text-red-600 transition-colors whitespace-nowrap flex-shrink-0"
          >
            Clear All
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Store Section ─────────────────────────────────────────────────────────

interface StoreSectionProps {
  storeSlug: string;
  items: CartItem[];
  storeTotal: number;
  onClearStore: () => void;
  onUpdateQty: (pid: string, slug: string, qty: number) => void;
  onRemove: (pid: string, slug: string) => void;
}

function StoreSection({ storeSlug, items, storeTotal, onClearStore, onUpdateQty, onRemove }: StoreSectionProps) {
  const config = getStoreConfig(storeSlug);
  const delivery = getDeliveryInfo(storeSlug);
  const [collapsed, setCollapsed] = useState(false);

  const freeDeliveryGap =
    delivery?.freeDeliveryThreshold != null
      ? Math.max(0, delivery.freeDeliveryThreshold - storeTotal)
      : null;

  const deliveryFee = freeDeliveryGap === 0 ? 0 : (delivery?.standardDeliveryFee ?? 0);
  const grandTotal = storeTotal + deliveryFee;

  const cartResult = buildCartUrl(
    storeSlug,
    items.map((i) => ({
      productId: i.productId,
      productName: i.productName,
      storeSlug: i.storeSlug,
      storeHandle: i.storeHandle,
      variantId: i.variantId,
      quantity: i.quantity,
      url: i.url
    })),
  );

  return (
    <div className="border border-masala-border rounded-2xl overflow-hidden">

      {/* Store header */}
      <div className="flex items-center justify-between px-3 py-2.5 bg-masala-muted/40">
        <button
          className="flex items-center gap-2 flex-1 text-left"
          onClick={() => setCollapsed(!collapsed)}
        >
          <span
            className="w-7 h-7 rounded-lg text-[11px] font-black flex items-center justify-center flex-shrink-0"
            style={{ background: config.color, color: config.textColor }}
          >
            {config.initials}
          </span>
          <span className="font-bold text-sm text-masala-text">{config.label}</span>
          <span className="text-[11px] text-masala-text-muted">
            ({items.length} item{items.length !== 1 ? 's' : ''})
          </span>
          <span className="ml-1 text-[11px] text-masala-text-muted">{collapsed ? '▼' : '▲'}</span>
        </button>
        <div className="flex items-center gap-2">
          <span className="font-bold text-masala-primary text-sm">€{storeTotal.toFixed(2)}</span>
          <button
            onClick={onClearStore}
            className="text-[11px] text-masala-text-muted hover:text-red-500 transition-colors p-1"
            title="Remove all items from this store"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Item rows */}
      {!collapsed && (
        <>
          <div className="divide-y divide-masala-border">
            {items.map((item) => (
              <CartItemRow
                key={`${item.productId}-${item.storeSlug}`}
                item={item}
                onUpdateQty={(qty) => onUpdateQty(item.productId, item.storeSlug, qty)}
                onRemove={() => onRemove(item.productId, item.storeSlug)}
              />
            ))}
          </div>

          {/* Delivery progress bar */}
          {freeDeliveryGap !== null && freeDeliveryGap > 0 && (
            <div className="px-3 py-2.5 bg-amber-50 border-t border-amber-100">
              <p className="text-[11px] text-amber-700 font-medium mb-1.5">
                🚚 Add €{freeDeliveryGap.toFixed(2)} more for free delivery!
              </p>
              <div className="h-1.5 bg-amber-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-500 rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(100, (storeTotal / (delivery?.freeDeliveryThreshold ?? 1)) * 100)}%`,
                  }}
                />
              </div>
            </div>
          )}
          {freeDeliveryGap === 0 && (
            <div className="px-3 py-2 bg-emerald-50 border-t border-emerald-100">
              <p className="text-[11px] text-emerald-700 font-bold">✅ Free delivery unlocked!</p>
            </div>
          )}

          {/* Totals + checkout */}
          <div className="p-3 border-t border-masala-border space-y-2">
            <div className="flex justify-between text-xs text-masala-text-muted">
              <span>Subtotal</span>
              <span className="font-bold text-masala-text">€{storeTotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-xs text-masala-text-muted">
              <span>Delivery</span>
              <span className={`font-bold ${freeDeliveryGap === 0 ? 'text-emerald-600' : 'text-masala-text'}`}>
                {freeDeliveryGap === 0 ? 'FREE' : `€${delivery?.standardDeliveryFee.toFixed(2) ?? '—'}`}
              </span>
            </div>
            <div className="flex justify-between text-sm font-black text-masala-text border-t border-masala-border pt-2">
              <span>Total</span>
              <span className="text-masala-primary">€{grandTotal.toFixed(2)}</span>
            </div>

            <a
              href={cartResult.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`w-full h-11 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-colors mt-1 ${
                cartResult.confidence === 'high'
                  ? 'bg-masala-primary text-white hover:bg-masala-secondary shadow-sm shadow-masala-primary/20'
                  : 'bg-masala-primary/80 text-white hover:bg-masala-primary'
              }`}
            >
              {cartResult.method === 'shopify_cart'
                ? '🛒 Checkout with items →'
                : cartResult.method === 'direct_url'
                ? '🛒 Go to product page →'
                : `🔍 Search at ${config.label} →`}
            </a>
            {cartResult.confidence === 'low' && (
              <p className="text-[10px] text-amber-600 text-center mt-1">
                ⚠️ Cart pre-fill unavailable — you'll need to add items manually
              </p>
            )}
            {cartResult.note && cartResult.confidence !== 'low' && (
              <p className="text-[10px] text-masala-text-muted text-center mt-1">
                {cartResult.note}
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Cart Item Row ──────────────────────────────────────────────────────────

function CartItemRow({
  item,
  onUpdateQty,
  onRemove,
}: {
  item: CartItem;
  onUpdateQty: (qty: number) => void;
  onRemove: () => void;
}) {
  return (
    <div className="flex items-center gap-2.5 px-3 py-2.5">
      {/* Thumbnail */}
      <div className="w-10 h-10 rounded-lg bg-masala-muted/40 flex items-center justify-center flex-shrink-0 overflow-hidden">
        {item.imageUrl ? (
          <img src={item.imageUrl} alt={item.productName} className="w-full h-full object-contain" />
        ) : (
          <span className="text-xl">🛒</span>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-[12px] font-semibold text-masala-text truncate">{item.productName}</p>
        {item.weight && (
          <p className="text-[10px] text-masala-text-muted">{item.weight}</p>
        )}
        <p className="text-[12px] font-bold text-masala-primary">
          €{(item.price * item.quantity).toFixed(2)}
        </p>
      </div>

      {/* Qty controls */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <button
          onClick={() => onUpdateQty(item.quantity - 1)}
          className="w-6 h-6 rounded-lg bg-masala-muted flex items-center justify-center hover:bg-masala-border transition-colors"
        >
          <Minus className="h-3 w-3 text-masala-text" />
        </button>
        <span className="w-5 text-center text-sm font-bold text-masala-text">{item.quantity}</span>
        <button
          onClick={() => onUpdateQty(item.quantity + 1)}
          className="w-6 h-6 rounded-lg bg-masala-primary flex items-center justify-center hover:bg-masala-secondary transition-colors"
        >
          <Plus className="h-3 w-3 text-white" />
        </button>
      </div>

      {/* Remove */}
      <button
        onClick={onRemove}
        className="text-masala-text-muted hover:text-red-500 transition-colors p-1 flex-shrink-0"
        title="Remove item"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

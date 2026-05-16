'use client';
import { useSmartCart } from '@/stores/useSmartCart';
import { getDeliveryInfo } from '@/lib/storeDelivery';
import { ShoppingCart, Trash2, ArrowRight, Truck } from 'lucide-react';

export default function SmartCartModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { items, removeItem, updateQuantity, getItemsByStore, getStoreTotal } = useSmartCart();
  
  if (!isOpen) return null;

  const storesInCart = getItemsByStore();
  const storeSlugs = Object.keys(storesInCart);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      
      {/* Drawer */}
      <div className="relative w-full max-w-md h-full bg-white shadow-2xl flex flex-col animate-slide-in-right">
        
        {/* Header */}
        <div className="p-6 border-b border-masala-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-2xl bg-masala-primary/10 flex items-center justify-center">
              <ShoppingCart className="h-5 w-5 text-masala-primary" />
            </div>
            <h2 className="text-xl font-black text-masala-text" style={{ fontFamily: 'Fraunces, serif' }}>
              Smart Cart
            </h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-masala-muted rounded-full">✕</button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {storeSlugs.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-5xl mb-4">🛒</p>
              <h3 className="text-lg font-bold text-masala-text">Your cart is empty</h3>
              <p className="text-sm text-masala-text-muted mt-2">Add items from different stores to compare and checkout.</p>
            </div>
          ) : (
            storeSlugs.map(slug => {
              const storeItems = storesInCart[slug];
              const total = getStoreTotal(slug);
              const delivery = getDeliveryInfo(slug);
              const isFree = delivery?.freeDeliveryThreshold ? total >= delivery.freeDeliveryThreshold : false;
              const remaining = delivery?.freeDeliveryThreshold ? delivery.freeDeliveryThreshold - total : 0;

              return (
                <div key={slug} className="space-y-4">
                  <div className="flex items-center justify-between border-b border-masala-border pb-2">
                    <h3 className="font-black text-masala-text uppercase text-[12px] tracking-widest">
                      {storeItems[0].storeName}
                    </h3>
                    <div className="text-right">
                      <p className="text-lg font-bold text-masala-primary">€ {total.toFixed(2)}</p>
                    </div>
                  </div>

                  {/* Delivery Progress */}
                  {delivery?.freeDeliveryThreshold && (
                    <div className="bg-masala-muted rounded-xl p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-bold text-masala-text-muted flex items-center gap-1.5">
                          <Truck className="h-3.5 w-3.5" />
                          {isFree ? 'FREE DELIVERY UNLOCKED!' : `€ ${remaining.toFixed(2)} more for free delivery`}
                        </span>
                      </div>
                      <div className="h-1.5 w-full bg-white rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-emerald-500 transition-all duration-500" 
                          style={{ width: `${Math.min((total / delivery.freeDeliveryThreshold) * 100, 100)}%` }} 
                        />
                      </div>
                    </div>
                  )}

                  {/* Item List */}
                  <div className="space-y-3">
                    {storeItems.map(item => (
                      <div key={item.productId} className="flex gap-3">
                        <img src={item.imageUrl} alt={item.productName} className="w-12 h-12 rounded-lg object-contain bg-masala-muted p-1" />
                        <div className="flex-1">
                          <p className="text-[12px] font-bold text-masala-text line-clamp-1">{item.productName}</p>
                          <p className="text-[10px] text-masala-text-muted">{item.weight}</p>
                          <div className="flex items-center gap-4 mt-1">
                            <div className="flex items-center gap-2">
                              <button 
                                onClick={() => updateQuantity(item.productId, slug, item.quantity - 1)}
                                className="w-5 h-5 rounded bg-masala-muted flex items-center justify-center text-xs hover:bg-masala-border"
                              >
                                −
                              </button>
                              <span className="text-[12px] font-bold">{item.quantity}</span>
                              <button 
                                onClick={() => updateQuantity(item.productId, slug, item.quantity + 1)}
                                className="w-5 h-5 rounded bg-masala-muted flex items-center justify-center text-xs hover:bg-masala-border"
                              >
                                +
                              </button>
                            </div>
                            <span className="text-[12px] font-bold text-masala-primary">€ {(item.price * item.quantity).toFixed(2)}</span>
                          </div>
                        </div>
                        <button onClick={() => removeItem(item.productId, slug)} className="text-masala-text-light hover:text-red-500">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Checkout Button */}
                  <a 
                    href={storeItems[0].url}
                    target="_blank"
                    className="w-full bg-masala-text text-white py-3 rounded-xl font-bold text-[13px] flex items-center justify-center gap-2 hover:bg-masala-primary transition-colors"
                  >
                    CHECKOUT ON {storeItems[0].storeName.toUpperCase()} <ArrowRight className="h-4 w-4" />
                  </a>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

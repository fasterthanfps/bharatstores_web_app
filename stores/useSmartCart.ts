// stores/useSmartCart.ts — Zustand-based global Smart Cart with localStorage persistence

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
  productId: string;
  productName: string;
  imageUrl: string;
  storeSlug: string;
  storeName: string;
  price: number;
  quantity: number;
  weight: string;
  url: string;       // store product URL
  variantId?: string; // Shopify variant ID for pre-filled cart
  storeHandle?: string; // Store's own product slug
  addedAt: string;   // ISO string (Date serialises to string in localStorage)
}

interface SmartCartStore {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'addedAt' | 'quantity'>) => void;
  removeItem: (productId: string, storeSlug: string) => void;
  updateQuantity: (productId: string, storeSlug: string, qty: number) => void;
  clearStore: (storeSlug: string) => void;
  clearAll: () => void;
  // Computed helpers
  getItemsByStore: () => Record<string, CartItem[]>;
  getStoreTotal: (storeSlug: string) => number;
  getTotalItems: () => number;
}

export const useSmartCart = create<SmartCartStore>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (item) =>
        set((state) => {
          const exists = state.items.find(
            (i) => i.productId === item.productId && i.storeSlug === item.storeSlug,
          );
          if (exists) {
            return {
              items: state.items.map((i) =>
                i.productId === item.productId && i.storeSlug === item.storeSlug
                  ? { ...i, quantity: i.quantity + 1 }
                  : i,
              ),
            };
          }
          return {
            items: [
              ...state.items,
              { ...item, quantity: 1, addedAt: new Date().toISOString() },
            ],
          };
        }),

      removeItem: (productId, storeSlug) =>
        set((state) => ({
          items: state.items.filter(
            (i) => !(i.productId === productId && i.storeSlug === storeSlug),
          ),
        })),

      updateQuantity: (productId, storeSlug, qty) =>
        set((state) => ({
          items:
            qty <= 0
              ? state.items.filter(
                  (i) => !(i.productId === productId && i.storeSlug === storeSlug),
                )
              : state.items.map((i) =>
                  i.productId === productId && i.storeSlug === storeSlug
                    ? { ...i, quantity: qty }
                    : i,
                ),
        })),

      clearStore: (storeSlug) =>
        set((state) => ({
          items: state.items.filter((i) => i.storeSlug !== storeSlug),
        })),

      clearAll: () => set({ items: [] }),

      getItemsByStore: () => {
        const { items } = get();
        return items.reduce(
          (acc, item) => {
            if (!acc[item.storeSlug]) acc[item.storeSlug] = [];
            acc[item.storeSlug].push(item);
            return acc;
          },
          {} as Record<string, CartItem[]>,
        );
      },

      getStoreTotal: (storeSlug) => {
        const { items } = get();
        return items
          .filter((i) => i.storeSlug === storeSlug)
          .reduce((sum, i) => sum + i.price * i.quantity, 0);
      },

      getTotalItems: () =>
        get().items.reduce((sum, i) => sum + i.quantity, 0),
    }),
    { name: 'bs-smart-cart' },
  ),
);

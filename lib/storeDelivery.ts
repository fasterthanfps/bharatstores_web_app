// lib/storeDelivery.ts — Delivery info per store (manually maintained)

export interface StoreDeliveryInfo {
  storeSlug: string;
  freeDeliveryThreshold: number | null; // null = never free
  standardDeliveryFee: number;
  minOrderValue: number | null; // null = no minimum
  deliveryDays: string; // e.g. "2-4 days"
  deliveryNote: string; // short human-readable summary
}

export const STORE_DELIVERY: Record<string, StoreDeliveryInfo> = {
  dookan: {
    storeSlug: 'dookan',
    freeDeliveryThreshold: 49,
    standardDeliveryFee: 4.99,
    minOrderValue: null,
    deliveryDays: '2-4',
    deliveryNote: 'Free delivery over €49',
  },
  jamoona: {
    storeSlug: 'jamoona',
    freeDeliveryThreshold: 59,
    standardDeliveryFee: 5.99,
    minOrderValue: 20,
    deliveryDays: '3-5',
    deliveryNote: 'Min. order €20 · Free over €59',
  },
  swadesh: {
    storeSlug: 'swadesh',
    freeDeliveryThreshold: 45,
    standardDeliveryFee: 3.99,
    minOrderValue: null,
    deliveryDays: '2-3',
    deliveryNote: 'Free delivery over €45',
  },
  nammamarkt: {
    storeSlug: 'nammamarkt',
    freeDeliveryThreshold: 50,
    standardDeliveryFee: 4.49,
    minOrderValue: 15,
    deliveryDays: '2-4',
    deliveryNote: 'Min. order €15 · Free over €50',
  },
  angaadi: {
    storeSlug: 'angaadi',
    freeDeliveryThreshold: 55,
    standardDeliveryFee: 5.49,
    minOrderValue: null,
    deliveryDays: '3-5',
    deliveryNote: 'Free delivery over €55',
  },
  littleindia: {
    storeSlug: 'littleindia',
    freeDeliveryThreshold: 40,
    standardDeliveryFee: 3.99,
    minOrderValue: null,
    deliveryDays: '2-3',
    deliveryNote: 'Free delivery over €40',
  },
  spicevillage: {
    storeSlug: 'spicevillage',
    freeDeliveryThreshold: 50,
    standardDeliveryFee: 4.99,
    minOrderValue: null,
    deliveryDays: '3-5',
    deliveryNote: 'Free delivery over €50',
  },
  grocera: {
    storeSlug: 'grocera',
    freeDeliveryThreshold: 35,
    standardDeliveryFee: 2.99,
    minOrderValue: null,
    deliveryDays: '1-3',
    deliveryNote: 'Free delivery over €35',
  },
};

/** Lookup by store slug (tolerates spaces, mixed case). */
export function getDeliveryInfo(storeSlug: string): StoreDeliveryInfo | null {
  const key = storeSlug.toLowerCase().replace(/\s+/g, '');
  return STORE_DELIVERY[key] ?? null;
}

/** Calculate effective price given a cart total (used for Smart Cart). */
export function calculateEffectivePrice(
  productPrice: number,
  cartTotal: number,
  delivery: StoreDeliveryInfo,
): { deliveryFee: number; totalPrice: number; isFreeDelivery: boolean } {
  const isFreeDelivery =
    delivery.freeDeliveryThreshold !== null &&
    cartTotal >= delivery.freeDeliveryThreshold;
  const deliveryFee = isFreeDelivery ? 0 : delivery.standardDeliveryFee;
  return {
    deliveryFee,
    totalPrice: productPrice + deliveryFee,
    isFreeDelivery,
  };
}

# BharatStores.eu — Smart Platform Upgrade Prompts (Session 3)
> Client-requested advanced features. Copy-paste ready for your AI coding agent.

---

## CONTEXT (include in every prompt)

```
BharatStores.eu — Indian grocery price comparison for Indians in Germany/Europe.
Next.js 14 App Router, TypeScript, Tailwind CSS, Prisma ORM.
Stores: Dookan, Jamoona, Swadesh, Namma Markt, Angaadi, Little India, Spice Village, Grocera.
Each store is a separate e-commerce site (Shopify-based mostly).
Goal: Become the smartest, fastest Indian grocery platform in Europe.
Previously built: UTM redirect tracking, filter system, search scoring, i18n EN/DE.
```

---

## PROMPT 1 — EN/DE Language Toggle Moved Next to Logo

```
[CONTEXT above]

Move the EN | DE language toggle so it sits immediately to the right of the 
"BharatStores .eu" logo — NOT at the far right of the header.

Current header order: [Logo] .............. [Blog] [Alerts] [Account] [EN|DE]
New header order:     [Logo] [EN|DE] .... [Blog] [Alerts] [Account]

IMPLEMENTATION:

In components/layout/Header.tsx:

1. Move the <LanguageToggle /> component to be the second child after <Logo />, 
   in the same flex row, with only 12px gap between them (gap-3).

2. Resize the toggle to be compact — it should not compete with the logo:
   - Pill width: 72px total (36px per option)
   - Height: 28px
   - Font: 11px font-black uppercase tracking-wide
   - Border: 1.5px solid masala-border
   - Active side: masala-primary bg, white text, rounded-full inside
   - Inactive side: transparent bg, masala-text-muted text
   - No shadow on this size variant

3. The LanguageToggle component (components/ui/LanguageToggle.tsx):

```typescript
'use client';
import { useLanguage } from '@/contexts/LanguageContext';

export default function LanguageToggle({ size = 'default' }: { size?: 'compact' | 'default' }) {
  const { lang, setLang } = useLanguage();
  
  const isCompact = size === 'compact';
  
  return (
    <div className={`flex items-center rounded-full border border-masala-border bg-white p-0.5 ${
      isCompact ? 'h-7 w-[68px]' : 'h-9 w-[88px]'
    }`}>
      {(['en', 'de'] as const).map(l => (
        <button
          key={l}
          onClick={() => setLang(l)}
          className={`flex-1 rounded-full transition-all font-black uppercase tracking-wide ${
            isCompact ? 'text-[10px] h-5' : 'text-xs h-7'
          } ${
            lang === l 
              ? 'bg-masala-primary text-white shadow-sm' 
              : 'text-masala-text-muted hover:text-masala-text'
          }`}
        >
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
```

4. In the header JSX structure:
```typescript
<header className="sticky top-0 z-50 bg-white border-b border-masala-border h-16">
  <div className="max-w-7xl mx-auto px-4 h-full flex items-center gap-3">
    
    {/* Logo + Language Toggle — left group */}
    <div className="flex items-center gap-3 flex-shrink-0">
      <Logo />
      <LanguageToggle size="compact" />
    </div>

    {/* Search bar — center, grows */}
    <div className="flex-1 max-w-2xl mx-auto">
      <SearchBar size="header" />
    </div>

    {/* Nav links — right */}
    <nav className="hidden md:flex items-center gap-6">
      <NavLink href="/blog">{t('nav.blog')}</NavLink>
      <NavLink href="/alerts">{t('nav.priceAlert')}</NavLink>
      <NavLink href="/account">{t('nav.account')}</NavLink>
    </nav>

    {/* Mobile hamburger */}
    <MobileMenuButton className="md:hidden" />
  </div>
</header>
```

Output: components/layout/Header.tsx, components/ui/LanguageToggle.tsx
```

---

## PROMPT 2 — Real Live Price Cards on Homepage (Not Mock Data)

```
[CONTEXT above]

The homepage hero section shows a "LIVE PRICES" card widget with hardcoded/fake 
product prices. Make it real — fetched from the database on every page load.

─────────────────────────────────────────────
STEP 1: Server-side data fetching for LivePricesCard
─────────────────────────────────────────────
In app/page.tsx (server component), fetch real featured products:

```typescript
// lib/featured.ts
import { prisma } from './prisma';

export interface FeaturedProduct {
  id: string;
  name: string;
  category: string;
  weight: string;
  imageUrl: string;
  emoji: string;
  stores: {
    storeSlug: string;
    price: number;
    isBest: boolean;
    inStock: boolean;
    url: string;
  }[];
  bestPrice: number;
  bestStore: string;
}

// These are the 4 "pinned" products shown on homepage
const FEATURED_PRODUCT_SLUGS = [
  'basmati-rice-5kg',
  'amul-ghee-500g', 
  'mdh-masala-100g',
  'toor-dal-1kg',
];

export async function getFeaturedProducts(): Promise<FeaturedProduct[]> {
  const products = await prisma.product.findMany({
    where: { slug: { in: FEATURED_PRODUCT_SLUGS } },
    include: {
      prices: {
        where: { inStock: true },
        orderBy: { price: 'asc' },
        take: 3, // show top 3 stores
        select: {
          storeSlug: true,
          price: true,
          inStock: true,
          url: true,
        }
      }
    }
  });

  return products.map(p => ({
    id: p.id,
    name: p.name,
    category: p.category,
    weight: p.weight,
    imageUrl: p.imageUrl,
    emoji: getCategoryEmoji(p.category),
    stores: p.prices.map((pr, i) => ({ ...pr, isBest: i === 0 })),
    bestPrice: p.prices[0]?.price ?? 0,
    bestStore: p.prices[0]?.storeSlug ?? '',
  }));
}

function getCategoryEmoji(category: string): string {
  const map: Record<string, string> = {
    rice: '🌾', dairy: '🧈', spices: '🌶️', 
    pulses: '🫘', flour: '🌾', tea: '🍵',
  };
  return map[category.toLowerCase()] ?? '🛒';
}
```

In app/page.tsx:
```typescript
import { getFeaturedProducts } from '@/lib/featured';

export default async function HomePage() {
  const featuredProducts = await getFeaturedProducts();
  
  return (
    <>
      <HeroSection featuredProducts={featuredProducts} />
      {/* rest of page */}
    </>
  );
}
```

─────────────────────────────────────────────
STEP 2: LivePricesCard — clickable products + real data
─────────────────────────────────────────────
Update components/ui/LivePricesCard.tsx to:

1. Accept real `products: FeaturedProduct[]` prop (not hardcoded)
2. Make each store row clickable — clicks go through /api/redirect (UTM tracked)
3. Add "last updated" timestamp per product
4. Show "Loading..." shimmer if any price is stale (>4h old)
5. Product name → links to /product/[slug] page

```typescript
'use client';
import { buildRedirectUrl } from '@/lib/utm';
import { getStoreConfig } from '@/lib/stores';
import type { FeaturedProduct } from '@/lib/featured';

export default function LivePricesCard({ products }: { products: FeaturedProduct[] }) {
  return (
    <div className="bg-white rounded-3xl shadow-2xl p-5 max-w-[440px] border border-masala-border">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <span className="text-[11px] font-black uppercase tracking-[0.2em] text-masala-text-muted">
            Live Prices
          </span>
        </div>
        <div className="flex items-center gap-1 text-[11px] text-masala-text-muted">
          {'★★★★★'.split('').map((s, i) => (
            <span key={i} className="text-masala-primary text-sm">★</span>
          ))}
          <span className="ml-1 font-bold">4.9/5</span>
        </div>
      </div>

      {/* 2x2 Product Grid */}
      <div className="grid grid-cols-2 gap-3">
        {products.map(product => (
          <div key={product.id} className="border border-masala-border rounded-2xl p-3 hover:shadow-md transition-all">
            
            {/* Product header */}
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">{product.emoji}</span>
              <div>
                <a 
                  href={`/product/${product.id}`}
                  className="text-[13px] font-semibold text-masala-text hover:text-masala-primary transition-colors line-clamp-1"
                >
                  {product.name}
                </a>
                <p className="text-[10px] text-masala-text-muted">
                  {product.category} · {product.weight}
                </p>
              </div>
            </div>

            {/* Best price */}
            <p className="text-lg font-bold text-masala-primary mb-2">
              € {product.bestPrice.toFixed(2)}
            </p>

            {/* Store rows — each clickable */}
            <div className="space-y-1.5">
              {product.stores.map(store => {
                const config = getStoreConfig(store.storeSlug);
                const redirectUrl = buildRedirectUrl({
                  productId: product.id,
                  storeSlug: store.storeSlug,
                });
                return (
                  <a
                    key={store.storeSlug}
                    href={redirectUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 hover:bg-masala-muted rounded-lg px-1 py-0.5 transition-colors group"
                  >
                    {/* Store initials badge */}
                    <span 
                      className="w-5 h-5 rounded-md text-[9px] font-black flex items-center justify-center flex-shrink-0"
                      style={{ background: config.color, color: config.textColor }}
                    >
                      {config.initials}
                    </span>
                    <span className="text-[11px] text-masala-text-muted flex-1 group-hover:text-masala-text">
                      {config.label}
                    </span>
                    {store.isBest && (
                      <span className="text-[9px] font-black text-success bg-success-bg px-1.5 py-0.5 rounded-full">
                        BEST
                      </span>
                    )}
                    <span className="text-[12px] font-bold text-masala-text ml-auto">
                      € {store.price.toFixed(2)}
                    </span>
                  </a>
                );
              })}
            </div>

            {/* Add to compare */}
            <button className="w-full mt-2 text-[10px] font-bold text-masala-text-muted 
              border border-masala-border hover:border-masala-primary hover:text-masala-primary 
              rounded-xl py-1.5 transition-all">
              + ADD TO COMPARE
            </button>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between mt-4 pt-3 border-t border-masala-border">
        <a href="/search" className="text-[12px] font-bold text-masala-primary hover:underline">
          Browse all products ↗
        </a>
        <span className="text-[11px] text-masala-text-muted">Select 2–3 to compare</span>
      </div>
    </div>
  );
}
```

Output: lib/featured.ts (new), app/page.tsx (update), components/ui/LivePricesCard.tsx (rewrite)
```

---

## PROMPT 3 — Fix: German Footer Text on English Page

```
[CONTEXT above]

The English version of the homepage is showing German text in the footer 
section ("Dein ultimativer Preisvergleich..." paragraph under the logo).

This is a translation bug — the footer is not reading from the language context.

─────────────────────────────────────────────
FIX: Make footer fully translation-aware
─────────────────────────────────────────────

1. Add to lib/i18n/en.ts:
```typescript
export const en = {
  // ... existing keys ...
  footer: {
    tagline: "Your ultimate price comparison for Indian groceries in Germany. We help you find the best deals on your favorite products.",
    partnerShops: "Partner Shops",
    legal: "Legal",
    imprint: "Imprint",
    privacy: "Privacy Policy",
    designedWith: "Designed with ♥ for the Desi community in",
  }
}
```

2. Add to lib/i18n/de.ts:
```typescript
export const de = {
  // ... existing keys ...
  footer: {
    tagline: "Dein ultimativer Preisvergleich für indische Lebensmittel in Deutschland. Wir helfen dir, die besten Angebote für deine Lieblingsprodukte zu finden.",
    partnerShops: "Partner-Shops",
    legal: "Rechtliches",
    imprint: "Impressum",
    privacy: "Datenschutz",
    designedWith: "Designed mit ♥ für die Desi-Community in",
  }
}
```

3. In components/layout/Footer.tsx — replace ALL hardcoded German strings:
```typescript
'use client';
import { useLanguage } from '@/contexts/LanguageContext';

export default function Footer() {
  const { t } = useLanguage();
  
  return (
    <footer className="bg-masala-bg border-t border-masala-border py-12">
      <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Brand column */}
        <div>
          <Logo />
          <p className="mt-3 text-sm text-masala-text-muted leading-relaxed max-w-xs">
            {t('footer.tagline')}  {/* ← this was hardcoded in German before */}
          </p>
        </div>

        {/* Partner Shops */}
        <div>
          <h4 className="font-black uppercase tracking-widest text-xs text-masala-text-muted mb-4">
            {t('footer.partnerShops')}
          </h4>
          <ul className="space-y-2 text-sm">
            {['Grocera','Jamoona','Little India','Namma Markt','Dookan','Swadesh'].map(store => (
              <li key={store}>
                <a href="#" className="text-masala-text hover:text-masala-primary transition-colors">
                  {store}
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* Legal */}
        <div>
          <h4 className="font-black uppercase tracking-widest text-xs text-masala-text-muted mb-4">
            {t('footer.legal')}
          </h4>
          <ul className="space-y-2 text-sm">
            <li><a href="/impressum" className="text-masala-text hover:text-masala-primary transition-colors">{t('footer.imprint')}</a></li>
            <li><a href="/datenschutz" className="text-masala-text hover:text-masala-primary transition-colors">{t('footer.privacy')}</a></li>
          </ul>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 mt-8 pt-6 border-t border-masala-border flex items-center justify-between text-xs text-masala-text-muted">
        <span>© 2026 BHARATSTORES.EU</span>
        <span>{t('footer.designedWith')} 🇩🇪</span>
      </div>
    </footer>
  );
}
```

Output: lib/i18n/en.ts, lib/i18n/de.ts, components/layout/Footer.tsx
```

---

## PROMPT 4 — Deals Page: Category-Based Deal Browser

```
[CONTEXT above]

Build a /deals page where users can browse deals filtered by category.
A "deal" = any product whose current price is below its 7-day average (i.e. on sale).

─────────────────────────────────────────────
PAGE STRUCTURE (app/deals/page.tsx)
─────────────────────────────────────────────

URL pattern: /deals?category=dairy&sort=discount&store=dookan

HEADER:
- Title: "🏷️ Best Deals Today" (Fraunces, 40px)
- Subtitle: "X deals found — updated every 2 hours"
- Last updated timestamp

CATEGORY TABS (horizontal scroll, sticky below header):
All | 🌾 Atta & Rice | 🫘 Dal & Pulses | 🧈 Dairy & Ghee | 🌶️ Masala & Spices | 
🍵 Tea & Coffee | 🍘 Snacks | 🧴 Personal Care | 🥗 Frozen Food | 🏠 Home Essentials

Active tab: masala-primary bg, white text, pill shape
Others: white bg, masala-border, hover state

SORT OPTIONS:
- Biggest Discount % | Lowest Price | Newest | Expiring Soon

DEALS GRID (same 4-col grid as search results):
Each DealCard has an extra element compared to regular ProductCard:
  - RED DISCOUNT BADGE top-right: "-23%" in masala-primary bold
  - SAVINGS LINE below price: "Save € 0.80 vs avg" in success green
  - DEAL TIMER (optional): "Valid until scraped data expires — refresh in 2h"

─────────────────────────────────────────────
DATA: lib/deals.ts
─────────────────────────────────────────────

```typescript
export interface Deal {
  productId: string;
  productName: string;
  imageUrl: string;
  category: string;
  weight: string;
  storeSlug: string;
  currentPrice: number;
  avgPrice7d: number;         // 7-day rolling average
  discountPercent: number;    // ((avg - current) / avg) * 100
  savingsAmount: number;      // avg - current
  pricePerKg?: number;
  inStock: boolean;
  url: string;
  lastUpdated: Date;
}

export async function getDeals(opts: {
  category?: string;
  sort?: 'discount' | 'price' | 'newest';
  store?: string;
  limit?: number;
}): Promise<{ deals: Deal[]; total: number }> {
  
  const where = {
    // Only show products that are cheaper than their 7-day average
    discountPercent: { gt: 3 }, // minimum 3% off to qualify as a deal
    inStock: true,
    ...(opts.category ? { category: opts.category } : {}),
    ...(opts.store ? { storeSlug: opts.store } : {}),
  };

  const orderBy = {
    discount: { discountPercent: 'desc' },
    price: { currentPrice: 'asc' },
    newest: { lastUpdated: 'desc' },
  }[opts.sort ?? 'discount'];

  // This requires a materialized view or scheduled job that calculates
  // 7-day averages and stores them in a ProductDeal table
  const deals = await prisma.productDeal.findMany({
    where,
    orderBy,
    take: opts.limit ?? 48,
  });

  return { deals, total: await prisma.productDeal.count({ where }) };
}
```

Add to Prisma schema:
```prisma
model ProductDeal {
  id              String   @id @default(cuid())
  productId       String
  productName     String
  imageUrl        String
  category        String
  weight          String
  storeSlug       String
  currentPrice    Float
  avgPrice7d      Float
  discountPercent Float
  savingsAmount   Float
  pricePerKg      Float?
  inStock         Boolean  @default(true)
  url             String
  lastUpdated     DateTime @default(now())

  @@index([category])
  @@index([storeSlug])
  @@index([discountPercent])
}
```

Add a cron job (app/api/cron/deals/route.ts) that:
1. Fetches all current prices from StorePrice table
2. Calculates 7-day average from PriceHistory table
3. Upserts ProductDeal rows where current < average by >3%
4. Deletes deals where product is now out of stock or price went back up
Run every 2 hours via Vercel Cron: schedule "0 */2 * * *"

Output: app/deals/page.tsx, lib/deals.ts, app/api/cron/deals/route.ts, prisma/schema.prisma update
```

---

## PROMPT 5 — Price Comparison Card: Minimum Order + Delivery Details

```
[CONTEXT above]

The price comparison cards (on search results and compare page) need to show 
delivery cost and minimum order value, so users can make smarter buying decisions.

A product that costs €2.99 from Dookan might actually be cheaper total than 
€2.50 from Jamoona if Jamoona charges €5.99 delivery vs Dookan's free delivery.

─────────────────────────────────────────────
STEP 1: Store delivery config (lib/storeDelivery.ts)
─────────────────────────────────────────────

```typescript
export interface StoreDeliveryInfo {
  storeSlug: string;
  freeDeliveryThreshold: number | null;  // null = never free
  standardDeliveryFee: number;
  minOrderValue: number | null;          // null = no minimum
  deliveryDays: string;                  // e.g. "2-4 days"
  deliveryNote?: string;                 // e.g. "Free over €49"
}

// Keep this updated manually or via scraper
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

export function getDeliveryInfo(storeSlug: string): StoreDeliveryInfo | null {
  return STORE_DELIVERY[storeSlug.toLowerCase()] ?? null;
}

// Calculate effective total price including estimated delivery
export function calculateEffectivePrice(
  productPrice: number,
  cartTotal: number, // user's estimated cart total
  delivery: StoreDeliveryInfo
): { deliveryFee: number; totalPrice: number; isFreeDelivery: boolean } {
  const isFreeDelivery = delivery.freeDeliveryThreshold !== null 
    && cartTotal >= delivery.freeDeliveryThreshold;
  const deliveryFee = isFreeDelivery ? 0 : delivery.standardDeliveryFee;
  return {
    deliveryFee,
    totalPrice: productPrice + deliveryFee,
    isFreeDelivery,
  };
}
```

─────────────────────────────────────────────
STEP 2: Update ProductCard to show delivery info
─────────────────────────────────────────────
In components/ui/ProductCard.tsx, add a delivery info section:

```typescript
import { getDeliveryInfo } from '@/lib/storeDelivery';

// Inside the card, below the price row:
const delivery = getDeliveryInfo(props.storeSlug);

{delivery && (
  <div className="mt-1.5 mb-2">
    <div className="flex items-center gap-1.5 text-[11px]">
      <span className="text-masala-text-muted">🚚</span>
      <span className={delivery.freeDeliveryThreshold 
        ? 'text-success font-medium' 
        : 'text-masala-text-muted'
      }>
        {delivery.deliveryNote}
      </span>
    </div>
    {delivery.minOrderValue && (
      <div className="flex items-center gap-1.5 text-[11px] mt-0.5">
        <span>🛒</span>
        <span className="text-amber-600 font-medium">
          Min. order € {delivery.minOrderValue.toFixed(2)}
        </span>
      </div>
    )}
    <div className="text-[10px] text-masala-text-muted mt-0.5">
      📅 Delivery in {delivery.deliveryDays} days
    </div>
  </div>
)}
```

─────────────────────────────────────────────
STEP 3: "See More Details" expandable panel
─────────────────────────────────────────────
Add a collapsible "More details" section to each ProductCard:

```typescript
const [expanded, setExpanded] = useState(false);

{/* After the main card content */}
<button 
  onClick={() => setExpanded(!expanded)}
  className="w-full text-[11px] text-masala-text-muted hover:text-masala-primary 
    py-1.5 border-t border-masala-border mt-2 transition-colors flex items-center justify-center gap-1"
>
  {expanded ? '▲ Less details' : '▼ More details'}
</button>

{expanded && (
  <div className="mt-2 pt-2 border-t border-masala-border space-y-1.5 text-[11px]">
    <div className="flex justify-between">
      <span className="text-masala-text-muted">Standard delivery</span>
      <span className="font-bold">€ {delivery?.standardDeliveryFee.toFixed(2) ?? '—'}</span>
    </div>
    <div className="flex justify-between">
      <span className="text-masala-text-muted">Free delivery from</span>
      <span className="font-bold text-success">
        {delivery?.freeDeliveryThreshold ? `€ ${delivery.freeDeliveryThreshold}` : 'N/A'}
      </span>
    </div>
    <div className="flex justify-between">
      <span className="text-masala-text-muted">Min. order</span>
      <span className="font-bold">
        {delivery?.minOrderValue ? `€ ${delivery.minOrderValue}` : 'None'}
      </span>
    </div>
    <div className="flex justify-between">
      <span className="text-masala-text-muted">Est. delivery</span>
      <span className="font-bold">{delivery?.deliveryDays ?? '—'} days</span>
    </div>
    <div className="flex justify-between">
      <span className="text-masala-text-muted">Price per kg</span>
      <span className="font-bold">
        {props.pricePerKg ? `€ ${props.pricePerKg.toFixed(2)}` : '—'}
      </span>
    </div>
  </div>
)}
```

Output: lib/storeDelivery.ts (new), components/ui/ProductCard.tsx (update)
```

---

## PROMPT 6 — Smart Multi-Product Comparison + Add to Cart + Pre-filled Checkout

```
[CONTEXT above]

This is the flagship "smartest platform" feature. Three interconnected capabilities:

1. Compare multiple products side-by-side including delivery costs
2. Add products to a BharatStores "Smart Cart" that tracks items across stores
3. One-click redirect to seller site with items pre-added to their cart

─────────────────────────────────────────────
PART A: Smart Cart State (stores/useSmartCart.ts)
─────────────────────────────────────────────
Using Zustand for global cart state:
npm install zustand

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
  productId: string;
  productName: string;
  imageUrl: string;
  storeSlug: string;
  price: number;
  quantity: number;
  weight: string;
  url: string; // store product URL
  addedAt: Date;
}

interface SmartCartStore {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'addedAt' | 'quantity'>) => void;
  removeItem: (productId: string, storeSlug: string) => void;
  updateQuantity: (productId: string, storeSlug: string, qty: number) => void;
  clearStore: (storeSlug: string) => void;
  clearAll: () => void;
  
  // Computed
  getItemsByStore: () => Record<string, CartItem[]>;
  getStoreTotal: (storeSlug: string) => number;
  getTotalItems: () => number;
}

export const useSmartCart = create<SmartCartStore>()(
  persist(
    (set, get) => ({
      items: [],
      
      addItem: (item) => set(state => {
        const exists = state.items.find(
          i => i.productId === item.productId && i.storeSlug === item.storeSlug
        );
        if (exists) {
          return {
            items: state.items.map(i =>
              i.productId === item.productId && i.storeSlug === item.storeSlug
                ? { ...i, quantity: i.quantity + 1 }
                : i
            )
          };
        }
        return { items: [...state.items, { ...item, quantity: 1, addedAt: new Date() }] };
      }),
      
      removeItem: (productId, storeSlug) => set(state => ({
        items: state.items.filter(i => !(i.productId === productId && i.storeSlug === storeSlug))
      })),
      
      updateQuantity: (productId, storeSlug, qty) => set(state => ({
        items: qty <= 0 
          ? state.items.filter(i => !(i.productId === productId && i.storeSlug === storeSlug))
          : state.items.map(i =>
              i.productId === productId && i.storeSlug === storeSlug ? { ...i, quantity: qty } : i
            )
      })),
      
      clearStore: (storeSlug) => set(state => ({
        items: state.items.filter(i => i.storeSlug !== storeSlug)
      })),
      
      clearAll: () => set({ items: [] }),
      
      getItemsByStore: () => {
        const { items } = get();
        return items.reduce((acc, item) => {
          if (!acc[item.storeSlug]) acc[item.storeSlug] = [];
          acc[item.storeSlug].push(item);
          return acc;
        }, {} as Record<string, CartItem[]>);
      },
      
      getStoreTotal: (storeSlug) => {
        const { items } = get();
        return items
          .filter(i => i.storeSlug === storeSlug)
          .reduce((sum, i) => sum + i.price * i.quantity, 0);
      },
      
      getTotalItems: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
    }),
    { name: 'bs-smart-cart' }
  )
);
```

─────────────────────────────────────────────
PART B: Add to Cart button in ProductCard
─────────────────────────────────────────────

```typescript
'use client';
import { useSmartCart } from '@/stores/useSmartCart';

// In ProductCard:
const { addItem, items } = useSmartCart();
const isInCart = items.some(i => i.productId === props.productId && i.storeSlug === props.storeSlug);
const cartItem = items.find(i => i.productId === props.productId && i.storeSlug === props.storeSlug);

return (
  <>
    {/* Buy Now — direct to store with UTM */}
    <a href={redirectUrl} target="_blank" rel="noopener noreferrer"
      className="w-full h-10 bg-masala-primary text-white rounded-xl text-sm font-bold 
        flex items-center justify-center gap-2 hover:bg-masala-secondary transition-colors">
      🛒 Buy Now
    </a>

    {/* Add to Smart Cart */}
    {!isInCart ? (
      <button
        onClick={() => addItem({
          productId: props.productId,
          productName: props.name,
          imageUrl: props.imageUrl,
          storeSlug: props.storeSlug,
          price: props.price,
          weight: props.weight,
          url: props.storeUrl,
        })}
        className="w-full h-9 mt-1.5 border-2 border-masala-border rounded-xl text-xs font-bold 
          text-masala-text hover:border-masala-primary hover:text-masala-primary 
          hover:bg-masala-primary/5 transition-all flex items-center justify-center gap-1.5"
      >
        + Add to Smart Cart
      </button>
    ) : (
      <div className="flex items-center gap-2 mt-1.5 border-2 border-masala-primary rounded-xl p-1.5">
        <button onClick={() => updateQuantity(props.productId, props.storeSlug, (cartItem?.quantity ?? 1) - 1)}
          className="w-7 h-7 rounded-lg bg-masala-primary text-white text-lg font-bold flex items-center justify-center">
          −
        </button>
        <span className="flex-1 text-center text-sm font-bold">{cartItem?.quantity}</span>
        <button onClick={() => updateQuantity(props.productId, props.storeSlug, (cartItem?.quantity ?? 0) + 1)}
          className="w-7 h-7 rounded-lg bg-masala-primary text-white text-lg font-bold flex items-center justify-center">
          +
        </button>
      </div>
    )}
  </>
);
```

─────────────────────────────────────────────
PART C: Smart Cart Panel (components/ui/SmartCartPanel.tsx)
─────────────────────────────────────────────
A slide-in panel from the right showing all carted items grouped by store.
Opened by clicking the cart icon in the header.

LAYOUT:
- Fixed right panel, 380px wide, full height, white bg, shadow-2xl
- Header: "Smart Cart 🛒" + item count + X button
- Grouped by store — each store is a collapsible section:
  - Store header: store name + store logo + subtotal
  - Item rows: image + name + qty control + price
  - DELIVERY INFO row: "🚚 Add €X.XX more for free delivery" (progress bar)
  - "CHECKOUT AT [STORE]" button → pre-filled cart redirect

CHECKOUT WITH PRE-FILLED CART:
```typescript
// lib/cartRedirect.ts
import { STORE_DELIVERY } from './storeDelivery';
import { buildUTMUrl } from './utm';

export interface CartRedirectResult {
  url: string | null;
  method: 'shopify_cart' | 'query_params' | 'manual';
  note?: string;
}

// Shopify stores (Dookan, Jamoona, Swadesh, Namma Markt, Grocera, etc.) 
// support pre-filled cart via /cart/add or /cart URLs
export function buildCartUrl(storeSlug: string, items: { variantId?: string; handle: string; qty: number }[]): CartRedirectResult {
  
  const storeBaseUrls: Record<string, string> = {
    dookan: 'https://dookan.de',
    jamoona: 'https://jamoona.de',
    swadesh: 'https://swadesh.de',
    nammamarkt: 'https://nammamarkt.com',
    angaadi: 'https://angaadi.de',
    littleindia: 'https://little-india.de',
    spicevillage: 'https://spicevillage.eu',
    grocera: 'https://grocera.de',
  };

  const baseUrl = storeBaseUrls[storeSlug];
  if (!baseUrl) return { url: null, method: 'manual' };

  // Shopify cart URL format: /cart/VARIANT_ID:QTY,VARIANT_ID:QTY
  // If we have variant IDs (from scraper), build the direct cart URL
  const itemsWithVariants = items.filter(i => i.variantId);
  
  if (itemsWithVariants.length > 0) {
    const cartItems = itemsWithVariants.map(i => `${i.variantId}:${i.qty}`).join(',');
    const cartUrl = `${baseUrl}/cart/${cartItems}`;
    return {
      url: buildUTMUrl(cartUrl, {
        source: storeSlug,
        medium: 'cart_redirect',
        campaign: 'smart_cart',
        content: items.map(i => i.handle).join('_'),
      }),
      method: 'shopify_cart',
    };
  }

  // Fallback: redirect to store search for first item
  // The user still has to add items manually, but at least they land on the right page
  const searchUrl = `${baseUrl}/search?q=${encodeURIComponent(items[0].handle)}`;
  return {
    url: buildUTMUrl(searchUrl, {
      source: storeSlug,
      medium: 'cart_redirect',
      campaign: 'smart_cart',
      content: items[0].handle,
    }),
    method: 'query_params',
    note: 'Direct cart add unavailable for this store — searching for first item',
  };
}
```

NOTE FOR AGENT: Add `variantId` field to the StorePrice model in Prisma schema. 
Update scrapers to capture Shopify variant IDs from product pages — 
they're in the page source as `"variants":[{"id":12345678...}]`.
Store as String? in the StorePrice model. This enables true pre-filled cart.

SMART CART PANEL JSX STRUCTURE:

```typescript
export default function SmartCartPanel({ onClose }: { onClose: () => void }) {
  const { getItemsByStore, getStoreTotal, clearStore } = useSmartCart();
  const itemsByStore = getItemsByStore();
  const stores = Object.keys(itemsByStore);

  return (
    <div className="fixed right-0 top-0 h-full w-[380px] bg-white shadow-2xl z-[60] flex flex-col">
      
      {/* Header */}
      <div className="flex items-center justify-between p-5 border-b border-masala-border">
        <h2 className="text-lg font-black">Smart Cart 🛒</h2>
        <button onClick={onClose} className="text-masala-text-muted hover:text-masala-text">✕</button>
      </div>

      {/* Cart body — scrollable */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {stores.length === 0 ? (
          <div className="text-center py-12 text-masala-text-muted">
            <p className="text-4xl mb-3">🛒</p>
            <p className="font-semibold">Your Smart Cart is empty</p>
            <p className="text-sm mt-1">Add products from search results</p>
          </div>
        ) : (
          stores.map(storeSlug => {
            const storeItems = itemsByStore[storeSlug];
            const storeTotal = getStoreTotal(storeSlug);
            const delivery = getDeliveryInfo(storeSlug);
            const config = getStoreConfig(storeSlug);
            const freeDeliveryGap = delivery?.freeDeliveryThreshold 
              ? Math.max(0, delivery.freeDeliveryThreshold - storeTotal)
              : null;
            const cartResult = buildCartUrl(storeSlug, storeItems.map(i => ({
              variantId: i.variantId,
              handle: i.productId,
              qty: i.quantity,
            })));

            return (
              <div key={storeSlug} className="border border-masala-border rounded-2xl overflow-hidden">
                
                {/* Store header */}
                <div className="flex items-center justify-between p-3 bg-masala-muted">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg text-[11px] font-black flex items-center justify-center"
                      style={{ background: config.color, color: config.textColor }}>
                      {config.initials}
                    </span>
                    <span className="font-bold text-sm">{config.label}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-masala-primary">
                      € {storeTotal.toFixed(2)}
                    </span>
                    <button onClick={() => clearStore(storeSlug)}
                      className="text-xs text-masala-text-muted hover:text-red-500">
                      Remove all
                    </button>
                  </div>
                </div>

                {/* Items */}
                <div className="divide-y divide-masala-border">
                  {storeItems.map(item => (
                    <CartItemRow key={item.productId} item={item} />
                  ))}
                </div>

                {/* Delivery progress */}
                {freeDeliveryGap !== null && freeDeliveryGap > 0 && (
                  <div className="p-3 bg-amber-50 border-t border-amber-100">
                    <p className="text-xs text-amber-700 font-medium mb-1.5">
                      🚚 Add €{freeDeliveryGap.toFixed(2)} more for free delivery!
                    </p>
                    <div className="h-1.5 bg-amber-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-amber-500 rounded-full transition-all"
                        style={{ width: `${Math.min(100, (storeTotal / (delivery?.freeDeliveryThreshold ?? 1)) * 100)}%` }}
                      />
                    </div>
                  </div>
                )}
                {freeDeliveryGap === 0 && (
                  <div className="p-3 bg-success-bg border-t border-success/20">
                    <p className="text-xs text-success font-bold">✅ Free delivery unlocked!</p>
                  </div>
                )}

                {/* Checkout button */}
                <div className="p-3 border-t border-masala-border">
                  <a
                    href={cartResult.url ?? '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full h-11 bg-masala-primary text-white rounded-xl font-bold text-sm 
                      flex items-center justify-center gap-2 hover:bg-masala-secondary transition-colors"
                    onClick={() => logCartCheckout(storeSlug, storeItems)}
                  >
                    {cartResult.method === 'shopify_cart' 
                      ? `🛒 Checkout at ${config.label} →`
                      : `Visit ${config.label} →`
                    }
                  </a>
                  {cartResult.method !== 'shopify_cart' && (
                    <p className="text-[10px] text-masala-text-muted text-center mt-1.5">
                      Items pre-selection not available for this store
                    </p>
                  )}
                  <div className="flex justify-between text-xs mt-2 text-masala-text-muted">
                    <span>Subtotal: € {storeTotal.toFixed(2)}</span>
                    <span>Delivery: {
                      freeDeliveryGap === 0 ? 'FREE' : `€ ${delivery?.standardDeliveryFee.toFixed(2)}`
                    }</span>
                    <span className="font-bold text-masala-text">
                      Total: € {(storeTotal + (freeDeliveryGap === 0 ? 0 : delivery?.standardDeliveryFee ?? 0)).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
```

─────────────────────────────────────────────
PART D: Cart icon in Header with item count badge
─────────────────────────────────────────────

```typescript
// In Header.tsx — add cart icon button
const { getTotalItems } = useSmartCart();
const totalItems = getTotalItems();

<button 
  onClick={() => setCartOpen(true)}
  className="relative flex items-center gap-1.5 text-masala-text hover:text-masala-primary transition-colors"
>
  🛒
  {totalItems > 0 && (
    <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-masala-primary text-white 
      text-[10px] font-black flex items-center justify-center">
      {totalItems > 9 ? '9+' : totalItems}
    </span>
  )}
</button>
```

Output files:
- stores/useSmartCart.ts (new — Zustand)
- lib/cartRedirect.ts (new)
- lib/storeDelivery.ts (from Prompt 5 — extend with variantId note)
- components/ui/SmartCartPanel.tsx (new)
- components/ui/ProductCard.tsx (add Smart Cart button)
- components/layout/Header.tsx (add cart icon)
- prisma/schema.prisma (add variantId to StorePrice)
- npm install zustand
```

---

## IMPLEMENTATION ORDER (client priority sequence)

```
WEEK 1 — Foundation fixes (blockers)
  Day 1: PROMPT 1 (EN/DE toggle next to logo) — 30 min
  Day 1: PROMPT 3 (German footer bug on EN page) — 20 min  
  Day 2: PROMPT 2 (Real live price cards) — 2 hours
  Day 3: PROMPT 5 (Delivery info on cards) — 2 hours

WEEK 2 — Smart features (differentiators)
  Day 1-2: PROMPT 6 PART A+B (Smart Cart state + Add to Cart button)
  Day 3: PROMPT 6 PART C (Smart Cart Panel + checkout redirect)
  Day 4: PROMPT 6 PART D (Cart icon in header)
  Day 5: Test checkout flow on each store

WEEK 3 — Discovery features
  Day 1-2: PROMPT 4 (Deals page with categories)
  Day 3-4: Scraper update — capture Shopify variant IDs
  Day 5: QA pass across all 8 stores
```

---

## KEY ARCHITECTURAL NOTE FOR AGENT

```
The pre-filled cart feature (PROMPT 6) depends on having Shopify variant IDs 
in your database. Most stores are Shopify-based. 

Tell your scraper agent:
"When scraping each product page, extract the Shopify variant ID from the page's 
JSON-LD or from window.ShopifyAnalytics.meta.selectedVariantId or from the 
data-variant-id attribute on the add-to-cart button. Store it as variantId in 
the StorePrice table. The Shopify cart URL format is:
https://storename.com/cart/VARIANT_ID:QUANTITY
Multiple items: /cart/VARIANT1:QTY1,VARIANT2:QTY2"

Without variant IDs, cart redirect falls back to store search page (still useful, 
just not pre-filled). Build the system so it degrades gracefully.
```

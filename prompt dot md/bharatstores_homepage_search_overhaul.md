# BharatStores.eu — Homepage & Search Results Overhaul (Session 4)
> Fixes duplicate products, hero section data, full homepage sections, and mobile layout.

---

## CONTEXT (include in every prompt)

```
BharatStores.eu — Indian grocery price comparison for Indians in Germany/Europe.
Next.js 14 App Router, TypeScript, Tailwind CSS, Prisma ORM, Zustand cart.
Stores: Dookan, Jamoona, Swadesh, Namma Markt, Angaadi, Little India, Spice Village, Grocera.
Current issues seen in screenshots:
- Homepage hero live prices widget shows "Grocery 6g €0.25" (wrong product data)
- A floating white card "Basmati Rice from €2.99" appears orphaned on the right
- Search results show duplicate products (same product from same store listed twice)
- Search result cards need better visual hierarchy
- Homepage sections below hero are missing/incomplete
Color tokens: masala-primary #8B2020, masala-bg #FAF7F2, masala-border #E8E0D4
Fonts: Fraunces (headings), DM Sans (body)
```

---

## PROMPT 1 — Fix: Homepage Hero Section Complete Overhaul

```
[CONTEXT above]

Completely rewrite the hero section of app/page.tsx. Fix the broken live prices 
widget and add a trending products strip. The current hero has two problems:
1. Live prices widget shows wrong product (Grocery 6g €0.25 — scraper data issue)
2. A floating "Basmati Rice from €2.99" card is orphaned to the right with no context

NEW HERO LAYOUT (two-column, desktop):

LEFT COLUMN (50% width):
├── Badge pill: "🛒 ONE SEARCH. EVERY INDIAN STORE."
├── Headline H1: "Save on your" + italic red "Groceries."
├── Subtitle text
├── SearchBar (hero size)
└── Popular search pills row

RIGHT COLUMN (50% width):
└── LivePricesCard (fixed with real data — see Prompt 2)

BELOW HERO (full width, new section):
└── TrendingProductsStrip (see spec below)

─────────────────────────────────────────────
FIX: Remove orphaned floating card
─────────────────────────────────────────────
Delete the standalone white card showing "Basmati Rice from €2.99 / Compare 3-5 stores →"
that appears to the right of the LivePricesCard. This was a debug/placeholder element.
It should not exist as a separate floating element.

─────────────────────────────────────────────
NEW: TrendingProductsStrip component
(components/sections/TrendingProductsStrip.tsx)
─────────────────────────────────────────────
This is a horizontal scroll strip of product cards showing the most-searched 
items right now. Appears immediately below the hero, before categories.

DATA: Create lib/trending.ts
```typescript
// lib/trending.ts
import { prisma } from './prisma';

export interface TrendingProduct {
  id: string;
  name: string;
  imageUrl: string;
  category: string;
  weight: string;
  bestPrice: number;
  bestStore: string;
  storeCount: number;      // how many stores carry it
  searchCount7d: number;   // searches in last 7 days (from SearchEvent table)
  savingsPercent?: number; // % below avg if on deal
}

export async function getTrendingProducts(limit = 10): Promise<TrendingProduct[]> {
  // Join search events with products to get most-searched
  // Fallback to most-clicked if search events are sparse
  const trending = await prisma.$queryRaw<TrendingProduct[]>`
    SELECT 
      p.id,
      p.name,
      p.image_url as "imageUrl",
      p.category,
      p.weight,
      MIN(sp.price) as "bestPrice",
      (SELECT store_slug FROM store_prices WHERE product_id = p.id ORDER BY price ASC LIMIT 1) as "bestStore",
      COUNT(DISTINCT sp.store_slug) as "storeCount",
      COALESCE(se.search_count, 0) as "searchCount7d"
    FROM products p
    JOIN store_prices sp ON sp.product_id = p.id AND sp.in_stock = true
    LEFT JOIN (
      SELECT 
        normalized_query,
        COUNT(*) as search_count
      FROM search_events
      WHERE created_at > NOW() - INTERVAL '7 days'
      GROUP BY normalized_query
    ) se ON se.normalized_query = LOWER(TRIM(p.name))
    GROUP BY p.id, p.name, p.image_url, p.category, p.weight, se.search_count
    ORDER BY se.search_count DESC NULLS LAST, "storeCount" DESC
    LIMIT ${limit}
  `;
  return trending;
}
```

COMPONENT LAYOUT (components/sections/TrendingProductsStrip.tsx):
```typescript
'use client';
import Link from 'next/link';
import type { TrendingProduct } from '@/lib/trending';

export default function TrendingProductsStrip({ products }: { products: TrendingProduct[] }) {
  return (
    <section className="py-8 px-4 max-w-7xl mx-auto">
      
      {/* Section header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <span className="text-xl">🔥</span>
          <h2 className="text-lg font-black uppercase tracking-widest text-masala-text">
            Trending Now
          </h2>
          <span className="text-xs text-masala-text-muted font-medium mt-0.5">
            — Most searched this week
          </span>
        </div>
        <Link href="/search" className="text-sm font-bold text-masala-primary hover:underline hidden sm:block">
          View all →
        </Link>
      </div>

      {/* Horizontal scroll strip */}
      <div className="flex gap-3 overflow-x-auto scroll-smooth pb-3 -mx-4 px-4
        scrollbar-none [&::-webkit-scrollbar]:hidden snap-x snap-mandatory">
        
        {products.map((product, index) => (
          <Link
            key={product.id}
            href={`/search?q=${encodeURIComponent(product.name)}`}
            className="flex-shrink-0 w-[160px] sm:w-[180px] snap-start group"
          >
            <div className="bg-white rounded-2xl border border-masala-border overflow-hidden 
              hover:shadow-lg hover:border-masala-primary/30 transition-all duration-200">
              
              {/* Rank badge + image */}
              <div className="relative aspect-square bg-masala-muted/50 p-3">
                {index < 3 && (
                  <span className="absolute top-2 left-2 w-6 h-6 rounded-full bg-masala-primary 
                    text-white text-[11px] font-black flex items-center justify-center z-10">
                    {index + 1}
                  </span>
                )}
                {product.savingsPercent && product.savingsPercent > 5 && (
                  <span className="absolute top-2 right-2 px-1.5 py-0.5 rounded-md 
                    bg-green-100 text-green-700 text-[10px] font-black">
                    -{Math.round(product.savingsPercent)}%
                  </span>
                )}
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-200"
                />
              </div>

              {/* Info */}
              <div className="p-2.5">
                <p className="text-[12px] font-semibold text-masala-text line-clamp-2 leading-tight mb-1">
                  {product.name}
                </p>
                <p className="text-[10px] text-masala-text-muted mb-1.5">
                  {product.weight}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-[15px] font-bold text-masala-primary">
                    from €{product.bestPrice.toFixed(2)}
                  </span>
                </div>
                <p className="text-[10px] text-masala-text-muted mt-0.5">
                  {product.storeCount} store{product.storeCount !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
```

UPDATE app/page.tsx to fetch and pass trending data:
```typescript
import { getTrendingProducts } from '@/lib/trending';
import { getFeaturedProducts } from '@/lib/featured';

export default async function HomePage() {
  const [featuredProducts, trendingProducts] = await Promise.all([
    getFeaturedProducts(),
    getTrendingProducts(10),
  ]);

  return (
    <main>
      {/* SECTION 1: Hero */}
      <section className="min-h-[calc(100vh-64px)] flex items-center bg-masala-bg">
        <div className="max-w-7xl mx-auto px-4 py-12 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <HeroLeft />
          <HeroRight featuredProducts={featuredProducts} />
        </div>
      </section>

      {/* SECTION 2: Trending Products */}
      <div className="bg-white border-y border-masala-border">
        <TrendingProductsStrip products={trendingProducts} />
      </div>

      {/* SECTION 3: Categories */}
      <CategoryGrid />

      {/* SECTION 4: How It Works */}
      <HowItWorks />

      {/* SECTION 5: Store Logos / Trust bar */}
      <StoreTrustBar />

      {/* SECTION 6: CTA Banner */}
      <CTABanner />
    </main>
  );
}
```

Output: app/page.tsx, lib/trending.ts, components/sections/TrendingProductsStrip.tsx
```

---

## PROMPT 2 — Fix: LivePricesCard Wrong Data + Complete Homepage Sections

```
[CONTEXT above]

Fix the LivePricesCard showing "Grocery 6g €0.25" and build all missing homepage sections.

─────────────────────────────────────────────
FIX 1: LivePricesCard data bug
─────────────────────────────────────────────
The widget is showing a random product from the scraper (Grocery 6g). 
This is because getFeaturedProducts() is not filtering correctly.

Fix lib/featured.ts:

```typescript
// These 4 products MUST be pinned by slug or name — never random
const FEATURED_PINS = [
  { slug: 'basmati-rice', fallbackName: 'Basmati Rice', emoji: '🌾' },
  { slug: 'amul-ghee',    fallbackName: 'Amul Ghee',    emoji: '🧈' },
  { slug: 'mdh-masala',   fallbackName: 'MDH Masala',   emoji: '🌶️' },
  { slug: 'toor-dal',     fallbackName: 'Toor Dal',     emoji: '🫘' },
];

export async function getFeaturedProducts(): Promise<FeaturedProduct[]> {
  const results: FeaturedProduct[] = [];

  for (const pin of FEATURED_PINS) {
    // Try by slug first, then fuzzy name match
    const product = await prisma.product.findFirst({
      where: {
        OR: [
          { slug: { contains: pin.slug } },
          { name: { contains: pin.fallbackName, mode: 'insensitive' } },
        ],
        // CRITICAL: must have at least 2 stores with prices
        prices: { some: { inStock: true } }
      },
      include: {
        prices: {
          where: { inStock: true },
          orderBy: { price: 'asc' },
          take: 3,
        }
      },
      orderBy: {
        // prefer products with more store coverage
        prices: { _count: 'desc' }
      }
    });

    if (product && product.prices.length >= 1) {
      results.push({
        id: product.id,
        name: product.name,
        category: product.category,
        weight: product.weight,
        imageUrl: product.imageUrl,
        emoji: pin.emoji,
        stores: product.prices.map((p, i) => ({
          storeSlug: p.storeSlug,
          price: p.price,
          isBest: i === 0,
          inStock: p.inStock,
          url: p.url,
        })),
        bestPrice: product.prices[0].price,
        bestStore: product.prices[0].storeSlug,
      });
    }
  }

  // If we couldn't find all 4 pinned products, fill with most-compared products
  if (results.length < 4) {
    const extra = await prisma.product.findMany({
      where: {
        id: { notIn: results.map(r => r.id) },
        prices: { some: { inStock: true } }
      },
      include: { prices: { where: { inStock: true }, orderBy: { price: 'asc' }, take: 3 } },
      orderBy: { compareCount: 'desc' }, // add compareCount field to Product model
      take: 4 - results.length,
    });
    // map and push extra products...
  }

  return results;
}
```

─────────────────────────────────────────────
FIX 2: LivePricesCard — better layout
─────────────────────────────────────────────
The card currently shows one product at a time in a narrow column.
Fix it to show a proper 2×2 grid of mini product cards.

Update components/ui/LivePricesCard.tsx — the grid should be:
- 2 columns, 2 rows = 4 product mini-cards
- Each mini-card shows: emoji + product name + category·weight + best price + 3 store rows
- Each store row is a real link through /api/redirect
- min-height for the card: 480px on desktop so it fills the hero column

CRITICAL: Wrap the entire card in a scroll-stable container so it does NOT 
cause layout shift while data loads. Use a fixed height skeleton:

```typescript
// Loading state — fixed dimensions prevent layout shift
if (!products || products.length === 0) {
  return (
    <div className="bg-white rounded-3xl shadow-xl border border-masala-border p-5 
      w-full max-w-[460px] h-[500px] flex items-center justify-center">
      <div className="text-masala-text-muted text-sm animate-pulse">Loading live prices...</div>
    </div>
  );
}
```

─────────────────────────────────────────────
BUILD: CategoryGrid section (components/sections/CategoryGrid.tsx)
─────────────────────────────────────────────

```typescript
const CATEGORIES = [
  { emoji: '🌾', label: 'Atta & Rice',       slug: 'atta-rice',       count: '320+' },
  { emoji: '🫘', label: 'Dal & Pulses',       slug: 'dal-pulses',      count: '180+' },
  { emoji: '🧈', label: 'Dairy & Ghee',       slug: 'dairy-ghee',      count: '95+'  },
  { emoji: '🌶️', label: 'Masala & Spices',   slug: 'masala-spices',   count: '410+' },
  { emoji: '🍵', label: 'Tea & Coffee',       slug: 'tea-coffee',      count: '140+' },
  { emoji: '🫙', label: 'Pickles & Chutneys', slug: 'pickles',         count: '75+'  },
  { emoji: '🍘', label: 'Snacks',             slug: 'snacks',          count: '290+' },
  { emoji: '🥗', label: 'Frozen Food',        slug: 'frozen',          count: '120+' },
  { emoji: '🧴', label: 'Personal Care',      slug: 'personal-care',   count: '85+'  },
  { emoji: '🏠', label: 'Home Essentials',    slug: 'home',            count: '60+'  },
];

export default function CategoryGrid() {
  return (
    <section className="py-14 px-4 max-w-7xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-black" style={{ fontFamily: 'Fraunces, serif' }}>
          Shop by Category
        </h2>
        <p className="text-masala-text-muted mt-2">Browse 5,000+ Indian products across 8 stores</p>
      </div>

      {/* 5-col desktop, 2-col mobile */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
        {CATEGORIES.map(cat => (
          <a
            key={cat.slug}
            href={`/search?category=${cat.slug}`}
            className="group bg-white rounded-2xl border border-masala-border p-4 
              flex flex-col items-center text-center gap-2
              hover:border-masala-primary/50 hover:shadow-md hover:bg-masala-primary/3
              transition-all duration-200 cursor-pointer"
          >
            <span className="text-3xl sm:text-4xl group-hover:scale-110 transition-transform duration-200">
              {cat.emoji}
            </span>
            <span className="text-[13px] font-semibold text-masala-text leading-tight">
              {cat.label}
            </span>
            <span className="text-[10px] text-masala-text-muted font-medium">
              {cat.count} products
            </span>
          </a>
        ))}
      </div>
    </section>
  );
}
```

─────────────────────────────────────────────
BUILD: HowItWorks section (components/sections/HowItWorks.tsx)
─────────────────────────────────────────────

```typescript
const STEPS = [
  {
    number: '01',
    icon: '🔍',
    title: 'Search Any Product',
    desc: 'Type in English or German. Our smart search understands both and finds exact matches instantly.',
    color: 'bg-blue-50 border-blue-100',
    numColor: 'text-blue-400',
  },
  {
    number: '02', 
    icon: '📊',
    title: 'Compare Live Prices',
    desc: 'See prices from all 8 Indian stores side by side — updated every few hours. Including delivery costs.',
    color: 'bg-amber-50 border-amber-100',
    numColor: 'text-amber-400',
  },
  {
    number: '03',
    icon: '🛒',
    title: 'Add to Smart Cart',
    desc: 'Add items from multiple stores. We calculate delivery totals and show you the cheapest real basket.',
    color: 'bg-green-50 border-green-100',
    numColor: 'text-green-400',
  },
  {
    number: '04',
    icon: '✅',
    title: 'Checkout at Best Price',
    desc: 'Go directly to the store with your cart pre-filled. One click. No re-typing. Save time and money.',
    color: 'bg-masala-muted border-masala-border',
    numColor: 'text-masala-primary/40',
  },
];

export default function HowItWorks() {
  return (
    <section className="py-16 bg-white border-y border-masala-border">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-10">
          <span className="text-xs font-black uppercase tracking-[0.3em] text-masala-primary">
            How it works
          </span>
          <h2 className="text-3xl font-black mt-2" style={{ fontFamily: 'Fraunces, serif' }}>
            Save smarter in 4 steps
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {STEPS.map((step, i) => (
            <div key={i} className={`relative rounded-2xl border p-6 ${step.color}`}>
              <span className={`text-5xl font-black ${step.numColor} leading-none`}>
                {step.number}
              </span>
              <div className="text-3xl mt-3 mb-2">{step.icon}</div>
              <h3 className="font-bold text-masala-text mb-2">{step.title}</h3>
              <p className="text-sm text-masala-text-muted leading-relaxed">{step.desc}</p>
              {i < STEPS.length - 1 && (
                <div className="hidden lg:block absolute top-1/2 -right-3 text-masala-border text-xl z-10">
                  →
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
```

─────────────────────────────────────────────
BUILD: StoreTrustBar (components/sections/StoreTrustBar.tsx)
─────────────────────────────────────────────

```typescript
import { STORE_CONFIG } from '@/lib/stores';

const STORE_STATS: Record<string, { products: string; since: string }> = {
  dookan:       { products: '800+',  since: '2021' },
  jamoona:      { products: '600+',  since: '2020' },
  swadesh:      { products: '500+',  since: '2022' },
  nammamarkt:   { products: '700+',  since: '2019' },
  angaadi:      { products: '400+',  since: '2022' },
  littleindia:  { products: '350+',  since: '2021' },
  spicevillage: { products: '550+',  since: '2020' },
  grocera:      { products: '450+',  since: '2023' },
};

export default function StoreTrustBar() {
  return (
    <section className="py-12 px-4 max-w-7xl mx-auto">
      <p className="text-center text-xs font-black uppercase tracking-[0.3em] text-masala-text-muted mb-8">
        Comparing prices across these stores
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        {Object.entries(STORE_CONFIG).map(([slug, config]) => {
          const stats = STORE_STATS[slug];
          return (
            <div key={slug} 
              className="flex flex-col items-center gap-2 p-3 rounded-xl border border-masala-border 
                bg-white hover:shadow-sm hover:border-masala-primary/30 transition-all">
              <div 
                className="w-10 h-10 rounded-xl text-sm font-black flex items-center justify-center"
                style={{ background: config.color, color: config.textColor }}
              >
                {config.initials}
              </div>
              <span className="text-[12px] font-semibold text-masala-text text-center">
                {config.label}
              </span>
              <span className="text-[10px] text-masala-text-muted">{stats?.products}</span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
```

─────────────────────────────────────────────
BUILD: CTABanner (components/sections/CTABanner.tsx)
─────────────────────────────────────────────

```typescript
export default function CTABanner() {
  return (
    <section className="px-4 pb-16 max-w-7xl mx-auto">
      <div className="bg-masala-primary rounded-3xl p-10 sm:p-14 text-center text-white">
        <h2 className="text-3xl sm:text-4xl font-black mb-3" style={{ fontFamily: 'Fraunces, serif' }}>
          Ready to save on your next grocery run?
        </h2>
        <p className="text-white/70 text-lg mb-8 max-w-lg mx-auto">
          Join thousands of smart shoppers in Germany finding the best deals on Indian food daily.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <a href="/search" 
            className="px-8 py-3.5 bg-white text-masala-primary rounded-xl font-bold 
              hover:bg-masala-bg transition-colors">
            Get Started for Free →
          </a>
          <a href="/deals"
            className="px-8 py-3.5 border-2 border-white/30 text-white rounded-xl font-bold 
              hover:bg-white/10 transition-colors">
            View Today's Deals
          </a>
        </div>
      </div>
    </section>
  );
}
```

Output: 
- lib/featured.ts (fix)
- lib/trending.ts (new)
- app/page.tsx (full rewrite)
- components/ui/LivePricesCard.tsx (fix layout)
- components/sections/TrendingProductsStrip.tsx (new)
- components/sections/CategoryGrid.tsx (new)
- components/sections/HowItWorks.tsx (new)
- components/sections/StoreTrustBar.tsx (new)
- components/sections/CTABanner.tsx (new)
```

---

## PROMPT 3 — Fix: Search Results Duplicate Removal + Visual Hierarchy

```
[CONTEXT above]

Two separate problems to fix on the search results page:
1. Duplicate products appearing (same product listed multiple times)
2. Card visual hierarchy doesn't guide eye correctly

─────────────────────────────────────────────
FIX 1: Deduplication Logic
─────────────────────────────────────────────
Currently each store_price row becomes its own product card.
The correct model: ONE card per unique product, showing all stores inside it.

The current data model likely has:
  Product (1) → StorePrice (many, one per store)

But the search query is returning one row PER StorePrice, creating duplicates.

Fix in app/api/search/route.ts AND lib/search/index.ts:

```typescript
// lib/search/deduplicate.ts

export interface GroupedProduct {
  id: string;
  name: string;
  brand: string;
  category: string;
  weight: string;
  imageUrl: string;
  // All stores that carry this product
  stores: {
    storeSlug: string;
    price: number;
    pricePerKg?: number;
    inStock: boolean;
    url: string;
    lastUpdated: Date;
    isBestPrice: boolean;
    variantId?: string;
  }[];
  bestPrice: number;
  bestStore: string;
  bestPricePerKg?: number;
  inStockCount: number;       // how many stores have it in stock
  score: number;              // search relevance score
  isBestDeal?: boolean;       // true for rank 1 in results
}

export function deduplicateAndGroup(rawRows: any[]): GroupedProduct[] {
  // Group by product ID
  const grouped = new Map<string, GroupedProduct>();

  for (const row of rawRows) {
    if (!grouped.has(row.productId)) {
      grouped.set(row.productId, {
        id: row.productId,
        name: row.productName,
        brand: row.brand,
        category: row.category,
        weight: row.weight,
        imageUrl: row.imageUrl,
        stores: [],
        bestPrice: Infinity,
        bestStore: '',
        inStockCount: 0,
        score: row.score ?? 0,
      });
    }

    const product = grouped.get(row.productId)!;
    
    // Add this store's price
    product.stores.push({
      storeSlug: row.storeSlug,
      price: row.price,
      pricePerKg: row.pricePerKg,
      inStock: row.inStock,
      url: row.url,
      lastUpdated: row.lastUpdated,
      isBestPrice: false, // set after all stores added
      variantId: row.variantId,
    });

    if (row.inStock) product.inStockCount++;
    
    // Track best price
    if (row.inStock && row.price < product.bestPrice) {
      product.bestPrice = row.price;
      product.bestStore = row.storeSlug;
      product.bestPricePerKg = row.pricePerKg;
    }
  }

  // Post-processing: mark best price per product, sort stores
  return Array.from(grouped.values()).map(product => ({
    ...product,
    stores: product.stores
      .sort((a, b) => a.price - b.price)
      .map((s, i) => ({ ...s, isBestPrice: i === 0 && s.inStock })),
  }));
}
```

Update app/api/search/route.ts to use deduplicateAndGroup():
```typescript
// After fetching raw results from Prisma:
const rawRows = await prisma.storePrice.findMany({
  where: { /* filters */ },
  include: { product: true },
});

const flattened = rawRows.map(row => ({
  productId: row.productId,
  productName: row.product.name,
  brand: row.product.brand,
  category: row.product.category,
  weight: row.product.weight,
  imageUrl: row.product.imageUrl,
  storeSlug: row.storeSlug,
  price: row.price,
  pricePerKg: row.pricePerKg,
  inStock: row.inStock,
  url: row.url,
  lastUpdated: row.updatedAt,
  variantId: row.variantId,
}));

const products = deduplicateAndGroup(flattened);
// Now sort by score/price/etc based on sort param
// total = products.length (not rawRows.length)
```

─────────────────────────────────────────────
FIX 2: ProductCard — redesign for visual hierarchy
─────────────────────────────────────────────
Rewrite components/ui/ProductCard.tsx with proper eye-flow:
F-pattern reading: users scan left→right top, then down the left edge.

VISUAL HIERARCHY ORDER (top to bottom):
1. Product image (biggest visual anchor — 1:1 aspect ratio)
2. Store + status badges (top of image — context)
3. Rank number (top-left corner when ranked)
4. Product name (bold, 2-line max)
5. Weight (small, muted)
6. PRICE — largest text on card (Fraunces, masala-primary)
7. Per-kg price (small, next to main price)
8. Freshness + Stock status (green dot "Live" or "X ago")
9. Delivery info (muted, small)
10. BUY NOW button (full width, high contrast)
11. SMART CART + COMPARE (secondary buttons, same row)
12. More details (chevron accordion)

```typescript
'use client';
import { useState } from 'react';
import { useSmartCart } from '@/stores/useSmartCart';
import { getStoreConfig } from '@/lib/stores';
import { getDeliveryInfo } from '@/lib/storeDelivery';
import { buildRedirectUrl } from '@/lib/utm';
import type { GroupedProduct } from '@/lib/search/deduplicate';

interface ProductCardProps {
  product: GroupedProduct;
  rank?: number;
  searchQuery?: string;
  showAllStores?: boolean; // expand to show all store prices
}

export default function ProductCard({ product, rank, searchQuery, showAllStores = false }: ProductCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [storesExpanded, setStoresExpanded] = useState(showAllStores);
  const { addItem, items, updateQuantity } = useSmartCart();

  const bestStore = product.stores[0]; // already sorted by price
  const isInCart = items.some(i => i.productId === product.id && i.storeSlug === bestStore?.storeSlug);
  const cartItem = items.find(i => i.productId === product.id && i.storeSlug === bestStore?.storeSlug);
  const delivery = getDeliveryInfo(bestStore?.storeSlug ?? '');
  const storeConfig = getStoreConfig(bestStore?.storeSlug ?? '');

  const redirectUrl = buildRedirectUrl({
    productId: product.id,
    storeSlug: bestStore?.storeSlug ?? '',
    searchQuery,
    position: rank,
  });

  // Freshness label
  const minutesAgo = bestStore?.lastUpdated 
    ? Math.floor((Date.now() - new Date(bestStore.lastUpdated).getTime()) / 60000)
    : null;
  const freshnessLabel = minutesAgo !== null 
    ? minutesAgo < 1 ? 'Just now' 
    : minutesAgo < 60 ? `${minutesAgo}m ago`
    : `${Math.floor(minutesAgo / 60)}h ago`
    : null;
  const isLive = minutesAgo !== null && minutesAgo < 30;

  return (
    <div className="bg-white rounded-2xl border border-masala-border overflow-hidden 
      hover:shadow-lg hover:border-masala-primary/20 transition-all duration-200 flex flex-col">

      {/* ── ZONE 1: IMAGE ── */}
      <div className="relative aspect-square bg-masala-muted/40 p-4">
        
        {/* Rank badge */}
        {rank && rank <= 10 && (
          <div className={`absolute top-2 left-2 w-7 h-7 rounded-full flex items-center justify-center 
            text-[12px] font-black z-10 shadow-sm ${
              rank === 1 ? 'bg-masala-primary text-white' :
              rank <= 3 ? 'bg-masala-primary/80 text-white' :
              'bg-masala-muted text-masala-text border border-masala-border'
            }`}>
            {rank}
          </div>
        )}

        {/* Store + status — top right */}
        <div className="absolute top-2 right-2 flex flex-col items-end gap-1 z-10">
          <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase bg-white/95 
            text-masala-text border border-masala-border/60 shadow-sm">
            {storeConfig.label}
          </span>
          {bestStore?.isBestPrice && (
            <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-green-100 text-green-700">
              BEST PRICE
            </span>
          )}
          {!bestStore?.isBestPrice && bestStore?.inStock && (
            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-blue-600">
              IN STOCK
            </span>
          )}
        </div>

        <img
          src={product.imageUrl}
          alt={product.name}
          className="w-full h-full object-contain"
          loading="lazy"
        />
      </div>

      {/* ── ZONE 2: CONTENT ── */}
      <div className="p-3 flex flex-col flex-1">
        
        {/* Product name */}
        <h3 className="text-[14px] font-semibold text-masala-text leading-snug line-clamp-2 mb-0.5">
          {product.name}
        </h3>
        <p className="text-[11px] text-masala-text-muted mb-2">{product.weight}</p>

        {/* ── PRICE ROW — most important ── */}
        <div className="flex items-baseline gap-2 mb-1">
          <span className="text-[22px] font-bold text-masala-primary leading-none"
            style={{ fontFamily: 'Fraunces, serif' }}>
            €{product.bestPrice.toFixed(2)}
          </span>
          {product.bestPricePerKg && product.bestPricePerKg !== product.bestPrice && (
            <span className="text-[11px] text-masala-text-muted">
              €{product.bestPricePerKg.toFixed(2)}/kg
            </span>
          )}
        </div>

        {/* Freshness + stock */}
        <div className="flex items-center gap-3 mb-2">
          {freshnessLabel && (
            <span className="flex items-center gap-1 text-[11px] text-masala-text-muted">
              <span className={`w-1.5 h-1.5 rounded-full ${isLive ? 'bg-green-500' : 'bg-amber-400'}`} />
              {isLive ? 'Live' : freshnessLabel}
            </span>
          )}
          <span className={`text-[11px] font-medium ${
            bestStore?.inStock ? 'text-green-600' : 'text-red-500'
          }`}>
            {bestStore?.inStock ? '● Available' : '● Out of stock'}
          </span>
          {product.inStockCount > 1 && (
            <span className="text-[11px] text-masala-text-muted">
              +{product.inStockCount - 1} store{product.inStockCount - 1 > 1 ? 's' : ''}
            </span>
          )}
        </div>

        {/* Delivery info */}
        {delivery && (
          <p className="text-[11px] text-masala-text-muted mb-2 flex items-center gap-1">
            🚚 {delivery.deliveryNote}
            {delivery.minOrderValue && (
              <> · <span className="text-amber-600 font-medium">Min. €{delivery.minOrderValue}</span></>
            )}
          </p>
        )}

        {/* Spacer pushes buttons to bottom */}
        <div className="flex-1" />

        {/* ── ZONE 3: ACTIONS ── */}

        {/* BUY NOW — primary action */}
        <a
          href={redirectUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full h-10 bg-masala-primary text-white rounded-xl text-[13px] font-bold
            flex items-center justify-center gap-2 hover:bg-masala-secondary 
            active:scale-[0.98] transition-all mb-2"
        >
          🛒 Buy Now
        </a>

        {/* SMART CART + COMPARE — secondary row */}
        <div className="grid grid-cols-2 gap-1.5 mb-2">
          {!isInCart ? (
            <button
              onClick={() => addItem({
                productId: product.id,
                productName: product.name,
                imageUrl: product.imageUrl,
                storeSlug: bestStore?.storeSlug ?? '',
                price: product.bestPrice,
                weight: product.weight,
                url: bestStore?.url ?? '',
              })}
              className="h-8 rounded-lg border border-masala-border text-[11px] font-bold 
                text-masala-text hover:border-masala-primary hover:text-masala-primary 
                transition-all flex items-center justify-center gap-1"
            >
              + Smart Cart
            </button>
          ) : (
            <div className="flex items-center gap-1 border-2 border-masala-primary rounded-lg px-1">
              <button onClick={() => updateQuantity(product.id, bestStore?.storeSlug ?? '', (cartItem?.quantity ?? 1) - 1)}
                className="w-6 h-6 rounded-md bg-masala-primary text-white text-lg font-bold flex items-center justify-center">
                −
              </button>
              <span className="flex-1 text-center text-[12px] font-bold">{cartItem?.quantity}</span>
              <button onClick={() => updateQuantity(product.id, bestStore?.storeSlug ?? '', (cartItem?.quantity ?? 0) + 1)}
                className="w-6 h-6 rounded-md bg-masala-primary text-white text-lg font-bold flex items-center justify-center">
                +
              </button>
            </div>
          )}
          <button
            className="h-8 rounded-lg border border-masala-border text-[11px] font-bold 
              text-masala-text hover:border-masala-primary hover:text-masala-primary 
              transition-all flex items-center justify-center gap-1"
          >
            + Compare
          </button>
        </div>

        {/* More details accordion */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full text-[11px] text-masala-text-muted flex items-center 
            justify-center gap-1 py-1 hover:text-masala-text transition-colors"
        >
          {expanded ? '▲ Less' : '▼ More details'}
        </button>

        {expanded && (
          <div className="mt-2 pt-2 border-t border-masala-border space-y-1">
            
            {/* All store prices */}
            <p className="text-[10px] font-black uppercase tracking-widest text-masala-text-muted mb-1.5">
              All stores
            </p>
            {product.stores.map(store => {
              const sc = getStoreConfig(store.storeSlug);
              const sr = buildRedirectUrl({ productId: product.id, storeSlug: store.storeSlug, searchQuery });
              return (
                <a key={store.storeSlug} href={sr} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 py-1 hover:bg-masala-muted rounded-lg px-1 
                    transition-colors group">
                  <span className="w-5 h-5 rounded-md text-[9px] font-black flex items-center justify-center flex-shrink-0"
                    style={{ background: sc.color, color: sc.textColor }}>
                    {sc.initials}
                  </span>
                  <span className="text-[11px] text-masala-text-muted flex-1 group-hover:text-masala-text">
                    {sc.label}
                  </span>
                  {store.isBestPrice && (
                    <span className="text-[9px] font-black text-green-600 bg-green-50 px-1.5 py-0.5 rounded-full">
                      BEST
                    </span>
                  )}
                  {!store.inStock && (
                    <span className="text-[9px] text-red-400">Out of stock</span>
                  )}
                  <span className={`text-[12px] font-bold ${store.inStock ? 'text-masala-text' : 'text-masala-text-muted line-through'}`}>
                    €{store.price.toFixed(2)}
                  </span>
                </a>
              );
            })}

            {/* Delivery details */}
            {delivery && (
              <div className="pt-2 border-t border-masala-border mt-2 space-y-1">
                <div className="flex justify-between text-[11px]">
                  <span className="text-masala-text-muted">Standard delivery</span>
                  <span className="font-bold">€{delivery.standardDeliveryFee.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span className="text-masala-text-muted">Free delivery from</span>
                  <span className="font-bold text-green-600">
                    {delivery.freeDeliveryThreshold ? `€${delivery.freeDeliveryThreshold}` : 'N/A'}
                  </span>
                </div>
                {delivery.minOrderValue && (
                  <div className="flex justify-between text-[11px]">
                    <span className="text-masala-text-muted">Min. order</span>
                    <span className="font-bold text-amber-600">€{delivery.minOrderValue}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
```

Output: 
- lib/search/deduplicate.ts (new)
- app/api/search/route.ts (use deduplicateAndGroup)
- components/ui/ProductCard.tsx (full rewrite)
```

---

## PROMPT 4 — Search Results Page: Layout, UX, and Mobile

```
[CONTEXT above]

Rewrite app/search/page.tsx with proper layout and mobile-first UX.

─────────────────────────────────────────────
DESKTOP LAYOUT (≥1024px)
─────────────────────────────────────────────

┌──────────────────────────────────────────────┐
│ STICKY SEARCH BAR (full width)               │
├───────────┬──────────────────────────────────┤
│           │ "61 results for "chips""          │
│ FILTER    │ [BEST][PRICE][€/KG][STOCK] [↻]   │
│ SIDEBAR   ├──────────────────────────────────┤
│ 260px     │ ACTIVE FILTER CHIPS (if any)      │
│ sticky    ├──────────────────────────────────┤
│           │ PRODUCT GRID (4 cols)             │
│           │                                  │
│           │ PAGINATION                       │
└───────────┴──────────────────────────────────┘

─────────────────────────────────────────────
MOBILE LAYOUT (<1024px)
─────────────────────────────────────────────

┌──────────────────────────┐
│ "61 results for "chips"" │
│ [BEST][PRICE][€/KG] [⚙️ Filters (2)] │
├──────────────────────────┤
│ ACTIVE FILTER CHIPS      │
├──────────────────────────┤
│ PRODUCT GRID (2 cols)    │
│                          │
│ LOAD MORE button         │
└──────────────────────────┘
Filter sidebar → bottom sheet modal on mobile

─────────────────────────────────────────────
FULL PAGE CODE (app/search/page.tsx)
─────────────────────────────────────────────

```typescript
'use client';
import { Suspense, useState } from 'react';
import { useSearchFilters } from '@/hooks/useSearchFilters';
import ProductCard from '@/components/ui/ProductCard';
import ProductCardSkeleton from '@/components/ui/ProductCardSkeleton';
import FilterSidebar from '@/components/ui/FilterSidebar';
import { getStoreConfig } from '@/lib/stores';
import { X, RefreshCw, SlidersHorizontal } from 'lucide-react';

export default function SearchPage() {
  const { filters, setFilters, clearFilters, hasActiveFilters } = useSearchFilters();
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const [products, setProducts] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  // Fetch on filter change
  useEffect(() => {
    const fetchResults = async () => {
      setLoading(true);
      const params = new URLSearchParams({
        q: filters.q,
        sort: filters.sort,
        page: String(filters.page),
        ...(filters.stores.length ? { stores: filters.stores.join(',') } : {}),
        ...(filters.inStockOnly ? { inStock: 'true' } : {}),
        ...(filters.maxPrice < 100 ? { maxPrice: String(filters.maxPrice) } : {}),
      });
      const res = await fetch(`/api/search?${params}`);
      const data = await res.json();
      setProducts(data.products);
      setTotal(data.total);
      setLoading(false);
    };
    if (filters.q) fetchResults();
  }, [filters]);

  const SORT_TABS = [
    { id: 'best', label: 'BEST' },
    { id: 'price', label: 'PRICE' },
    { id: 'pricePerKg', label: '€/KG' },
    { id: 'stock', label: 'STOCK' },
  ] as const;

  const activeFilterCount = filters.stores.length 
    + (filters.inStockOnly ? 1 : 0) 
    + (filters.maxPrice < 100 ? 1 : 0);

  return (
    <div className="min-h-screen bg-masala-bg">

      {/* ── RESULTS HEADER ── */}
      <div className="bg-white border-b border-masala-border px-4 py-4">
        <div className="max-w-7xl mx-auto">
          
          {/* Title row */}
          <div className="flex items-start justify-between gap-4 mb-3">
            <h1 className="text-xl sm:text-2xl font-black text-masala-text">
              <span className="text-masala-primary">{total}</span>
              {' '}results for{' '}
              <span className="font-black italic" style={{ fontFamily: 'Fraunces, serif' }}>
                "{filters.q.trim()}"
              </span>
            </h1>
            <button onClick={() => window.location.reload()} 
              className="flex-shrink-0 p-2 rounded-xl border border-masala-border hover:border-masala-primary transition-colors">
              <RefreshCw className="w-4 h-4 text-masala-text-muted" />
            </button>
          </div>

          {/* Sort tabs + mobile filter button */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1 bg-masala-muted rounded-xl p-1">
              {SORT_TABS.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setFilters({ sort: tab.id })}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    filters.sort === tab.id
                      ? 'bg-masala-primary text-white shadow-sm'
                      : 'text-masala-text-muted hover:text-masala-text'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Mobile filter button */}
            <button
              onClick={() => setFilterSheetOpen(true)}
              className="lg:hidden flex items-center gap-2 px-3 py-2 rounded-xl border border-masala-border 
                bg-white text-sm font-bold hover:border-masala-primary transition-colors"
            >
              <SlidersHorizontal className="w-4 h-4" />
              Filters
              {activeFilterCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-masala-primary text-white text-[10px] 
                  font-black flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>

          {/* Active filter chips */}
          {hasActiveFilters && (
            <div className="flex flex-wrap gap-2 mt-3">
              {filters.stores.map(store => (
                <button
                  key={store}
                  onClick={() => setFilters({ stores: filters.stores.filter(s => s !== store) })}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-masala-primary/10 
                    text-masala-primary text-xs font-bold border border-masala-primary/20
                    hover:bg-masala-primary hover:text-white transition-all"
                >
                  {getStoreConfig(store).label} <X className="w-3 h-3" />
                </button>
              ))}
              {filters.inStockOnly && (
                <button onClick={() => setFilters({ inStockOnly: false })}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-masala-primary/10 
                    text-masala-primary text-xs font-bold border border-masala-primary/20
                    hover:bg-masala-primary hover:text-white transition-all">
                  In Stock Only <X className="w-3 h-3" />
                </button>
              )}
              <button onClick={clearFilters} className="text-xs text-masala-text-muted underline">
                Clear all
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── MAIN CONTENT ── */}
      <div className="max-w-7xl mx-auto px-4 py-6 flex gap-6">

        {/* Filter sidebar — desktop only */}
        <div className="hidden lg:block w-[240px] flex-shrink-0">
          <div className="sticky top-20">
            <FilterSidebar />
          </div>
        </div>

        {/* Product grid */}
        <div className="flex-1 min-w-0">
          
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-5xl mb-4">🔍</p>
              <p className="text-xl font-bold text-masala-text mb-2">No results found</p>
              <p className="text-masala-text-muted mb-6">
                Try a different search term or clear your filters
              </p>
              {hasActiveFilters && (
                <button onClick={clearFilters}
                  className="px-6 py-2.5 bg-masala-primary text-white rounded-xl font-bold">
                  Clear all filters
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {products.map((product, index) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    rank={index + 1}
                    searchQuery={filters.q}
                  />
                ))}
              </div>

              {/* Pagination */}
              {total > 24 && (
                <div className="flex justify-center gap-2 mt-8">
                  {filters.page > 1 && (
                    <button onClick={() => setFilters({ page: filters.page - 1 })}
                      className="px-4 py-2 rounded-xl border border-masala-border font-bold text-sm 
                        hover:border-masala-primary transition-colors">
                      ← Previous
                    </button>
                  )}
                  <span className="px-4 py-2 text-sm text-masala-text-muted">
                    Page {filters.page} of {Math.ceil(total / 24)}
                  </span>
                  {filters.page < Math.ceil(total / 24) && (
                    <button onClick={() => setFilters({ page: filters.page + 1 })}
                      className="px-4 py-2 rounded-xl bg-masala-primary text-white font-bold text-sm 
                        hover:bg-masala-secondary transition-colors">
                      Next →
                    </button>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ── MOBILE FILTER BOTTOM SHEET ── */}
      {filterSheetOpen && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" 
            onClick={() => setFilterSheetOpen(false)} />
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl 
            shadow-2xl lg:hidden max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-masala-border">
              <h3 className="font-black text-lg">Filters</h3>
              <button onClick={() => setFilterSheetOpen(false)} 
                className="text-masala-text-muted hover:text-masala-text">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5">
              <FilterSidebar />
            </div>
            <div className="p-5 border-t border-masala-border">
              <button
                onClick={() => setFilterSheetOpen(false)}
                className="w-full h-12 bg-masala-primary text-white rounded-xl font-bold text-sm">
                Show {total} results
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
```

Output: app/search/page.tsx (full rewrite)
```

---

## IMPLEMENTATION ORDER

```
Run in this sequence — each prompt depends on the previous:

1. PROMPT 2 first  → fixes featured data bug (hero widget)
2. PROMPT 3 second → deduplication (fixes search results count too)
3. PROMPT 1 third  → trending strip needs clean product data
4. PROMPT 4 last   → search page layout (uses fixed ProductCard from Prompt 3)
```

---

## QUICK WINS (under 10 min each, do these immediately)

```typescript
// QUICK FIX 1: Remove orphaned hero card
// In app/page.tsx — delete this block entirely:
// <div className="bg-white rounded-xl ...">
//   <p>Basmati Rice</p>
//   <p>from €2.99</p>
//   <p>Compare 3-5 stores →</p>
// </div>

// QUICK FIX 2: Fix result count showing raw StorePrice rows instead of unique products
// In app/api/search/route.ts:
// WRONG: const total = await prisma.storePrice.count({ where });
// RIGHT: const total = await prisma.product.count({ 
//   where: { prices: { some: { ...priceFilters } } }
// });

// QUICK FIX 3: Trim query display
// WRONG: `results for " ${query} "`
// RIGHT: `results for "${query.trim()}"`
```

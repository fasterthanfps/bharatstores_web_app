# BharatStores.eu — Critical Bug Fixes + Layout + Deals Page (Session 5)
> Urgent fixes first, then layout and new pages. Run in order.

---

## CONTEXT (include in every prompt)

```
BharatStores.eu — Indian grocery price comparison for Indians in Germany/Europe.
Next.js 14 App Router, TypeScript, Tailwind CSS, Prisma ORM, Zustand cart.
Stores: Dookan (dookan.de), Jamoona (jamoona.de), Swadesh (swadesh.de), 
        Namma Markt (nammamarkt.com), Angaadi (angaadi.de), 
        Little India (little-india.de), Spice Village (spicevillage.eu), 
        Grocera (grocera.de)

CRITICAL BUGS CONFIRMED FROM SCREENSHOTS:
1. Smart Cart redirect sends UUID as search query to dookan.de — product ID leaking into URL
2. Wrong domain: code using dookan.eu instead of dookan.de
3. Header search bar is pushed far right with no width constraint
4. AJAX search not working on mobile
5. Compare panel not updating — needs refresh/polling logic
```

---

## 🚨 PROMPT 1 — CRITICAL: Fix Smart Cart Redirect (UUID Bug)

```
[CONTEXT above]

CONFIRMED BUG from screenshot:
The "Checkout at Dookan" button redirected to:
  dookan.de/search?q=a1b9c50b-87a3-4158-a26e-b1dda1754a2b
  
This is passing the internal Prisma CUID (product ID) as the search query.
The store has no idea what this UUID means — it shows 0 results.

ROOT CAUSE: In lib/cartRedirect.ts, the buildCartUrl() function falls back to:
  `${baseUrl}/search?q=${encodeURIComponent(items[0].handle)}`
  where items[0].handle = product.productId (a CUID like "a1b9c50b-...")
  instead of the actual product name or store's own product handle/slug.

─────────────────────────────────────────────
FIX 1: Correct domain map — .eu → .de
─────────────────────────────────────────────
In lib/cartRedirect.ts, fix the store base URLs:

```typescript
// WRONG — these were causing wrong-site redirects:
const STORE_BASE_URLS: Record<string, string> = {
  dookan:       'https://www.dookan.de',        // NOT dookan.eu
  jamoona:      'https://www.jamoona.de',        // verify this
  swadesh:      'https://www.swadesh.de',        // verify this  
  nammamarkt:   'https://www.nammamarkt.com',
  angaadi:      'https://www.angaadi.de',
  littleindia:  'https://www.little-india.de',
  spicevillage: 'https://www.spicevillage.eu',   // this one IS .eu
  grocera:      'https://www.grocera.de',
};
```

IMPORTANT: Double-check each domain in your scraper's store config and use 
EXACTLY the same domain the scraper fetches from. They must match.

─────────────────────────────────────────────
FIX 2: Store the actual store product slug/handle in DB — not just the URL
─────────────────────────────────────────────
The real fix is storing the store's own product handle from the scraped URL.

Update Prisma schema — add to StorePrice model:
```prisma
model StorePrice {
  id            String   @id @default(cuid())
  productId     String   
  storeSlug     String
  price         Float
  pricePerKg    Float?
  inStock       Boolean  @default(true)
  url           String   // FULL product URL e.g. https://dookan.de/products/basmati-rice-5kg
  storeHandle   String?  // Shopify handle e.g. "basmati-rice-5kg" — extracted from URL
  variantId     String?  // Shopify variant ID for cart pre-fill
  updatedAt     DateTime @updatedAt

  @@index([productId, storeSlug])
}
```

Add a migration: npx prisma migrate dev --name add_store_handle

Update scrapers to extract storeHandle from product URL:
```typescript
// In scraper base class or each store scraper:
function extractHandle(productUrl: string): string {
  // Shopify URLs: /products/HANDLE or /products/HANDLE?variant=123
  const match = productUrl.match(/\/products\/([^?#/]+)/);
  return match ? match[1] : '';
}
// Store it: storeHandle = extractHandle(product.url)
```

─────────────────────────────────────────────
FIX 3: buildCartUrl() — use storeHandle for search fallback, NOT productId
─────────────────────────────────────────────
Rewrite lib/cartRedirect.ts completely:

```typescript
import { buildUTMUrl } from './utm';

const STORE_BASE_URLS: Record<string, string> = {
  dookan:       'https://www.dookan.de',
  jamoona:      'https://www.jamoona.de',
  swadesh:      'https://www.swadesh.de',
  nammamarkt:   'https://www.nammamarkt.com',
  angaadi:      'https://www.angaadi.de',
  littleindia:  'https://www.little-india.de',
  spicevillage: 'https://www.spicevillage.eu',
  grocera:      'https://www.grocera.de',
};

export interface CartItem {
  productId: string;      // our internal ID — NEVER send to stores
  productName: string;    // human-readable — safe to use in search
  storeSlug: string;
  storeHandle?: string;   // store's own product slug from URL
  variantId?: string;     // Shopify variant ID
  quantity: number;
  url: string;            // full product URL from scraper
}

export interface CartRedirectResult {
  url: string;
  method: 'direct_url' | 'shopify_cart' | 'shopify_search' | 'product_page';
  confidence: 'high' | 'medium' | 'low';
  note?: string;
}

export function buildCartUrl(storeSlug: string, items: CartItem[]): CartRedirectResult {
  const baseUrl = STORE_BASE_URLS[storeSlug];
  if (!baseUrl || items.length === 0) {
    return { url: '#', method: 'product_page', confidence: 'low', note: 'Unknown store' };
  }

  const utm = { source: storeSlug, medium: 'cart_redirect', campaign: 'smart_cart', content: storeSlug };

  // STRATEGY 1 (best): Use Shopify /cart/ URL with variant IDs
  // All items must have variantId for this to work
  const itemsWithVariants = items.filter(i => i.variantId);
  if (itemsWithVariants.length === items.length && items.length > 0) {
    const cartPath = items.map(i => `${i.variantId}:${i.quantity}`).join(',');
    return {
      url: buildUTMUrl(`${baseUrl}/cart/${cartPath}`, utm),
      method: 'shopify_cart',
      confidence: 'high',
    };
  }

  // STRATEGY 2 (good): If single item, go directly to the product page URL
  // (the exact URL we scraped from the store — most reliable)
  if (items.length === 1 && items[0].url) {
    const productUrl = items[0].url;
    // Verify it's the same domain to prevent open redirect
    try {
      const urlObj = new URL(productUrl);
      const baseUrlObj = new URL(baseUrl);
      if (urlObj.hostname === baseUrlObj.hostname || 
          urlObj.hostname.endsWith('.' + baseUrlObj.hostname)) {
        return {
          url: buildUTMUrl(productUrl, utm),
          method: 'direct_url',
          confidence: 'high',
        };
      }
    } catch {}
  }

  // STRATEGY 3 (okay): Use storeHandle in Shopify products URL
  if (items[0].storeHandle) {
    return {
      url: buildUTMUrl(`${baseUrl}/products/${items[0].storeHandle}`, utm),
      method: 'product_page',
      confidence: 'medium',
    };
  }

  // STRATEGY 4 (fallback): Search using PRODUCT NAME — NOT productId UUID
  // Use productName which is human-readable
  const searchQuery = encodeURIComponent(items[0].productName);
  return {
    url: buildUTMUrl(`${baseUrl}/search?q=${searchQuery}`, utm),
    method: 'shopify_search',
    confidence: 'low',
    note: 'Direct cart unavailable — searching by product name',
  };
}
```

─────────────────────────────────────────────
FIX 4: SmartCartPanel — show confidence indicator
─────────────────────────────────────────────
In components/ui/SmartCartPanel.tsx, update the checkout button:

```typescript
const cartResult = buildCartUrl(storeSlug, storeItems);

// Show different UI based on confidence:
<a href={cartResult.url} target="_blank" rel="noopener noreferrer"
  className={`w-full h-11 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-colors ${
    cartResult.confidence === 'high' 
      ? 'bg-masala-primary text-white hover:bg-masala-secondary' 
      : 'bg-masala-primary/80 text-white hover:bg-masala-primary'
  }`}>
  {cartResult.method === 'shopify_cart' 
    ? '🛒 Checkout with items pre-added →'
    : cartResult.method === 'direct_url'
    ? '🛒 Go to product page →'
    : `🔍 Search at ${config.label} →`
  }
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
```

Also add a CartItem type sync — make sure the Zustand cart store
saves `storeHandle` and `url` alongside each item:
In stores/useSmartCart.ts, update CartItem interface to include:
  storeHandle?: string;  // from StorePrice.storeHandle
  url: string;           // from StorePrice.url (full store product URL)

And when addItem() is called from ProductCard, pass both:
  addItem({
    ...
    storeHandle: bestStore.storeHandle,
    url: bestStore.url,   // full URL from DB
  })

Output: lib/cartRedirect.ts (rewrite), stores/useSmartCart.ts (add fields),
        components/ui/SmartCartPanel.tsx (update button), 
        components/ui/ProductCard.tsx (pass storeHandle + url),
        prisma/schema.prisma (add storeHandle field)
```

---

## PROMPT 2 — Fix: Header Search Bar Layout (Too Far Right, Too Slim)

```
[CONTEXT above]

From screenshots: The search bar on desktop is pushed to the far right of the header,
near Blog/Alerts/Account links. It should be centered and wide.

Currently the header flex layout is treating the search bar as a nav item.

─────────────────────────────────────────────
CORRECT HEADER LAYOUT
─────────────────────────────────────────────
The header should be a 3-zone layout:
  [LOGO + EN/DE]  |  [SEARCH BAR — centered, takes all remaining space]  |  [NAV + CART]
  flex-shrink-0       flex-1 max-w-2xl mx-auto                              flex-shrink-0

Rewrite components/layout/Header.tsx:

```typescript
'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSmartCart } from '@/stores/useSmartCart';
import SearchBar from '@/components/SearchBar';
import LanguageToggle from '@/components/ui/LanguageToggle';
import MobileMenu from '@/components/ui/MobileMenu';
import { ShoppingCart, Bell, BookOpen, User, Menu } from 'lucide-react';

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const { getTotalItems } = useSmartCart();
  const totalItems = getTotalItems();

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  return (
    <>
      <header className={`sticky top-0 z-50 bg-white transition-shadow duration-200 ${
        scrolled ? 'shadow-md' : 'border-b border-masala-border'
      }`}>
        <div className="h-16 px-4 sm:px-6 lg:px-8 flex items-center gap-4 max-w-[1400px] mx-auto">

          {/* ── ZONE 1: Logo + Language (LEFT, fixed width) ── */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <Link href="/" className="flex items-baseline gap-0.5">
              <span className="text-xl font-black text-masala-primary" style={{ fontFamily: 'Fraunces, serif' }}>
                BharatStores
              </span>
              <span className="text-sm font-bold text-masala-text-muted">.eu</span>
            </Link>
            {/* EN/DE toggle — visible on desktop only next to logo */}
            <div className="hidden sm:block">
              <LanguageToggle size="compact" />
            </div>
          </div>

          {/* ── ZONE 2: Search bar (CENTER, grows to fill space) ── */}
          {/* 
            KEY FIX: flex-1 with min-w-0 and a max-w cap.
            The search bar MUST be between the two fixed zones.
            DO NOT put it inside the right nav group.
          */}
          <div className="flex-1 min-w-0 max-w-3xl">
            {/* Desktop: full search bar */}
            <div className="hidden sm:block">
              <SearchBar size="header" />
            </div>
            {/* Mobile: icon that opens search overlay */}
            <div className="sm:hidden">
              <SearchBar size="header" />
            </div>
          </div>

          {/* ── ZONE 3: Nav links + Cart (RIGHT, fixed width) ── */}
          <div className="flex items-center gap-1 sm:gap-4 flex-shrink-0">
            
            {/* Desktop nav links */}
            <nav className="hidden lg:flex items-center gap-5">
              <Link href="/blog" 
                className="flex items-center gap-1.5 text-sm text-masala-text-muted hover:text-masala-primary transition-colors">
                <BookOpen className="w-4 h-4" />
                Blog
              </Link>
              <Link href="/alerts"
                className="flex items-center gap-1.5 text-sm text-masala-text-muted hover:text-masala-primary transition-colors">
                <Bell className="w-4 h-4" />
                Price Alerts
              </Link>
              <Link href="/account"
                className="flex items-center gap-1.5 text-sm text-masala-text-muted hover:text-masala-primary transition-colors">
                <User className="w-4 h-4" />
                Account
              </Link>
            </nav>

            {/* Divider */}
            <div className="hidden lg:block w-px h-6 bg-masala-border" />

            {/* Cart icon — always visible */}
            <button
              onClick={() => setCartOpen(true)}
              className="relative p-2 rounded-xl hover:bg-masala-muted transition-colors"
              aria-label="Smart Cart"
            >
              <ShoppingCart className="w-5 h-5 text-masala-text" />
              {totalItems > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-5 h-5 rounded-full bg-masala-primary 
                  text-white text-[10px] font-black flex items-center justify-center leading-none">
                  {totalItems > 9 ? '9+' : totalItems}
                </span>
              )}
            </button>

            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-xl hover:bg-masala-muted transition-colors"
              aria-label="Menu"
            >
              <Menu className="w-5 h-5 text-masala-text" />
            </button>
          </div>
        </div>

        {/* Mobile search strip — shown below header on mobile */}
        {/* Only on homepage — search page has its own search bar */}
      </header>

      {/* Mobile menu drawer */}
      {mobileMenuOpen && <MobileMenu onClose={() => setMobileMenuOpen(false)} />}
      
      {/* Smart cart panel */}
      {cartOpen && <SmartCartPanel onClose={() => setCartOpen(false)} />}
    </>
  );
}
```

─────────────────────────────────────────────
SEARCHBAR SIZE — header variant must be wider
─────────────────────────────────────────────
In components/SearchBar.tsx, update the header size styles:

```typescript
// Current header size is too slim — these values fix it:
const sizeStyles = {
  hero: 'h-14 pl-12 pr-36 text-base rounded-2xl',
  header: 'h-11 pl-10 pr-28 text-sm rounded-xl',  // was h-9 — too small
};

// Header container div should NOT have max-width restriction:
// The parent <div className="flex-1 min-w-0 max-w-3xl"> in Header handles the max-width
```

Output: components/layout/Header.tsx (rewrite), components/SearchBar.tsx (size fix)
```

---

## PROMPT 3 — Fix: AJAX Search Not Working on Mobile

```
[CONTEXT above]

The search autocomplete/suggestions dropdown works on desktop but not on mobile.
Common causes on mobile:
1. onBlur fires immediately on touchstart, closing dropdown before tap registers
2. Touch events not handled (mobile uses touchstart not mousedown)
3. z-index issues — dropdown hidden behind other elements
4. Virtual keyboard pushing layout, hiding dropdown

─────────────────────────────────────────────
FIX: Rewrite SearchBar with mobile-safe event handling
─────────────────────────────────────────────
Full rewrite of components/SearchBar.tsx:

```typescript
'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X, TrendingUp, Clock } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

const POPULAR_SEARCHES = ['Basmati Rice','Amul Ghee','MDH Masala','Toor Dal','Atta','Paneer','Chai','Chana Dal'];

interface Suggestion {
  term: string;
  storeCount: number;
  category: string;
}

interface SearchBarProps {
  initialQuery?: string;
  autoFocus?: boolean;
  size?: 'hero' | 'header';
}

export default function SearchBar({ initialQuery = '', autoFocus = false, size = 'hero' }: SearchBarProps) {
  const [query, setQuery] = useState(initialQuery);
  const [isFocused, setIsFocused] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>();
  const isSelectingRef = useRef(false); // prevents blur closing dropdown on touch
  
  const router = useRouter();
  const { lang } = useLanguage();

  const isHero = size === 'hero';

  // Load recent searches from localStorage
  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('bs-recent') ?? '[]');
      setRecentSearches(stored.slice(0, 5));
    } catch {}
  }, []);

  // Debounced suggestion fetch
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    
    if (query.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    
    setIsLoadingSuggestions(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search/suggest?q=${encodeURIComponent(query)}&lang=${lang}`);
        const data = await res.json();
        setSuggestions(data.suggestions ?? []);
      } catch {
        setSuggestions([]);
      } finally {
        setIsLoadingSuggestions(false);
      }
    }, 250);

    return () => clearTimeout(debounceRef.current);
  }, [query, lang]);

  // CRITICAL: Close dropdown only when clicking OUTSIDE the entire component
  // This fixes mobile where onBlur fires before onTouchStart of a suggestion
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsFocused(false);
        setSuggestions([]);
      }
    };
    
    // Use both events — mousedown for desktop, touchstart for mobile
    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('touchstart', handleOutsideClick, { passive: true });
    
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
    };
  }, []);

  const saveToRecent = useCallback((term: string) => {
    try {
      const existing = JSON.parse(localStorage.getItem('bs-recent') ?? '[]') as string[];
      const updated = [term, ...existing.filter(t => t !== term)].slice(0, 8);
      localStorage.setItem('bs-recent', JSON.stringify(updated));
      setRecentSearches(updated.slice(0, 5));
    } catch {}
  }, []);

  const handleSubmit = useCallback((q: string) => {
    const trimmed = q.trim();
    if (!trimmed) return;
    saveToRecent(trimmed);
    setIsFocused(false);
    setSuggestions([]);
    router.push(`/search?q=${encodeURIComponent(trimmed)}`);
  }, [router, saveToRecent]);

  const handleSuggestionSelect = useCallback((term: string) => {
    // Set query first so input shows selected term
    setQuery(term);
    // Small delay to prevent focus fighting on mobile
    setTimeout(() => handleSubmit(term), 50);
  }, [handleSubmit]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSubmit(query);
    if (e.key === 'Escape') {
      setIsFocused(false);
      inputRef.current?.blur();
    }
  };

  const showDropdown = isFocused;
  const showSuggestions = showDropdown && suggestions.length > 0;
  const showPopular = showDropdown && query.trim().length < 2;

  return (
    <div ref={containerRef} className="relative w-full">
      
      {/* Search input container */}
      <div className={`relative flex items-center rounded-xl sm:rounded-2xl border-2 
        bg-white transition-all duration-200 ${
        isFocused 
          ? 'border-masala-primary shadow-lg shadow-masala-primary/10' 
          : 'border-masala-border hover:border-masala-primary/40 shadow-sm'
      }`}>
        
        <Search className={`absolute left-3 sm:left-4 flex-shrink-0 text-masala-text-muted 
          transition-colors ${isFocused ? 'text-masala-primary' : ''} ${
          isHero ? 'w-5 h-5' : 'w-4 h-4'
        }`} />

        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          // CRITICAL: Don't close on blur — let the outside-click handler do it
          // If we close on blur, mobile tap on suggestion triggers blur first
          onBlur={() => {
            // Only close if user is not in the middle of selecting something
            if (!isSelectingRef.current) {
              // Small delay for iOS Safari
              setTimeout(() => {
                if (!isSelectingRef.current) setIsFocused(false);
              }, 300);
            }
          }}
          onKeyDown={handleKeyDown}
          placeholder={isHero ? 'Search Indian groceries...' : 'Search Indian groceries...'}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          // Mobile: trigger correct keyboard type
          inputMode="search"
          enterKeyHint="search"
          className={`w-full bg-transparent border-none outline-none focus:ring-0 
            text-masala-text placeholder:text-masala-text-muted/60
            ${isHero 
              ? 'h-14 pl-12 pr-36 text-base' 
              : 'h-11 pl-10 pr-28 text-[15px]'  // h-11 not h-9
            }`}
        />

        {/* Clear button */}
        {query && (
          <button
            onMouseDown={e => { e.preventDefault(); setQuery(''); inputRef.current?.focus(); }}
            onTouchStart={e => { e.preventDefault(); setQuery(''); inputRef.current?.focus(); }}
            className={`absolute flex items-center justify-center w-8 h-8 rounded-lg
              text-masala-text-muted hover:text-masala-text transition-colors
              ${isHero ? 'right-[120px] sm:right-[140px]' : 'right-[90px] sm:right-[100px]'}`}
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {/* Submit button */}
        <button
          onMouseDown={e => { e.preventDefault(); handleSubmit(query); }}
          onTouchStart={e => { e.preventDefault(); handleSubmit(query); }}
          className={`absolute right-1.5 bg-masala-primary text-white font-bold 
            rounded-lg sm:rounded-xl hover:bg-masala-secondary active:scale-[0.97] 
            transition-all shadow-sm flex items-center justify-center gap-2
            ${isHero ? 'h-11 px-5 sm:px-8 text-xs sm:text-sm' : 'h-8 px-3 sm:px-5 text-xs'}`}
        >
          {/* Mobile: icon only; Desktop: text */}
          <Search className="w-4 h-4 sm:hidden" />
          <span className="hidden sm:inline uppercase font-black tracking-wide">Search</span>
        </button>
      </div>

      {/* ── DROPDOWN ── */}
      {showDropdown && (showSuggestions || showPopular) && (
        <div
          ref={dropdownRef}
          // CRITICAL z-index: must be above sticky header (z-50), category tabs, etc.
          className="absolute top-full left-0 right-0 mt-2 z-[200] bg-white rounded-2xl 
            shadow-2xl border border-masala-border overflow-hidden"
          // Prevent touch events from bubbling and closing dropdown
          onTouchStart={e => { isSelectingRef.current = true; }}
          onTouchEnd={e => { setTimeout(() => { isSelectingRef.current = false; }, 500); }}
          onMouseDown={e => e.preventDefault()} // prevent blur on desktop
        >
          
          {/* Loading state */}
          {isLoadingSuggestions && (
            <div className="px-4 py-3 text-sm text-masala-text-muted animate-pulse">
              Searching...
            </div>
          )}

          {/* Suggestions list */}
          {showSuggestions && !isLoadingSuggestions && (
            <div className="py-2">
              {suggestions.map((s, i) => (
                <button
                  key={i}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-masala-muted 
                    transition-colors text-left"
                  onMouseDown={e => { e.preventDefault(); handleSuggestionSelect(s.term); }}
                  onTouchStart={e => { isSelectingRef.current = true; }}
                  onTouchEnd={e => { 
                    e.preventDefault();
                    handleSuggestionSelect(s.term);
                    setTimeout(() => { isSelectingRef.current = false; }, 500);
                  }}
                >
                  <Search className="w-4 h-4 text-masala-text-muted flex-shrink-0" />
                  <span className="flex-1 text-sm font-medium text-masala-text">{s.term}</span>
                  <span className="text-xs text-masala-text-muted">{s.storeCount} stores</span>
                  {s.category && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-masala-muted 
                      text-masala-text-muted font-medium">
                      {s.category}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Popular + Recent — shown when no query */}
          {showPopular && (
            <div className="p-4">
              
              {/* Recent searches */}
              {recentSearches.length > 0 && (
                <div className="mb-4">
                  <p className="flex items-center gap-1.5 text-[10px] font-black uppercase 
                    tracking-widest text-masala-text-muted mb-3">
                    <Clock className="w-3 h-3" /> Recent
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {recentSearches.map(term => (
                      <button
                        key={term}
                        className="px-3 py-1.5 rounded-lg bg-masala-muted text-xs font-medium 
                          text-masala-text hover:bg-masala-primary hover:text-white transition-all"
                        onMouseDown={e => { e.preventDefault(); handleSuggestionSelect(term); }}
                        onTouchStart={() => { isSelectingRef.current = true; }}
                        onTouchEnd={e => { 
                          e.preventDefault(); 
                          handleSuggestionSelect(term);
                          setTimeout(() => { isSelectingRef.current = false; }, 500);
                        }}
                      >
                        {term}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Popular searches */}
              <div>
                <p className="flex items-center gap-1.5 text-[10px] font-black uppercase 
                  tracking-widest text-masala-text-muted mb-3">
                  <TrendingUp className="w-3 h-3 text-masala-primary" /> Trending
                </p>
                <div className="flex flex-wrap gap-2">
                  {POPULAR_SEARCHES.map(term => (
                    <button
                      key={term}
                      className="px-3 py-1.5 rounded-lg border border-masala-border text-xs 
                        font-semibold text-masala-text hover:bg-masala-primary hover:text-white 
                        hover:border-masala-primary transition-all"
                      onMouseDown={e => { e.preventDefault(); handleSuggestionSelect(term); }}
                      onTouchStart={() => { isSelectingRef.current = true; }}
                      onTouchEnd={e => { 
                        e.preventDefault(); 
                        handleSuggestionSelect(term);
                        setTimeout(() => { isSelectingRef.current = false; }, 500);
                      }}
                    >
                      {term}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
```

Output: components/SearchBar.tsx (full rewrite)
```

---

## PROMPT 4 — Fix: Compare Panel Refresh Logic

```
[CONTEXT above]

The comparison panel/page is broken — it shows stale data and doesn't update
when new products are added to compare. Users have to manually refresh.

─────────────────────────────────────────────
FIX: Compare state management with auto-refresh
─────────────────────────────────────────────
Create stores/useCompare.ts using Zustand with live data polling:

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface CompareItem {
  productId: string;
  productName: string;
  imageUrl: string;
  category: string;
  weight: string;
  addedAt: number;
}

interface CompareStore {
  items: CompareItem[];
  liveData: Record<string, any>; // productId → live price data
  lastFetched: number;
  isFetching: boolean;
  
  addToCompare: (item: CompareItem) => void;
  removeFromCompare: (productId: string) => void;
  clearCompare: () => void;
  isInCompare: (productId: string) => boolean;
  fetchLiveData: () => Promise<void>;
}

export const useCompare = create<CompareStore>()(
  persist(
    (set, get) => ({
      items: [],
      liveData: {},
      lastFetched: 0,
      isFetching: false,

      addToCompare: (item) => {
        set(state => {
          if (state.items.length >= 4) {
            // Max 4 items — remove oldest
            const sorted = [...state.items].sort((a, b) => a.addedAt - b.addedAt);
            return { items: [...sorted.slice(1), { ...item, addedAt: Date.now() }] };
          }
          if (state.items.find(i => i.productId === item.productId)) return state;
          return { items: [...state.items, { ...item, addedAt: Date.now() }] };
        });
        // Fetch fresh data immediately after adding
        setTimeout(() => get().fetchLiveData(), 100);
      },

      removeFromCompare: (productId) => {
        set(state => ({
          items: state.items.filter(i => i.productId !== productId),
          liveData: Object.fromEntries(
            Object.entries(state.liveData).filter(([k]) => k !== productId)
          ),
        }));
      },

      clearCompare: () => set({ items: [], liveData: {}, lastFetched: 0 }),

      isInCompare: (productId) => get().items.some(i => i.productId === productId),

      fetchLiveData: async () => {
        const { items, isFetching } = get();
        if (items.length === 0 || isFetching) return;
        
        set({ isFetching: true });
        try {
          const ids = items.map(i => i.productId).join(',');
          const res = await fetch(`/api/products/compare?ids=${ids}`);
          const data = await res.json();
          set({ 
            liveData: data.products ?? {},
            lastFetched: Date.now(),
            isFetching: false,
          });
        } catch {
          set({ isFetching: false });
        }
      },
    }),
    { 
      name: 'bs-compare',
      partialize: (state) => ({ items: state.items }), // only persist items, not liveData
    }
  )
);
```

─────────────────────────────────────────────
CompareBar (components/ui/CompareBar.tsx)
─────────────────────────────────────────────
The bottom bar that appears when items are added to compare.
Replace the old CompareTray with this:

```typescript
'use client';
import { useEffect } from 'react';
import { useCompare } from '@/stores/useCompare';
import { useRouter } from 'next/navigation';
import { X, GitCompare, RefreshCw } from 'lucide-react';

export default function CompareBar() {
  const { items, removeFromCompare, clearCompare, fetchLiveData, lastFetched, isFetching } = useCompare();
  const router = useRouter();

  // Auto-refresh compare data every 5 minutes
  useEffect(() => {
    if (items.length === 0) return;
    
    // Fetch immediately if stale (>5min)
    const staleThreshold = 5 * 60 * 1000;
    if (Date.now() - lastFetched > staleThreshold) {
      fetchLiveData();
    }

    // Set up polling
    const interval = setInterval(() => {
      fetchLiveData();
    }, staleThreshold);

    return () => clearInterval(interval);
  }, [items.length]); // re-run when items change

  if (items.length === 0) return null;

  const lastFetchedLabel = lastFetched 
    ? `Updated ${Math.floor((Date.now() - lastFetched) / 1000)}s ago`
    : 'Loading...';

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-[#1C1410] text-white shadow-2xl
      animate-in slide-in-from-bottom-4 duration-300">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-3">
        
        {/* Product thumbnails */}
        <div className="flex items-center gap-2 flex-1 overflow-x-auto scrollbar-none">
          {items.map(item => (
            <div key={item.productId} className="relative flex-shrink-0">
              <img 
                src={item.imageUrl} 
                alt={item.productName}
                className="w-10 h-10 rounded-lg object-contain bg-white p-0.5"
              />
              <button
                onClick={() => removeFromCompare(item.productId)}
                className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-red-500 
                  text-white text-[9px] flex items-center justify-center hover:bg-red-600"
              >
                ✕
              </button>
            </div>
          ))}
          
          {/* Empty slots */}
          {Array.from({ length: Math.max(0, 2 - items.length) }).map((_, i) => (
            <div key={i} className="w-10 h-10 rounded-lg border-2 border-dashed 
              border-white/20 flex items-center justify-center flex-shrink-0">
              <span className="text-white/30 text-lg">+</span>
            </div>
          ))}
        </div>

        {/* Info */}
        <div className="hidden sm:block text-xs text-white/60 flex-shrink-0">
          <div>{items.length}/4 products</div>
          <div className="flex items-center gap-1">
            {isFetching ? (
              <><RefreshCw className="w-3 h-3 animate-spin" /> Updating...</>
            ) : (
              <>{lastFetchedLabel}</>
            )}
          </div>
        </div>

        {/* Manual refresh */}
        <button
          onClick={() => fetchLiveData()}
          disabled={isFetching}
          className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors disabled:opacity-50"
          title="Refresh prices"
        >
          <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
        </button>

        {/* Compare button */}
        <button
          onClick={() => router.push(`/compare?ids=${items.map(i => i.productId).join(',')}`)}
          className="flex items-center gap-2 px-4 py-2.5 bg-masala-primary text-white 
            rounded-xl font-bold text-sm hover:bg-masala-secondary transition-colors flex-shrink-0"
        >
          <GitCompare className="w-4 h-4" />
          Compare ({items.length})
        </button>

        {/* Clear */}
        <button
          onClick={clearCompare}
          className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
```

─────────────────────────────────────────────
Compare data API (app/api/products/compare/route.ts)
─────────────────────────────────────────────

```typescript
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const ids = searchParams.get('ids')?.split(',').filter(Boolean) ?? [];
  
  if (ids.length === 0) return Response.json({ products: {} });
  if (ids.length > 4) return Response.json({ error: 'Max 4 products' }, { status: 400 });

  const products = await prisma.product.findMany({
    where: { id: { in: ids } },
    include: {
      prices: {
        orderBy: { price: 'asc' },
        select: {
          storeSlug: true, price: true, pricePerKg: true,
          inStock: true, url: true, storeHandle: true,
          variantId: true, updatedAt: true,
        }
      }
    }
  });

  // Key by productId for easy client-side lookup
  const keyed = Object.fromEntries(
    products.map(p => [p.id, {
      id: p.id, name: p.name, imageUrl: p.imageUrl,
      category: p.category, weight: p.weight, brand: p.brand,
      stores: p.prices,
      bestPrice: p.prices.find(pr => pr.inStock)?.price ?? null,
      bestStore: p.prices.find(pr => pr.inStock)?.storeSlug ?? null,
    }])
  );

  return Response.json({ 
    products: keyed,
    fetchedAt: new Date().toISOString(),
  }, {
    headers: { 'Cache-Control': 'no-store' } // always fresh for compare
  });
}
```

Output: stores/useCompare.ts (new), components/ui/CompareBar.tsx (rewrite),
        app/api/products/compare/route.ts (new)
```

---

## PROMPT 5 — New: Trending Deals Page (/deals) with Discount Section

```
[CONTEXT above]

Build a dedicated /deals page with:
1. Full product list sorted by discount % (not just 4 featured cards)
2. A "Flash Discounts" section at the top for biggest savings
3. Category filter tabs
4. Real discount calculation from price history

─────────────────────────────────────────────
PAGE: app/deals/page.tsx
─────────────────────────────────────────────

LAYOUT (top to bottom):
┌─────────────────────────────────────┐
│ PAGE HEADER: "🏷️ Trending Deals"   │
│ Subtitle + last updated time        │
├─────────────────────────────────────┤
│ CATEGORY TABS (sticky, scrollable)  │
│ All | Rice | Dal | Dairy | Spices.. │
├─────────────────────────────────────┤
│ ⚡ FLASH DISCOUNTS (top 4 deals)    │
│ Large horizontal cards, red badges  │
├─────────────────────────────────────┤
│ ALL DEALS — list/grid view toggle   │
│ ProductCard grid (4 col desktop)    │
│ Load more pagination                │
└─────────────────────────────────────┘

```typescript
// app/deals/page.tsx
import { Suspense } from 'react';
import { prisma } from '@/lib/prisma';
import ProductCard from '@/components/ui/ProductCard';
import ProductCardSkeleton from '@/components/ui/ProductCardSkeleton';

const CATEGORY_TABS = [
  { id: 'all',     label: 'All Deals',       emoji: '🏷️' },
  { id: 'rice',    label: 'Rice & Atta',      emoji: '🌾' },
  { id: 'dal',     label: 'Dal & Pulses',     emoji: '🫘' },
  { id: 'dairy',   label: 'Dairy & Ghee',     emoji: '🧈' },
  { id: 'spices',  label: 'Masala & Spices',  emoji: '🌶️' },
  { id: 'snacks',  label: 'Snacks',           emoji: '🍘' },
  { id: 'tea',     label: 'Tea & Coffee',     emoji: '🍵' },
  { id: 'frozen',  label: 'Frozen Food',      emoji: '🥗' },
];

async function getDeals(category?: string, sort = 'discount', limit = 48) {
  const where = {
    discountPercent: { gt: 3 },
    inStock: true,
    ...(category && category !== 'all' ? { category } : {}),
  };
  
  const deals = await prisma.productDeal.findMany({
    where,
    orderBy: sort === 'discount' 
      ? { discountPercent: 'desc' }
      : sort === 'price'
      ? { currentPrice: 'asc' }
      : { lastUpdated: 'desc' },
    take: limit,
  });
  
  return deals;
}

async function getFlashDeals() {
  // Top 4 biggest discounts (>15%)
  return prisma.productDeal.findMany({
    where: { discountPercent: { gt: 15 }, inStock: true },
    orderBy: { discountPercent: 'desc' },
    take: 4,
  });
}

export default async function DealsPage({
  searchParams,
}: {
  searchParams: { category?: string; sort?: string };
}) {
  const category = searchParams.category ?? 'all';
  const sort = searchParams.sort ?? 'discount';

  const [allDeals, flashDeals] = await Promise.all([
    getDeals(category, sort),
    getFlashDeals(),
  ]);

  return (
    <div className="min-h-screen bg-masala-bg">
      
      {/* ── PAGE HEADER ── */}
      <div className="bg-white border-b border-masala-border">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-end justify-between">
            <div>
              <h1 className="text-3xl font-black text-masala-text" style={{ fontFamily: 'Fraunces, serif' }}>
                🏷️ Trending Deals
              </h1>
              <p className="text-masala-text-muted mt-1">
                {allDeals.length} deals found across 8 stores · Updated every 2 hours
              </p>
            </div>
            <div className="text-right hidden sm:block">
              <p className="text-xs text-masala-text-muted">Sort by</p>
              <div className="flex gap-1 mt-1">
                {['discount', 'price', 'newest'].map(s => (
                  <a key={s} href={`/deals?category=${category}&sort=${s}`}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      sort === s 
                        ? 'bg-masala-primary text-white' 
                        : 'bg-masala-muted text-masala-text-muted hover:bg-masala-border'
                    }`}>
                    {s === 'discount' ? 'Biggest %' : s === 'price' ? 'Lowest Price' : 'Newest'}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── CATEGORY TABS — sticky ── */}
        <div className="border-t border-masala-border">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex gap-1 overflow-x-auto scrollbar-none py-3">
              {CATEGORY_TABS.map(tab => (
                <a
                  key={tab.id}
                  href={`/deals?category=${tab.id}&sort=${sort}`}
                  className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl 
                    text-sm font-bold transition-all whitespace-nowrap ${
                    category === tab.id
                      ? 'bg-masala-primary text-white shadow-sm'
                      : 'bg-masala-muted text-masala-text-muted hover:bg-masala-border hover:text-masala-text'
                  }`}
                >
                  <span>{tab.emoji}</span>
                  <span>{tab.label}</span>
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 space-y-10">

        {/* ── FLASH DISCOUNTS SECTION ── */}
        {flashDeals.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xl">⚡</span>
              <h2 className="text-xl font-black text-masala-text">Flash Discounts</h2>
              <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-[10px] font-black">
                BIGGEST SAVINGS
              </span>
            </div>
            
            {/* Horizontal scroll on mobile, 4-col grid on desktop */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {flashDeals.map(deal => (
                <FlashDealCard key={deal.id} deal={deal} />
              ))}
            </div>
          </section>
        )}

        {/* ── ALL DEALS GRID ── */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-black text-masala-text">
              {category === 'all' ? 'All Deals' : CATEGORY_TABS.find(t => t.id === category)?.label}
            </h2>
            <span className="text-sm text-masala-text-muted">{allDeals.length} deals</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {allDeals.map((deal, i) => (
              <DealCard key={deal.id} deal={deal} rank={i + 1} />
            ))}
          </div>

          {allDeals.length === 0 && (
            <div className="text-center py-20 text-masala-text-muted">
              <p className="text-4xl mb-3">🔍</p>
              <p className="font-semibold">No deals in this category right now</p>
              <p className="text-sm mt-1">Check back soon — we update every 2 hours</p>
              <a href="/deals" className="mt-4 inline-block text-masala-primary font-bold hover:underline">
                View all deals →
              </a>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

// ── Flash Deal Card — large, prominent ──
function FlashDealCard({ deal }: { deal: any }) {
  return (
    <div className="bg-white rounded-2xl border border-masala-border overflow-hidden 
      hover:shadow-lg hover:border-red-200 transition-all group">
      
      {/* Image with discount badge */}
      <div className="relative aspect-[4/3] bg-masala-muted/40 p-4">
        <div className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-red-500 text-white 
          text-sm font-black shadow-sm">
          -{Math.round(deal.discountPercent)}%
        </div>
        <img src={deal.imageUrl} alt={deal.productName}
          className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-200" />
      </div>

      <div className="p-3">
        <p className="font-semibold text-[14px] text-masala-text line-clamp-2 mb-1">
          {deal.productName}
        </p>
        <p className="text-xs text-masala-text-muted mb-2">{deal.weight}</p>
        
        <div className="flex items-baseline gap-2 mb-1">
          <span className="text-xl font-bold text-masala-primary">€{deal.currentPrice.toFixed(2)}</span>
          <span className="text-sm text-masala-text-muted line-through">€{deal.avgPrice7d.toFixed(2)}</span>
        </div>
        
        <p className="text-xs text-green-600 font-bold mb-3">
          Save €{deal.savingsAmount.toFixed(2)} vs avg price
        </p>
        
        <a href={`/api/redirect?pid=${deal.productId}&store=${deal.storeSlug}`}
          target="_blank" rel="noopener noreferrer"
          className="w-full h-9 bg-masala-primary text-white rounded-xl text-sm font-bold 
            flex items-center justify-center hover:bg-masala-secondary transition-colors">
          🛒 Buy Now
        </a>
      </div>
    </div>
  );
}

// ── Regular Deal Card — compact ──
function DealCard({ deal, rank }: { deal: any; rank: number }) {
  return (
    <div className="bg-white rounded-2xl border border-masala-border overflow-hidden 
      hover:shadow-md hover:border-masala-primary/20 transition-all">
      
      <div className="relative aspect-square bg-masala-muted/40 p-3">
        {deal.discountPercent > 0 && (
          <span className="absolute top-2 right-2 px-1.5 py-0.5 rounded-md bg-red-100 
            text-red-700 text-[10px] font-black">
            -{Math.round(deal.discountPercent)}%
          </span>
        )}
        <img src={deal.imageUrl} alt={deal.productName}
          className="w-full h-full object-contain" />
      </div>

      <div className="p-2.5">
        <p className="text-[13px] font-semibold text-masala-text line-clamp-2 mb-0.5">
          {deal.productName}
        </p>
        <p className="text-[11px] text-masala-text-muted mb-2">{deal.weight}</p>
        
        <div className="flex items-baseline gap-1.5 mb-0.5">
          <span className="text-[17px] font-bold text-masala-primary">€{deal.currentPrice.toFixed(2)}</span>
          <span className="text-[11px] text-masala-text-muted line-through">€{deal.avgPrice7d.toFixed(2)}</span>
        </div>
        <p className="text-[10px] text-green-600 font-semibold mb-2">
          Save €{deal.savingsAmount.toFixed(2)}
        </p>
        
        <a href={`/api/redirect?pid=${deal.productId}&store=${deal.storeSlug}`}
          target="_blank" rel="noopener noreferrer"
          className="w-full h-8 bg-masala-primary text-white rounded-lg text-[12px] font-bold 
            flex items-center justify-center hover:bg-masala-secondary transition-colors">
          Buy Now
        </a>
      </div>
    </div>
  );
}
```

─────────────────────────────────────────────
Add deals link to navigation
─────────────────────────────────────────────
In components/layout/Header.tsx — add deals link:
```typescript
<Link href="/deals" className="flex items-center gap-1.5 text-sm font-bold text-masala-primary hover:text-masala-secondary">
  🏷️ Deals
</Link>
```

Also add to mobile menu and footer partner links.

Output: app/deals/page.tsx (new, complete), Header.tsx (add deals nav link)
```

---

## RUN ORDER (Critical path)

```
⚠️  MOST URGENT — run immediately:
1. PROMPT 1 (UUID cart bug) — users are hitting broken pages on dookan.de
2. PROMPT 2 (Header layout) — first visual impression broken on desktop

🔧  FUNCTIONAL FIXES:
3. PROMPT 3 (Mobile AJAX search) — search broken on mobile
4. PROMPT 4 (Compare refresh) — compare feature unusable without it

✨  NEW FEATURES:
5. PROMPT 5 (Deals page) — after core bugs are fixed
```

---

## DOMAIN VERIFICATION CHECKLIST (do manually before running Prompt 1)

```
Verify each store's actual domain by checking your scraper config:
□ dookan → dookan.de (NOT .eu, NOT .com)
□ jamoona → jamoona.de (verify)
□ swadesh → swadesh.de (verify)
□ nammamarkt → nammamarkt.com (verify)
□ angaadi → angaadi.de (verify)
□ littleindia → little-india.de (verify the hyphen)
□ spicevillage → spicevillage.eu (this one IS .eu)
□ grocera → grocera.de (verify)

Check your scraper's base URL config file and copy those EXACT domains
into STORE_BASE_URLS in lib/cartRedirect.ts — they must match.
```

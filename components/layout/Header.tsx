'use client';

import Link from 'next/link';
import { usePathname, useSearchParams, useRouter } from 'next/navigation';
import { ShoppingCart, Search } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import Logo from '@/components/ui/Logo';
import SearchAutocomplete from '@/components/search/SearchAutocomplete';
import { useLang } from '@/lib/utils/LanguageContext';
import { useSmartCart } from '@/stores/useSmartCart';
import dynamic from 'next/dynamic';

const SmartCartPanel = dynamic(() => import('@/components/ui/SmartCartPanel'), { ssr: false });

const CATEGORIES = [
  { label: 'All',       slug: '',       query: '' },
  { label: 'Rice & Atta', slug: 'rice',   query: 'rice' },
  { label: 'Spices',   slug: 'spices',  query: 'spices' },
  { label: 'Snacks',   slug: 'snacks',  query: 'chips' },
  { label: 'Dairy',    slug: 'dairy',   query: 'milk' },
  { label: 'Frozen',   slug: 'frozen',  query: 'frozen' },
  { label: 'Deals',    slug: 'deals',   query: '' },
];

export default function Header() {
  const [cartOpen, setCartOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [mobileSearchQuery, setMobileSearchQuery] = useState('');
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { t } = useLang();
  const { getTotalItems } = useSmartCart();
  const totalItems = getTotalItems();
  const mobileInputRef = useRef<HTMLInputElement>(null);

  const isHome = pathname === '/';
  const isSearch = pathname.startsWith('/search');
  const currentQ = searchParams?.get('q') ?? '';

  // Sync input with URL query when on search page
  useEffect(() => {
    if (isSearch && currentQ) {
      setMobileSearchQuery(currentQ);
    } else if (!isSearch) {
      setMobileSearchQuery('');
    }
  }, [isSearch, currentQ]);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleMobileSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = mobileSearchQuery.trim();
    if (q.length >= 2) {
      router.push(`/search?q=${encodeURIComponent(q)}`);
      mobileInputRef.current?.blur();
    }
  };

  // Determine which category pill is active based on current search query
  const activeCategorySlug = (() => {
    if (!isSearch || !currentQ) return '';
    const q = currentQ.toLowerCase();
    if (/rice|atta|basmati|wheat/.test(q)) return 'rice';
    if (/spice|masala|turmeric|cumin|coriander/.test(q)) return 'spices';
    if (/chips|snack|namkeen|biscuit/.test(q)) return 'snacks';
    if (/milk|dairy|paneer|curd|dahi|yogurt/.test(q)) return 'dairy';
    if (/frozen/.test(q)) return 'frozen';
    return '';
  })();

  return (
    <>
      <header className="sticky top-0 z-50 bg-white shadow-sm">

        {/* ── Top bar: Logo + Search + Cart ── */}
        <div className="flex items-center px-4 md:px-8 h-14 md:h-20 border-b border-masala-border/60 max-w-[1600px] mx-auto w-full">

          {/* Logo */}
          <div className="flex-shrink-0">
            <Logo />
          </div>


          {/* Desktop search - FIXED: expanded for central prominence */}
          <div className="hidden md:block flex-1 max-w-3xl mx-8 lg:mx-16">
            <SearchAutocomplete size="header" />
          </div>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-2">
            {[
              { href: '/blog', label: t('nav.blog') },
              { href: '/alerts', label: t('nav.priceAlert') },
              { href: '/account', label: t('nav.account') },
            ].map(link => (
              <Link
                key={link.href}
                href={link.href}
                className="px-4 py-2 rounded-xl text-sm font-bold text-masala-text hover:text-masala-primary hover:bg-masala-muted/40 transition-colors"
              >
                {link.label}
              </Link>
            ))}
            <button
              onClick={() => setCartOpen(true)}
              className="relative ml-2 p-2.5 rounded-xl bg-masala-muted/40 text-masala-text hover:text-masala-primary hover:bg-masala-muted/60 transition-colors"
              aria-label="Open Smart Cart"
            >
              <ShoppingCart className="h-5 w-5" />
              {mounted && totalItems > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-masala-primary text-white text-[10px] font-black flex items-center justify-center shadow-sm">
                  {totalItems > 9 ? '9+' : totalItems}
                </span>
              )}
            </button>
          </nav>

          {/* Mobile: Cart button */}
          <button
            onClick={() => setCartOpen(true)}
            className="md:hidden ml-auto relative flex items-center justify-center w-11 h-11 rounded-2xl bg-masala-muted/40 text-masala-text active:scale-90 transition-all"
            aria-label="Open Smart Cart"
          >
            <ShoppingCart className="h-[22px] w-[22px]" />
            {mounted && totalItems > 0 && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-masala-primary text-white text-[9px] font-black flex items-center justify-center">
                {totalItems > 9 ? '9+' : totalItems}
              </span>
            )}
          </button>
        </div>

        {/* ── Mobile: Full-width search bar ── */}
        <div className="md:hidden px-4 pt-2.5 pb-1.5 border-b border-masala-border/60">
          {/* On homepage: tapping opens search page. On search: live input. */}
          {isSearch ? (
            <form onSubmit={handleMobileSearch} className="relative flex items-center">
              <Search
                className="absolute left-3.5 text-masala-text-muted pointer-events-none"
                style={{ width: '18px', height: '18px' }}
              />
              <input
                ref={mobileInputRef}
                type="search"
                inputMode="search"
                enterKeyHint="search"
                value={mobileSearchQuery}
                onChange={e => setMobileSearchQuery(e.target.value)}
                placeholder="Search Indian groceries…"
                className="w-full h-11 pl-10 pr-4 rounded-2xl bg-masala-muted/50 border border-masala-border text-[14px] text-masala-text placeholder:text-masala-text-muted focus:outline-none focus:border-masala-primary focus:bg-white transition-all"
              />
            </form>
          ) : (
            // On homepage: tap target that goes to /search
            <Link
              href="/search"
              className="flex items-center gap-2.5 h-11 px-4 rounded-2xl bg-masala-muted/50 border border-masala-border text-[14px] text-masala-text-muted hover:border-masala-primary transition-all w-full"
            >
              <Search style={{ width: '18px', height: '18px', flexShrink: 0 }} />
              <span>Search Indian groceries…</span>
            </Link>
          )}
        </div>

        {/* ── Mobile: Category pill strip ── */}
        <div className="md:hidden flex items-center overflow-x-auto scrollbar-hide px-3 py-2 gap-0">
          {CATEGORIES.map(cat => {
            const isActive = cat.slug === activeCategorySlug;
            const href = cat.slug === 'deals'
              ? '/deals'
              : cat.query
              ? `/search?q=${encodeURIComponent(cat.query)}`
              : isSearch ? '#' : '/search';

            return (
              <Link
                key={cat.slug}
                href={href}
                onClick={cat.slug === '' && isSearch ? (e) => { e.preventDefault(); router.push('/search'); } : undefined}
                className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-[11px] font-bold mr-2 transition-all active:scale-95 whitespace-nowrap ${
                  isActive
                    ? 'bg-masala-primary text-white shadow-sm'
                    : 'bg-masala-muted/50 text-masala-text-muted hover:bg-masala-muted hover:text-masala-text'
                }`}
              >
                {cat.label}
              </Link>
            );
          })}
        </div>
      </header>

      {/* Smart Cart slide-in panel */}
      {cartOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[55]"
            onClick={() => setCartOpen(false)}
          />
          <SmartCartPanel onClose={() => setCartOpen(false)} />
        </>
      )}
    </>
  );
}

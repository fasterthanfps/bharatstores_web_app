'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X, TrendingUp, Clock, ChevronRight } from 'lucide-react';

interface Suggestion {
  productId: string;
  term: string;
  category: string;
  brand: string;
  imageUrl: string;
  storeCount: number;
  bestPrice: number | null;
}

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export default function SearchBar({
  initialQuery = '',
  size = 'hero',
  autoFocus = false,
}: {
  initialQuery?: string;
  size?: 'hero' | 'header';
  autoFocus?: boolean;
}) {
  const [query, setQuery] = useState(initialQuery);
  const [open, setOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [popular, setPopular] = useState<string[]>([]);
  const [recent, setRecent] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);

  const inputRef = useRef<HTMLInputElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const touchRef = useRef(false);
  const router = useRouter();
  const debouncedQ = useDebounce(query, 220);
  const isHero = size === 'hero';

  // Load recent + popular on mount
  useEffect(() => {
    try {
      setRecent(JSON.parse(localStorage.getItem('bs-recent') ?? '[]').slice(0, 5));
    } catch {}
    fetch('/api/search/popular')
      .then(r => r.json())
      .then(d => setPopular(d.terms ?? []))
      .catch(() => {});
  }, []);

  // Fetch suggestions
  useEffect(() => {
    setSuggestions([]);
    setActiveIdx(-1);
    const q = debouncedQ.trim();
    if (q.length < 2) { setLoading(false); return; }

    setLoading(true);
    const ctrl = new AbortController();

    fetch(`/api/search/suggest?q=${encodeURIComponent(q)}`, { signal: ctrl.signal })
      .then(r => r.json())
      .then(d => { setSuggestions(d.suggestions ?? []); setLoading(false); })
      .catch(e => { if (e.name !== 'AbortError') setLoading(false); });

    return () => ctrl.abort();
  }, [debouncedQ]);

  // Outside click closes dropdown — works for both mouse and touch
  useEffect(() => {
    const handler = (e: MouseEvent | TouchEvent) => {
      if (!wrapperRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    document.addEventListener('touchstart', handler, { passive: true });
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('touchstart', handler);
    };
  }, []);

  const saveRecent = useCallback((term: string) => {
    try {
      const prev = JSON.parse(localStorage.getItem('bs-recent') ?? '[]') as string[];
      const next = [term, ...prev.filter(t => t !== term)].slice(0, 8);
      localStorage.setItem('bs-recent', JSON.stringify(next));
      setRecent(next.slice(0, 5));
    } catch {}
  }, []);

  const submit = useCallback((q: string) => {
    const term = q.trim();
    if (!term) return;
    saveRecent(term);
    setOpen(false);
    setSuggestions([]);
    setQuery(term);
    router.push(`/search?q=${encodeURIComponent(term)}`);
  }, [router, saveRecent]);

  const handleKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const items = suggestions.length ? suggestions : [];
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIdx(i => Math.min(i + 1, items.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIdx(i => Math.max(i - 1, -1)); }
    else if (e.key === 'Enter') { e.preventDefault(); activeIdx >= 0 && items[activeIdx] ? submit(items[activeIdx].term) : submit(query); }
    else if (e.key === 'Escape') { setOpen(false); inputRef.current?.blur(); }
  };

  const showSuggestions = open && (loading || suggestions.length > 0 || (query.trim().length >= 2 && !loading));
  const showPopular = open && query.trim().length < 2 && (popular.length > 0 || recent.length > 0);

  return (
    <div ref={wrapperRef} className="relative w-full">

      {/* Input row */}
      <div className={`relative flex items-center bg-white rounded-2xl border-2 transition-all duration-200 ${
        open ? 'border-masala-primary shadow-xl shadow-masala-primary/10' : 'border-masala-border shadow-sm hover:border-masala-primary/40'
      }`}>
        <Search className={`absolute left-4 transition-colors ${open ? 'text-masala-primary' : 'text-masala-text-muted'} ${isHero ? 'w-5 h-5' : 'w-4 h-4'}`} />

        <input
          ref={inputRef}
          type="text"
          value={query}
          autoFocus={autoFocus}
          onChange={e => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKey}
          placeholder="Search Indian groceries..."
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          inputMode="search"
          enterKeyHint="search"
          className={`w-full bg-transparent border-none outline-none ring-0 focus:ring-0 text-masala-text placeholder:text-masala-text-muted/60 font-medium ${
            isHero ? 'h-14 pl-12 pr-40 text-base' : 'h-11 pl-10 pr-32 text-[15px]'
          }`}
        />

        {query && (
          <button type="button"
            onMouseDown={e => { e.preventDefault(); setQuery(''); setSuggestions([]); inputRef.current?.focus(); }}
            onTouchEnd={e => { e.preventDefault(); setQuery(''); setSuggestions([]); inputRef.current?.focus(); }}
            className="absolute right-[124px] p-2 text-masala-text-muted hover:text-masala-text transition-colors">
            <X className="w-4 h-4" />
          </button>
        )}

        <button type="button"
          onMouseDown={e => { e.preventDefault(); submit(query); }}
          onTouchEnd={e => { e.preventDefault(); submit(query); }}
          className={`absolute right-2 bg-masala-primary text-white font-black uppercase tracking-wide rounded-xl hover:bg-masala-secondary active:scale-95 transition-all flex items-center justify-center gap-2 shadow-sm ${
            isHero ? 'h-11 px-6 sm:px-8 text-xs' : 'h-8 px-4 sm:px-5 text-[11px]'
          }`}>
          <Search className="w-4 h-4 sm:hidden" />
          <span className="hidden sm:inline">Search</span>
        </button>
      </div>

      {/* Dropdown — z-[999] ensures nothing covers it */}
      {(showSuggestions || showPopular) && (
        <div
          className="absolute left-0 right-0 top-full mt-2 z-[999] bg-white rounded-2xl shadow-2xl border border-masala-border overflow-hidden"
          onMouseDown={e => e.stopPropagation()}
          onTouchStart={e => { touchRef.current = true; e.stopPropagation(); }}
          onTouchEnd={() => setTimeout(() => { touchRef.current = false; }, 400)}
        >

          {/* Suggestions */}
          {showSuggestions && (
            <>
              {loading && (
                <div className="p-3 space-y-2">
                  {[0,1,2].map(i => (
                    <div key={i} className="flex items-center gap-3 px-2 py-1 animate-pulse">
                      <div className="w-9 h-9 rounded-xl bg-masala-muted flex-shrink-0" />
                      <div className="flex-1 space-y-1.5">
                        <div className="h-3.5 bg-masala-muted rounded-full w-3/5" />
                        <div className="h-2.5 bg-masala-muted rounded-full w-2/5" />
                      </div>
                      <div className="h-3 bg-masala-muted rounded-full w-12" />
                    </div>
                  ))}
                </div>
              )}

              {!loading && suggestions.length > 0 && (
                <div className="py-2">
                  <p className="px-4 pt-1 pb-2 text-[10px] font-black uppercase tracking-[0.2em] text-masala-text-muted">
                    Products
                  </p>
                  {suggestions.map((s, i) => (
                    <button key={s.productId} type="button"
                      onMouseDown={e => { e.preventDefault(); submit(s.term); }}
                      onTouchEnd={e => { e.preventDefault(); submit(s.term); }}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${activeIdx === i ? 'bg-masala-muted' : 'hover:bg-masala-muted/70'}`}>
                      <div className="w-9 h-9 rounded-xl bg-masala-muted/60 flex-shrink-0 overflow-hidden">
                        {s.imageUrl
                          ? <img src={s.imageUrl} alt={s.term} className="w-full h-full object-contain p-0.5" />
                          : <div className="w-full h-full flex items-center justify-center text-lg">🛒</div>
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[14px] font-semibold text-masala-text truncate">
                          {highlightMatch(s.term, query)}
                        </p>
                        <p className="text-[11px] text-masala-text-muted truncate">
                          {s.category}{s.brand && s.brand !== s.term ? ` · ${s.brand}` : ''}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        {s.bestPrice != null && (
                          <p className="text-[14px] font-bold text-masala-primary">from €{s.bestPrice.toFixed(2)}</p>
                        )}
                        <p className="text-[11px] text-masala-text-muted">{s.storeCount} store{s.storeCount !== 1 ? 's' : ''}</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-masala-text-muted flex-shrink-0" />
                    </button>
                  ))}
                  <button
                    onMouseDown={e => { e.preventDefault(); submit(query); }}
                    onTouchEnd={e => { e.preventDefault(); submit(query); }}
                    className="w-full flex items-center justify-between px-4 py-3 border-t border-masala-border hover:bg-masala-muted/50 transition-colors">
                    <span className="text-sm font-bold text-masala-primary">See all results for "{query.trim()}"</span>
                    <ChevronRight className="w-4 h-4 text-masala-primary" />
                  </button>
                </div>
              )}

              {!loading && suggestions.length === 0 && query.trim().length >= 2 && (
                <div className="px-4 py-6 text-center">
                  <p className="text-sm text-masala-text-muted mb-1">No suggestions for "{query}"</p>
                  <button onMouseDown={e => { e.preventDefault(); submit(query); }}
                    className="text-sm font-bold text-masala-primary hover:underline">
                    Search anyway →
                  </button>
                </div>
              )}
            </>
          )}

          {/* Popular + Recent */}
          {showPopular && (
            <div className="p-4 space-y-4">
              {recent.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <p className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-masala-text-muted">
                      <Clock className="w-3 h-3" /> Recent
                    </p>
                    <button onMouseDown={e => { e.preventDefault(); localStorage.removeItem('bs-recent'); setRecent([]); }}
                      className="text-[10px] text-masala-text-muted hover:text-red-500">Clear</button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {recent.map(term => (
                      <button key={term}
                        onMouseDown={e => { e.preventDefault(); submit(term); }}
                        onTouchEnd={e => { e.preventDefault(); submit(term); }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-masala-muted text-[12px] font-medium text-masala-text hover:bg-masala-primary hover:text-white transition-all">
                        <Clock className="w-3 h-3 opacity-60" />{term}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <div>
                <p className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-masala-text-muted mb-2.5">
                  <TrendingUp className="w-3 h-3 text-masala-primary" /> Trending This Week
                </p>
                <div className="flex flex-wrap gap-2">
                  {popular.map((term, i) => (
                    <button key={term}
                      onMouseDown={e => { e.preventDefault(); submit(term); }}
                      onTouchEnd={e => { e.preventDefault(); submit(term); }}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-masala-border text-[12px] font-semibold text-masala-text hover:bg-masala-primary hover:text-white hover:border-masala-primary transition-all">
                      {i < 3 && (
                        <span className="w-4 h-4 rounded-full bg-masala-primary text-white text-[9px] font-black flex items-center justify-center flex-shrink-0">
                          {i + 1}
                        </span>
                      )}
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

function highlightMatch(text: string, query: string): React.ReactNode {
  if (!query.trim()) return text;
  const idx = text.toLowerCase().indexOf(query.toLowerCase().trim());
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <span className="font-black text-masala-primary">{text.slice(idx, idx + query.trim().length)}</span>
      {text.slice(idx + query.trim().length)}
    </>
  );
}

'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X, Clock, ChevronRight } from 'lucide-react';

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
  const [recent, setRecent] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);

  const inputRef = useRef<HTMLInputElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const debouncedQ = useDebounce(query, 220);
  const isHero = size === 'hero';

  // Load recent searches on mount
  useEffect(() => {
    try {
      setRecent(JSON.parse(localStorage.getItem('bs-recent') ?? '[]').slice(0, 5));
    } catch {}
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
    window.dispatchEvent(new Event('nav-start'));
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
  const showRecent = open && query.trim().length < 2 && recent.length > 0;

  return (
    <div ref={wrapperRef} className="relative w-full">

      {/* Input row */}
      <div
        className={`relative flex items-center bg-white transition-all duration-300 rounded-2xl ${
          open
            ? 'border-2 border-masala-primary'
            : 'border border-masala-border hover:border-masala-primary/35'
        }`}
        style={{
          boxShadow: open
            ? '0 4px 24px rgba(139,32,32,0.12)'
            : '0 2px 12px rgba(139,32,32,0.06)',
        }}
      >
        <Search className={`absolute transition-colors ${open ? 'text-masala-primary' : 'text-masala-text-muted'} ${isHero ? 'left-5 w-5 h-5' : 'left-4 w-4 h-4'}`} />

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
          className={`w-full bg-transparent border-none outline-none ring-0 focus:ring-0 text-masala-text placeholder:text-masala-text-muted/50 font-semibold tracking-wide ${
            isHero ? 'pl-14 pr-44 text-[17px]' : 'h-11 pl-11 pr-32 text-[14px]'
          }`}
          style={isHero ? { height: '60px' } : {}}
        />

        {query && (
          <button type="button"
            onMouseDown={e => e.preventDefault()}
            onClick={() => { setQuery(''); setSuggestions([]); inputRef.current?.focus(); }}
            className={`absolute p-2 text-masala-text-muted hover:text-masala-text transition-colors ${isHero ? 'right-36' : 'right-28'}`}>
            <X className="w-4 h-4" />
          </button>
        )}

        <button type="button"
          onMouseDown={e => e.preventDefault()}
          onClick={() => submit(query)}
          className={`absolute right-2 bg-masala-primary text-white font-extrabold tracking-[0.02em] hover:scale-[1.02] active:scale-[0.97] transition-all flex items-center justify-center gap-2 ${
            isHero ? 'text-[14px] rounded-xl' : 'text-[10px] rounded-xl'
          }`}
          style={{
            height: isHero ? '46px' : '32px',
            paddingLeft: isHero ? '28px' : '18px',
            paddingRight: isHero ? '28px' : '18px',
            background: '#8B2020',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = '#6B1818')}
          onMouseLeave={e => (e.currentTarget.style.background = '#8B2020')}
        >
          <Search className="w-4 h-4 sm:hidden" />
          <span className="hidden sm:inline">Search</span>
        </button>
      </div>

      {/* Dropdown */}
      {(showSuggestions || showRecent) && (
        <div
          className="absolute left-0 right-0 top-full mt-2 z-[999] bg-white rounded-2xl border border-masala-border overflow-hidden"
          style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.10), 0 2px 8px rgba(0,0,0,0.06)' }}
          onMouseDown={e => e.stopPropagation()}
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
                  <div className="flex items-center gap-2 px-4 pt-3 pb-2">
                    <div className="w-0.5 h-3.5 bg-masala-primary rounded-full" />
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-masala-text-muted">
                      Products
                    </p>
                  </div>
                  {suggestions.map((s, i) => (
                    <button key={s.productId} type="button"
                      onMouseDown={e => e.preventDefault()}
                      onClick={() => submit(s.term)}
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
                    onMouseDown={e => e.preventDefault()}
                    onClick={() => submit(query)}
                    className="w-full flex items-center justify-between px-4 border-t border-masala-border hover:bg-masala-muted/50 transition-colors text-left"
                    style={{ height: '44px' }}>
                    <span className="text-[13px] font-bold text-masala-primary">See all results for &ldquo;{query.trim()}&rdquo; →</span>
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

          {/* Recent Searches only — shown when input is empty */}
          {showRecent && (
            <div className="p-4">
              <div className="flex items-center justify-between mb-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-0.5 h-3.5 bg-masala-primary rounded-full" />
                  <p className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-masala-text-muted">
                    <Clock className="w-3 h-3" /> Recent Searches
                  </p>
                </div>
                <button
                  onMouseDown={e => e.preventDefault()}
                  onClick={() => { localStorage.removeItem('bs-recent'); setRecent([]); }}
                  className="text-[10px] text-masala-text-muted hover:text-red-500">Clear</button>
              </div>
              <div className="flex flex-wrap gap-2">
                {recent.map(term => (
                  <button key={term}
                    onMouseDown={e => e.preventDefault()}
                    onClick={() => submit(term)}
                    className="flex items-center gap-1.5 px-3 rounded-xl bg-masala-muted text-[12px] font-medium text-masala-text hover:bg-masala-primary hover:text-white transition-all duration-150"
                    style={{ height: '32px' }}>
                    <Clock className="w-3 h-3 opacity-60" />{term}
                  </button>
                ))}
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

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X, TrendingUp } from 'lucide-react';

const PLACEHOLDER_CYCLE = [
    'Basmati Reis suchen...',
    'Amul Ghee finden...',
    'MDH Masala vergleichen...',
    'Toor Dal günstig kaufen...',
    'Atta Mehl Preisvergleich...',
];

const POPULAR_SEARCHES = [
    'Basmati Reis', 'Amul Ghee', 'MDH Masala', 'Toor Dal',
    'Atta Mehl', 'Chai Tee', 'Paneer', 'Chana Dal',
];

interface SearchBarProps {
    initialQuery?: string;
    autoFocus?: boolean;
    size?: 'hero' | 'header';
}

export default function SearchBar({
    initialQuery = '',
    autoFocus = false,
    size = 'hero',
}: SearchBarProps) {
    const [query, setQuery] = useState(initialQuery);
    const [isFocused, setIsFocused] = useState(false);
    const [placeholder, setPlaceholder] = useState(PLACEHOLDER_CYCLE[0]);
    const [placeholderIndex, setPlaceholderIndex] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);
    const router = useRouter();

    // Cycle placeholder text
    useEffect(() => {
        if (query) return;
        const interval = setInterval(() => {
            setPlaceholderIndex((i) => {
                const next = (i + 1) % PLACEHOLDER_CYCLE.length;
                setPlaceholder(PLACEHOLDER_CYCLE[next]);
                return next;
            });
        }, 2500);
        return () => clearInterval(interval);
    }, [query]);

    const handleSubmit = useCallback(
        (q: string) => {
            const trimmed = q.trim();
            if (!trimmed) return;
            router.push(`/search?q=${encodeURIComponent(trimmed)}`);
            setIsFocused(false);
        },
        [router]
    );

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') handleSubmit(query);
        if (e.key === 'Escape') {
            setIsFocused(false);
            inputRef.current?.blur();
        }
    };

    const isHero = size === 'hero';

    return (
        <div className="relative w-full">
            <div
                className={`relative flex items-center rounded-2xl border transition-all duration-300 ${isFocused
                    ? 'border-masala-primary/60 shadow-lg shadow-masala-primary/10 bg-white'
                    : 'border-masala-border bg-white hover:border-masala-primary/30 shadow-sm'
                    }`}
            >
                <Search
                    className={`absolute left-4 text-masala-text/40 transition-colors ${isFocused ? 'text-masala-primary' : ''
                        } ${isHero ? 'h-5 w-5' : 'h-4 w-4'}`}
                />
                <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setTimeout(() => setIsFocused(false), 200)}
                    onKeyDown={handleKeyDown}
                    placeholder="Produkte suchen..."
                    className={`w-full bg-transparent border-none rounded-2xl text-masala-text placeholder:text-masala-text/40 focus:outline-none focus:ring-0 transition-all ${isHero ? 'h-14 pl-12 pr-32 text-base' : 'h-11 pl-10 pr-24 text-sm'
                        }`}
                    aria-label="Produkte suchen"
                    autoComplete="off"
                    spellCheck={false}
                />
                {query && (
                    <button
                        onMouseDown={(e) => {
                            e.preventDefault();
                            setQuery('');
                            inputRef.current?.focus();
                        }}
                        className={`absolute flex items-center justify-center text-masala-text/40 hover:text-masala-text transition-colors ${isHero ? 'right-28' : 'right-20'
                            }`}
                        aria-label="Suche löschen"
                    >
                        <X className="h-4 w-4" />
                    </button>
                )}
                <button
                    id="search-submit"
                    onClick={() => handleSubmit(query)}
                    className={`absolute right-1.5 font-black uppercase tracking-widest rounded-xl bg-masala-primary text-white hover:bg-masala-secondary active:scale-[0.98] transition-all shadow-md flex items-center justify-center ${isHero
                        ? 'h-11 px-6 sm:px-10 text-xs'
                        : 'h-8 px-4 sm:px-5 text-[10px]'
                        }`}
                >
                    <Search className="h-4 w-4 sm:hidden" />
                    <span className="hidden sm:inline">Suchen</span>
                </button>
            </div>

            {/* Popular searches dropdown */}
            {isFocused && !query && (
                <div className="absolute top-full left-0 right-0 mt-3 z-50 bg-white rounded-3xl p-5 shadow-2xl border border-masala-border animate-in fade-in slide-in-from-top-2 duration-300">
                    <p className="flex items-center gap-2 text-[10px] text-masala-text/40 font-black uppercase tracking-[0.2em] px-1 mb-4">
                        <TrendingUp className="h-3.5 w-3.5 text-masala-primary" />
                        Beliebte Suchen
                    </p>
                    <div className="flex flex-wrap gap-2.5">
                        {POPULAR_SEARCHES.map((term) => (
                            <button
                                key={term}
                                onMouseDown={(e) => {
                                    e.preventDefault();
                                    handleSubmit(term);
                                }}
                                className="px-4 py-2 rounded-xl bg-masala-pill hover:bg-masala-primary hover:text-white text-xs font-bold text-masala-text transition-all border border-masala-border hover:border-masala-primary hover:shadow-md hover:shadow-masala-primary/20"
                            >
                                {term}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X, TrendingUp, Tag } from 'lucide-react';
import { useLang } from '@/lib/utils/LanguageContext';
import Link from 'next/link';

// Inline debounce hook to keep it self-contained
function useDebounceValue<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);
    useEffect(() => {
        const timer = setTimeout(() => setDebouncedValue(value), delay);
        return () => clearTimeout(timer);
    }, [value, delay]);
    return debouncedValue;
}

const PLACEHOLDER_CYCLES: Record<'en' | 'de', string[]> = {
    en: [
        'Search for Basmati Rice...',
        'Find Amul Ghee...',
        'Compare MDH Masala...',
        'Best price for Toor Dal...',
        'Search Atta Flour...',
    ],
    de: [
        'Basmati Reis suchen...',
        'Amul Ghee finden...',
        'MDH Masala vergleichen...',
        'Toor Dal günstig kaufen...',
        'Atta Mehl Preisvergleich...',
    ],
};

const POPULAR_SEARCHES = [
    'Basmati Rice', 'Amul Ghee', 'MDH Masala', 'Toor Dal',
    'Atta', 'Chai', 'Paneer', 'Chana Dal',
];

interface AutocompleteSuggestion {
    name: string;
    category: string;
}

interface SearchAutocompleteProps {
    initialQuery?: string;
    autoFocus?: boolean;
    size?: 'hero' | 'header';
}

export default function SearchAutocomplete({
    initialQuery = '',
    autoFocus = false,
    size = 'hero',
}: SearchAutocompleteProps) {
    const [query, setQuery] = useState(initialQuery);
    const [isFocused, setIsFocused] = useState(false);
    const [placeholderIndex, setPlaceholderIndex] = useState(0);
    const [suggestions, setSuggestions] = useState<AutocompleteSuggestion[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(-1);
    
    const inputRef = useRef<HTMLInputElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const router = useRouter();
    const { lang, t } = useLang();
    
    const debouncedQuery = useDebounceValue(query, 300);
    const isHero = size === 'hero';
    const PLACEHOLDER_CYCLE = PLACEHOLDER_CYCLES[lang];

    // Cycle placeholder text
    useEffect(() => {
        if (query) return;
        const interval = setInterval(() => {
            setPlaceholderIndex((i) => (i + 1) % PLACEHOLDER_CYCLE.length);
        }, 2500);
        return () => clearInterval(interval);
    }, [query, PLACEHOLDER_CYCLE.length]);

    // Handle outside click
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                dropdownRef.current && 
                !dropdownRef.current.contains(event.target as Node) &&
                inputRef.current &&
                !inputRef.current.contains(event.target as Node)
            ) {
                setIsFocused(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Fetch suggestions
    useEffect(() => {
        async function fetchSuggestions() {
            const q = debouncedQuery.trim();
            if (q.length < 2) {
                setSuggestions([]);
                setIsLoading(false);
                return;
            }

            setIsLoading(true);
            try {
                const res = await fetch(`/api/autocomplete?q=${encodeURIComponent(q)}`);
                const json = await res.json();
                if (json.success) {
                    setSuggestions(json.data);
                } else {
                    setSuggestions([]);
                }
            } catch (err) {
                console.error('Autocomplete error:', err);
                setSuggestions([]);
            } finally {
                setIsLoading(false);
            }
        }
        fetchSuggestions();
    }, [debouncedQuery]);

    // Reset selected index when query changes
    useEffect(() => {
        setSelectedIndex(-1);
    }, [query]);

    const handleSubmit = useCallback(
        (q: string) => {
            const trimmed = q.trim();
            if (!trimmed) return;
            router.push(`/search?q=${encodeURIComponent(trimmed)}`);
            setIsFocused(false);
            inputRef.current?.blur();
        },
        [router]
    );

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Escape') {
            setIsFocused(false);
            inputRef.current?.blur();
            return;
        }

        const totalItems = query.trim().length >= 2 ? suggestions.length + 1 : 0; // +1 for "Search for X"

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex(prev => (prev < totalItems - 1 ? prev + 1 : prev));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex(prev => (prev > -1 ? prev - 1 : -1));
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
                // Selected a specific suggestion
                handleSubmit(suggestions[selectedIndex].name);
            } else {
                // Selected "Search for X" or nothing
                handleSubmit(query);
            }
        }
    };

    // Helper to highlight matching text
    const HighlightMatch = ({ text, match }: { text: string; match: string }) => {
        if (!match.trim()) return <span>{text}</span>;
        
        const index = text.toLowerCase().indexOf(match.toLowerCase());
        if (index === -1) return <span>{text}</span>;

        const before = text.slice(0, index);
        const highlighted = text.slice(index, index + match.length);
        const after = text.slice(index + match.length);

        return (
            <span className="truncate">
                {before}
                <strong className="text-masala-primary font-bold">{highlighted}</strong>
                {after}
            </span>
        );
    };

    return (
        <div className={`relative w-full ${isHero ? '' : 'flex items-center'}`}>
            <div
                className={`relative flex items-center w-full transition-all duration-300 bg-white ${
                    isHero 
                        ? `rounded-2xl border ${isFocused ? 'border-masala-primary/60 shadow-lg shadow-masala-primary/10' : 'border-masala-border hover:border-masala-primary/30 shadow-sm'}`
                        : `rounded-xl border ${isFocused ? 'border-masala-primary/60 shadow-md shadow-masala-primary/10' : 'border-masala-border hover:border-masala-primary/30 shadow-sm'}`
                }`}
            >
                <Search
                    className={`absolute text-masala-text/40 transition-colors ${
                        isFocused ? 'text-masala-primary' : ''
                    } ${isHero ? 'left-4 h-5 w-5' : 'left-3.5 h-4 w-4'}`}
                />
                <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => setIsFocused(true)}
                    onKeyDown={handleKeyDown}
                    placeholder={isHero ? PLACEHOLDER_CYCLE[placeholderIndex] : t('searchPlaceholder')}
                    className={`w-full bg-transparent border-none text-masala-text placeholder:text-masala-text/40 focus:outline-none focus:ring-0 transition-all ${
                        isHero ? 'h-14 pl-12 pr-24 rounded-2xl text-base' : 'h-10 pl-10 pr-14 rounded-xl text-sm'
                    }`}
                    aria-label={t('searchPlaceholder')}
                    autoComplete="off"
                    spellCheck={false}
                    autoFocus={autoFocus}
                />
                
                {query && (
                    <button
                        onMouseDown={(e) => {
                            e.preventDefault();
                            setQuery('');
                            inputRef.current?.focus();
                        }}
                        className={`absolute flex items-center justify-center text-masala-text/40 hover:text-masala-text transition-colors ${
                            isHero ? 'right-20' : 'right-12'
                        }`}
                        aria-label="Clear search"
                    >
                        <X className="h-4 w-4" />
                    </button>
                )}
                
                <button
                    onClick={() => handleSubmit(query)}
                    className={`absolute flex items-center justify-center bg-masala-primary text-white hover:bg-masala-secondary active:scale-[0.97] transition-all shadow-sm rounded-full ${
                        isHero ? 'right-1.5 h-10 w-10' : 'right-1.5 h-8 w-8'
                    }`}
                    aria-label={t('searchButton')}
                >
                    <Search className={isHero ? 'h-5 w-5' : 'h-3.5 w-3.5'} />
                </button>
            </div>

            {/* Dropdown Menu */}
            {isFocused && (
                <div 
                    ref={dropdownRef}
                    className={`absolute top-full left-0 right-0 z-[100] bg-white border border-masala-border shadow-xl shadow-masala-primary/5 overflow-hidden animate-dropdown ${
                        isHero ? 'mt-3 rounded-3xl' : 'mt-2 rounded-2xl'
                    }`}
                >
                    {/* Empty State: Popular Searches */}
                    {!query.trim() ? (
                        <div className={isHero ? 'p-5' : 'p-4'}>
                            <p className="flex items-center gap-1.5 text-[10px] text-masala-text/40 font-black uppercase tracking-[0.2em] px-1 mb-3">
                                <TrendingUp className="h-3 w-3 text-masala-primary" />
                                {t('popularSearches')}
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {POPULAR_SEARCHES.map((term) => (
                                    <button
                                        key={term}
                                        onMouseDown={(e) => {
                                            e.preventDefault();
                                            handleSubmit(term);
                                        }}
                                        className="px-3 py-1.5 rounded-xl bg-masala-pill hover:bg-masala-primary hover:text-white text-xs font-semibold text-masala-text transition-all border border-masala-border hover:border-masala-primary"
                                    >
                                        {term}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : (
                        /* Typing State: Autocomplete Suggestions */
                        <div className="py-2">
                            {isLoading ? (
                                // Loading skeleton
                                <div className="px-4 py-3 flex items-center gap-3 animate-pulse">
                                    <div className="h-4 w-4 rounded-full bg-masala-border" />
                                    <div className="h-4 w-32 rounded bg-masala-border" />
                                </div>
                            ) : query.trim().length >= 2 ? (
                                <>
                                    {/* Product Suggestions */}
                                    {suggestions.map((suggestion, idx) => (
                                        <button
                                            key={suggestion.name + idx}
                                            onMouseDown={(e) => {
                                                e.preventDefault();
                                                handleSubmit(suggestion.name);
                                            }}
                                            className={`w-full flex items-center justify-between px-4 py-2.5 text-left transition-colors ${
                                                selectedIndex === idx ? 'bg-masala-pill/60' : 'hover:bg-masala-pill/40'
                                            }`}
                                        >
                                            <div className="flex items-center gap-3 overflow-hidden">
                                                <Search className="h-3.5 w-3.5 text-masala-text/30 flex-shrink-0" />
                                                <span className="text-sm text-masala-text truncate">
                                                    <HighlightMatch text={suggestion.name} match={query.trim()} />
                                                </span>
                                            </div>
                                            {/* Category Tag */}
                                            <div className="flex-shrink-0 ml-3">
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-masala-bg border border-masala-border text-[10px] font-medium text-masala-text/60 uppercase tracking-wider">
                                                    <Tag className="h-2.5 w-2.5" />
                                                    {suggestion.category}
                                                </span>
                                            </div>
                                        </button>
                                    ))}
                                    
                                    {/* Action: Search for "Query" */}
                                    <button
                                        onMouseDown={(e) => {
                                            e.preventDefault();
                                            handleSubmit(query);
                                        }}
                                        className={`w-full flex items-center gap-3 px-4 py-3 text-left border-t border-masala-border/50 transition-colors ${
                                            selectedIndex === suggestions.length ? 'bg-masala-pill/60' : 'hover:bg-masala-pill/40'
                                        }`}
                                    >
                                        <Search className="h-4 w-4 text-masala-primary flex-shrink-0" />
                                        <span className="text-sm text-masala-primary font-medium truncate">
                                            {t('searchButton')} for &quot;{query}&quot;
                                        </span>
                                    </button>
                                </>
                            ) : (
                                // Query too short
                                <div className="px-4 py-3 text-sm text-masala-text/50">
                                    Keep typing to see suggestions...
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

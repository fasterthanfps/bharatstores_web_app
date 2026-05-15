'use client';

import { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X } from 'lucide-react';
import { useLang } from '@/lib/utils/LanguageContext';

interface HeaderSearchBarProps {
    initialQuery?: string;
}

export default function HeaderSearchBar({ initialQuery = '' }: HeaderSearchBarProps) {
    const [query, setQuery] = useState(initialQuery);
    const [isFocused, setIsFocused] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const router = useRouter();
    const { t } = useLang();

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

    return (
        <div className="relative flex items-center w-full">
            <div
                className={`relative flex items-center w-full rounded-xl border transition-all duration-300 ${isFocused
                    ? 'border-masala-primary/60 shadow-md shadow-masala-primary/10 bg-white'
                    : 'border-masala-border bg-white/90 hover:border-masala-primary/30 shadow-sm'
                    }`}
            >
                <Search
                    className={`absolute left-3.5 h-4 w-4 transition-colors ${isFocused ? 'text-masala-primary' : 'text-masala-text/40'}`}
                />
                <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setTimeout(() => setIsFocused(false), 200)}
                    onKeyDown={handleKeyDown}
                    placeholder={t('searchPlaceholder')}
                    className="w-full bg-transparent border-none h-10 pl-10 pr-14 text-sm text-masala-text placeholder:text-masala-text/40 focus:outline-none focus:ring-0"
                    aria-label={t('searchPlaceholder')}
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
                        className="absolute right-12 flex items-center justify-center text-masala-text/40 hover:text-masala-text transition-colors"
                        aria-label="Clear search"
                    >
                        <X className="h-4 w-4" />
                    </button>
                )}
                <button
                    id="header-search-submit"
                    onClick={() => handleSubmit(query)}
                    className="absolute right-1.5 h-7 w-9 flex items-center justify-center rounded-lg bg-masala-primary text-white hover:bg-masala-secondary active:scale-[0.97] transition-all shadow-sm"
                    aria-label={t('searchButton')}
                >
                    <Search className="h-3.5 w-3.5" />
                </button>
            </div>
        </div>
    );
}

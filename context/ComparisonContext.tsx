'use client';

import {
    createContext,
    useCallback,
    useContext,
    useState,
    type ReactNode,
} from 'react';
import type { ListingWithStore } from '@/types/api';

export interface ComparisonItem {
    /** Query used to fetch this product group */
    query: string;
    /** Display name (e.g. "Basmati Rice") */
    label: string;
    emoji: string;
    /** All listings for this product across stores */
    listings: ListingWithStore[];
}

interface ComparisonContextValue {
    items: ComparisonItem[];
    addItem: (item: ComparisonItem) => void;
    removeItem: (query: string) => void;
    clearItems: () => void;
    isInComparison: (query: string) => boolean;
    isOpen: boolean;
    openModal: () => void;
    closeModal: () => void;
}

const ComparisonContext = createContext<ComparisonContextValue | null>(null);

const MAX_ITEMS = 3;

export function ComparisonProvider({ children }: { children: ReactNode }) {
    const [items, setItems] = useState<ComparisonItem[]>([]);
    const [isOpen, setIsOpen] = useState(false);

    const addItem = useCallback((item: ComparisonItem) => {
        setItems(prev => {
            if (prev.some(i => i.query === item.query)) return prev;
            if (prev.length >= MAX_ITEMS) return prev;
            return [...prev, item];
        });
    }, []);

    const removeItem = useCallback((query: string) => {
        setItems(prev => prev.filter(i => i.query !== query));
    }, []);

    const clearItems = useCallback(() => {
        setItems([]);
        setIsOpen(false);
    }, []);

    const isInComparison = useCallback(
        (query: string) => items.some(i => i.query === query),
        [items],
    );

    const openModal = useCallback(() => setIsOpen(true), []);
    const closeModal = useCallback(() => setIsOpen(false), []);

    return (
        <ComparisonContext.Provider
            value={{ items, addItem, removeItem, clearItems, isInComparison, isOpen, openModal, closeModal }}
        >
            {children}
        </ComparisonContext.Provider>
    );
}

export function useComparison() {
    const ctx = useContext(ComparisonContext);
    if (!ctx) throw new Error('useComparison must be used inside ComparisonProvider');
    return ctx;
}

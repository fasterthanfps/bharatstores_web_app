// hooks/useSearchFilters.ts — URL-driven filter state for /search

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useCallback, useMemo } from 'react';

export interface SearchFilters {
  q: string;
  stores: string[];       // e.g. ['dookan', 'jamoona']
  minPrice: number;
  maxPrice: number;
  priceMode: 'range' | 'below' | 'above';
  quantity: string;
  brands: string[];
  types: string[];
  sugar: string[];
  inStockOnly: boolean;
  sort: 'best' | 'price' | 'pricePerKg' | 'stock';
  page: number;
}

export function useSearchFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const filters: SearchFilters = useMemo(() => ({
    q: params.get('q') ?? '',
    stores: params.get('stores')?.split(',').filter(Boolean) ?? [],
    minPrice: Number(params.get('minPrice') ?? 0),
    maxPrice: Number(params.get('maxPrice') ?? 100),
    priceMode: (params.get('priceMode') as SearchFilters['priceMode']) ?? 'range',
    quantity: params.get('quantity') ?? '',
    brands: params.get('brands')?.split(',').filter(Boolean) ?? [],
    types: params.get('types')?.split(',').filter(Boolean) ?? [],
    sugar: params.get('sugar')?.split(',').filter(Boolean) ?? [],
    inStockOnly: params.get('inStock') === 'true',
    sort: (params.get('sort') as SearchFilters['sort']) ?? 'best',
    page: Number(params.get('page') ?? 1),
  }), [params]);

  const setFilters = useCallback((updates: Partial<SearchFilters>) => {
    const next = new URLSearchParams(params.toString());

    if (updates.stores !== undefined) {
      if (updates.stores.length === 0) next.delete('stores');
      else next.set('stores', updates.stores.join(','));
    }
    if (updates.minPrice !== undefined) {
      if (updates.minPrice <= 0) next.delete('minPrice');
      else next.set('minPrice', String(updates.minPrice));
    }
    if (updates.maxPrice !== undefined) {
      if (updates.maxPrice >= 100) next.delete('maxPrice');
      else next.set('maxPrice', String(updates.maxPrice));
    }
    if (updates.inStockOnly !== undefined) {
      if (!updates.inStockOnly) next.delete('inStock');
      else next.set('inStock', 'true');
    }
    if (updates.priceMode !== undefined) {
      if (updates.priceMode === 'range') next.delete('priceMode');
      else next.set('priceMode', updates.priceMode);
    }
    if (updates.quantity !== undefined) {
      if (!updates.quantity) next.delete('quantity');
      else next.set('quantity', updates.quantity);
    }
    if (updates.brands !== undefined) {
      if (updates.brands.length === 0) next.delete('brands');
      else next.set('brands', updates.brands.join(','));
    }
    if (updates.types !== undefined) {
      if (updates.types.length === 0) next.delete('types');
      else next.set('types', updates.types.join(','));
    }
    if (updates.sugar !== undefined) {
      if (updates.sugar.length === 0) next.delete('sugar');
      else next.set('sugar', updates.sugar.join(','));
    }
    if (updates.sort !== undefined) {
      if (updates.sort === 'best') next.delete('sort');
      else next.set('sort', updates.sort);
    }
    if (updates.page !== undefined) {
      if (updates.page <= 1) next.delete('page');
      else next.set('page', String(updates.page));
    }

    // Reset to page 1 on any filter change except explicit page update
    if (updates.page === undefined && Object.keys(updates).some(k => k !== 'page')) {
      next.delete('page');
    }

    router.push(`${pathname}?${next.toString()}`, { scroll: false });
  }, [params, router, pathname]);

  const clearFilters = useCallback(() => {
    const next = new URLSearchParams();
    if (filters.q) next.set('q', filters.q);
    router.push(`${pathname}?${next.toString()}`, { scroll: false });
  }, [filters.q, pathname, router]);

  const activeFilterCount =
    filters.stores.length +
    (filters.inStockOnly ? 1 : 0) +
    (filters.maxPrice < 100 ? 1 : 0) +
    (filters.minPrice > 0 ? 1 : 0) +
    (filters.quantity ? 1 : 0) +
    filters.brands.length +
    filters.types.length +
    filters.sugar.length +
    (filters.priceMode !== 'range' ? 1 : 0);

  const hasActiveFilters = activeFilterCount > 0;

  return { filters, setFilters, clearFilters, hasActiveFilters, activeFilterCount };
}

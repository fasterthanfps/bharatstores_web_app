'use client';

import { X, SlidersHorizontal } from 'lucide-react';
import { useSearchFilters } from '@/hooks/useSearchFilters';
import { ALL_STORES } from '@/lib/stores';

interface FilterSidebarProps {
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
}

function FilterContent() {
  const { filters, setFilters, clearFilters, hasActiveFilters } = useSearchFilters();

  const toggleStore = (storeId: string) => {
    const next = filters.stores.includes(storeId)
      ? filters.stores.filter(s => s !== storeId)
      : [...filters.stores, storeId];
    setFilters({ stores: next });
  };

  return (
    <div className="p-4 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-masala-primary" />
          <h3 className="font-black text-masala-text text-xs uppercase tracking-widest">Filters</h3>
        </div>
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="text-xs text-masala-primary font-bold hover:underline transition-colors"
          >
            Clear all
          </button>
        )}
      </div>

      {/* In Stock Only */}
      <div className="pb-4 border-b border-masala-border">
        <label className="flex items-center justify-between cursor-pointer">
          <span className="text-sm font-semibold text-masala-text">In Stock Only</span>
          <input
            type="checkbox"
            checked={filters.inStockOnly}
            onChange={e => setFilters({ inStockOnly: e.target.checked })}
            className="sr-only peer"
          />
          <div className="relative w-10 h-5 rounded-full bg-masala-border peer-checked:bg-masala-primary transition-colors duration-200">
            <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 ${filters.inStockOnly ? 'translate-x-5' : ''}`} />
          </div>
        </label>
      </div>

      {/* Price Range */}
      <div className="pb-4 border-b border-masala-border space-y-2">
        <p className="text-sm font-semibold text-masala-text">
          Price Range: €{filters.minPrice} – €{filters.maxPrice === 100 ? '100+' : filters.maxPrice}
        </p>
        <input
          type="range"
          min={0}
          max={100}
          step={1}
          value={filters.maxPrice}
          onChange={e => setFilters({ maxPrice: Number(e.target.value) })}
          className="w-full accent-masala-primary"
        />
        <div className="flex justify-between text-[10px] text-masala-text-light">
          <span>€0</span>
          <span>€100+</span>
        </div>
      </div>

      {/* Store Checkboxes */}
      <div>
        <p className="text-xs font-black uppercase tracking-widest text-masala-text-muted mb-3">Stores</p>
        <div className="space-y-2.5">
          {ALL_STORES.map(store => {
            const checked = filters.stores.includes(store.id);
            return (
              <label key={store.id} className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleStore(store.id)}
                  className="w-4 h-4 rounded border-masala-border accent-masala-primary cursor-pointer flex-shrink-0"
                />
                <span className={`text-sm transition-colors ${checked ? 'text-masala-primary font-semibold' : 'text-masala-text group-hover:text-masala-primary'}`}>
                  {store.label}
                </span>
                {checked && (
                  <span className="ml-auto w-2 h-2 rounded-full bg-masala-primary flex-shrink-0" />
                )}
              </label>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function FilterSidebar({ isMobileOpen, onMobileClose }: FilterSidebarProps) {
  return (
    <>
      {/* Desktop sticky sidebar */}
      <aside className="hidden lg:block w-56 flex-shrink-0 bg-white rounded-2xl border border-masala-border sticky top-24 self-start max-h-[calc(100vh-7rem)] overflow-y-auto">
        <FilterContent />
      </aside>

      {/* Mobile bottom sheet */}
      {isMobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex flex-col justify-end">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={onMobileClose}
          />
          <div className="relative bg-white rounded-t-3xl max-h-[80vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-white border-b border-masala-border px-4 py-3 flex items-center justify-between z-10">
              <span className="font-black text-masala-text text-sm uppercase tracking-widest">Filters</span>
              <button
                onClick={onMobileClose}
                className="p-2 rounded-xl hover:bg-masala-muted transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                <X className="h-5 w-5 text-masala-text-muted" />
              </button>
            </div>
            <FilterContent />
            <div className="sticky bottom-0 bg-white border-t border-masala-border px-4 py-3">
              <button
                onClick={onMobileClose}
                className="w-full h-12 bg-masala-primary text-white font-black rounded-2xl text-sm tracking-wide"
              >
                Show Results
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

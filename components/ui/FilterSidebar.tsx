'use client';

import { X, SlidersHorizontal } from 'lucide-react';
import { useSearchFilters } from '@/hooks/useSearchFilters';
import { ALL_STORES } from '@/lib/stores';

interface FilterSidebarProps {
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
  resultCount?: number;
  dynamicOptions?: {
    quantities: string[];
    brands: string[];
    types: string[];
    sugarOptions: { id: string; label: string }[];
    showQuantity: boolean;
    showBrand: boolean;
    showType: boolean;
    showSugar: boolean;
  };
}

const FALLBACK_SUGAR_OPTIONS = [
  { id: 'no-added-sugar', label: 'No Added Sugar' },
  { id: 'zero-sugar', label: 'Zero Sugar' },
];

function FilterContent({ dynamicOptions }: { dynamicOptions?: FilterSidebarProps['dynamicOptions'] }) {
  const { filters, setFilters, clearFilters, hasActiveFilters } = useSearchFilters();
  const q = filters.q.toLowerCase();
  const queryDrivenOptions = (() => {
    if (/atta|flour|wheat/.test(q)) {
      return {
        quantities: ['500g', '1kg', '2kg', '2.5kg', '3kg', '4kg', '4.5kg', '5kg', '10kg'],
        brands: ['aashirvaad', 'pillsbury', 'heera', 'maggi', 'everest'],
        types: ['wheat flour', 'whole wheat', 'atta', 'multigrain', 'healthy flour'],
        sugarOptions: [] as { id: string; label: string }[],
        showQuantity: true, showBrand: true, showType: true, showSugar: false,
      };
    }
    if (/rice|basmati|dal|lentil|pulses/.test(q)) {
      return {
        quantities: ['500g', '1kg', '2kg', '5kg', '10kg'],
        brands: ['india gate', 'daawat', 'tilda', 'heera', 'trs'],
        types: ['basmati', 'sona masoori', 'toor dal', 'moong dal', 'masoor dal'],
        sugarOptions: [] as { id: string; label: string }[],
        showQuantity: true, showBrand: true, showType: true, showSugar: false,
      };
    }
    if (/biscuit|cookies|snack/.test(q)) {
      return {
        quantities: ['100g', '200g', '300g', '500g', '1kg'],
        brands: ['parle', 'britannia', 'sunfeast', 'haldiram'],
        types: ['digestive', 'cream biscuit', 'salted', 'namkeen'],
        sugarOptions: FALLBACK_SUGAR_OPTIONS,
        showQuantity: true, showBrand: true, showType: true, showSugar: true,
      };
    }
    return {
      quantities: ['500g', '1kg', '2kg', '5kg'],
      brands: [],
      types: [],
      sugarOptions: FALLBACK_SUGAR_OPTIONS,
      showQuantity: true, showBrand: false, showType: false, showSugar: false,
    };
  })();
  const opts = dynamicOptions ?? queryDrivenOptions;

  const toggleStore = (storeId: string) => {
    const next = filters.stores.includes(storeId)
      ? filters.stores.filter(s => s !== storeId)
      : [...filters.stores, storeId];
    setFilters({ stores: next });
  };

  const toggleArrayFilter = (field: 'brands' | 'types' | 'sugar', value: string) => {
    const current = filters[field];
    const next = current.includes(value) ? current.filter(v => v !== value) : [...current, value];
    setFilters({ [field]: next } as any);
  };

  return (
    <div className="p-4 space-y-5">
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

      <div className="pb-4 border-b border-masala-border space-y-2">
        <div className="grid grid-cols-3 gap-1">
          {(['range', 'below', 'above'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setFilters({ priceMode: mode })}
              className={`px-2 py-1.5 rounded-lg text-[10px] font-black uppercase border ${filters.priceMode === mode ? 'bg-masala-primary text-white border-masala-primary' : 'bg-white text-masala-text-muted border-masala-border'}`}
            >
              {mode}
            </button>
          ))}
        </div>

        <p className="text-sm font-semibold text-masala-text">
          Price: €{filters.minPrice} - €{filters.maxPrice === 100 ? '100+' : filters.maxPrice}
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

      {opts.showQuantity && (
      <div className="pb-4 border-b border-masala-border space-y-2">
        <p className="text-xs font-black uppercase tracking-widest text-masala-text-muted">Quantity</p>
        <select
          value={filters.quantity}
          onChange={(e) => setFilters({ quantity: e.target.value })}
          className="w-full h-10 rounded-xl border border-masala-border px-3 text-sm bg-white"
        >
          <option value="">All quantities</option>
          {(opts.quantities ?? []).map((q) => <option key={q} value={q}>{q}</option>)}
        </select>
      </div>
      )}

      {opts.showBrand && (
      <div className="pb-4 border-b border-masala-border space-y-2">
        <p className="text-xs font-black uppercase tracking-widest text-masala-text-muted">Brand</p>
        <div className="flex flex-wrap gap-1.5">
          {(opts.brands ?? []).map((b) => (
            <button
              key={b}
              onClick={() => toggleArrayFilter('brands', b)}
              className={`px-2 py-1 rounded-full text-[11px] border ${filters.brands.includes(b) ? 'bg-masala-primary text-white border-masala-primary' : 'bg-white text-masala-text border-masala-border'}`}
            >
              {b}
            </button>
          ))}
        </div>
      </div>
      )}

      {opts.showType && (
      <div className="pb-4 border-b border-masala-border space-y-2">
        <p className="text-xs font-black uppercase tracking-widest text-masala-text-muted">Type</p>
        <div className="flex flex-wrap gap-1.5">
          {(opts.types ?? []).map((t) => (
            <button
              key={t}
              onClick={() => toggleArrayFilter('types', t)}
              className={`px-2 py-1 rounded-full text-[11px] border ${filters.types.includes(t) ? 'bg-masala-primary text-white border-masala-primary' : 'bg-white text-masala-text border-masala-border'}`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>
      )}

      {opts.showSugar && (
      <div className="pb-4 border-b border-masala-border space-y-2">
        <p className="text-xs font-black uppercase tracking-widest text-masala-text-muted">Sugar Profile</p>
        <div className="space-y-2">
          {(opts.sugarOptions?.length ? opts.sugarOptions : FALLBACK_SUGAR_OPTIONS).map((s) => (
            <label key={s.id} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.sugar.includes(s.id)}
                onChange={() => toggleArrayFilter('sugar', s.id)}
                className="w-4 h-4 rounded border-masala-border accent-masala-primary"
              />
              <span className="text-sm text-masala-text">{s.label}</span>
            </label>
          ))}
        </div>
      </div>
      )}

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
                {checked && <span className="ml-auto w-2 h-2 rounded-full bg-masala-primary flex-shrink-0" />}
              </label>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function FilterSidebar({ isMobileOpen, onMobileClose, resultCount, dynamicOptions }: FilterSidebarProps) {
  return (
    <>
      <aside className="hidden lg:block w-56 flex-shrink-0 bg-white rounded-2xl border border-masala-border sticky top-24 self-start max-h-[calc(100vh-7rem)] overflow-y-auto">
        <FilterContent dynamicOptions={dynamicOptions} />
      </aside>

      {isMobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onMobileClose} />
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
            <FilterContent dynamicOptions={dynamicOptions} />
            <div className="sticky bottom-0 bg-white border-t border-masala-border px-4 py-3">
              <button
                onClick={onMobileClose}
                className="w-full h-12 bg-masala-primary text-white font-black rounded-2xl text-sm tracking-wide"
              >
                Show Results{typeof resultCount === 'number' ? ` (${resultCount})` : ''}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}


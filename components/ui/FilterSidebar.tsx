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
    <div className="p-4 pb-8 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-masala-primary" />
          <h3 className="font-black text-masala-text text-xs uppercase tracking-widest">Filters</h3>
        </div>
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="text-xs text-masala-primary font-bold hover:underline transition-colors cursor-pointer"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Sort Section */}
      <div className="pb-5 border-b border-masala-border space-y-3">
        <p className="text-xs font-black uppercase tracking-widest text-masala-text-muted">Sort By</p>
        <div className="space-y-2">
          {[
            { id: 'best',       label: 'Best Match' },
            { id: 'price',      label: 'Price: Low to High' },
            { id: 'pricePerKg', label: 'Price per Unit/Kg' },
          ].map((tab) => {
            const isSelected = filters.sort === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setFilters({ sort: tab.id as any })}
                className="w-full flex items-center justify-between text-left p-2.5 rounded-xl border transition-all duration-200 cursor-pointer"
                style={{
                  borderColor: isSelected ? 'var(--color-masala-primary)' : 'var(--color-masala-border)',
                  backgroundColor: isSelected ? 'rgba(139, 32, 32, 0.03)' : '#FFFFFF'
                }}
              >
                <span className={`text-[11px] font-bold ${isSelected ? 'text-masala-primary' : 'text-masala-text'}`}>
                  {tab.label}
                </span>
                <div className={`w-4 h-4 rounded-full border flex items-center justify-center flex-shrink-0 transition-all ${
                  isSelected ? 'border-masala-primary bg-masala-primary' : 'border-masala-border bg-white'
                }`}>
                  {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* In Stock Toggle */}
      <div className="pb-5 border-b border-masala-border">
        <button
          onClick={() => setFilters({ inStockOnly: !filters.inStockOnly })}
          className="w-full flex items-center justify-between cursor-pointer text-left focus:outline-none"
        >
          <span className="text-xs font-black uppercase tracking-widest text-masala-text-muted">In Stock Only</span>
          <div className={`relative w-11 h-6 rounded-full transition-colors duration-200 flex items-center p-0.5 ${
            filters.inStockOnly ? 'bg-masala-primary' : 'bg-masala-border'
          }`}>
            <div className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform duration-200 ${
              filters.inStockOnly ? 'translate-x-5' : 'translate-x-0'
            }`} />
          </div>
        </button>
      </div>

      {/* Price Presets & Slider */}
      <div className="pb-5 border-b border-masala-border space-y-3">
        <p className="text-xs font-black uppercase tracking-widest text-masala-text-muted">Price Range</p>
        
        {/* Preset Chips */}
        <div className="flex flex-wrap gap-1.5">
          {[
            { label: 'Under €5', max: 5 },
            { label: 'Under €10', max: 10 },
            { label: 'Under €25', max: 25 },
            { label: 'Under €50', max: 50 },
          ].map((preset) => {
            const isSelected = filters.maxPrice === preset.max;
            return (
              <button
                key={preset.max}
                onClick={() => setFilters({ maxPrice: preset.max, priceMode: 'range' })}
                className="px-2.5 py-1 rounded-full text-[10px] font-bold border transition-all duration-200 cursor-pointer"
                style={{
                  borderColor: isSelected ? 'var(--color-masala-primary)' : 'var(--color-masala-border)',
                  backgroundColor: isSelected ? 'var(--color-masala-primary)' : '#FFFFFF',
                  color: isSelected ? '#FFFFFF' : 'var(--color-masala-text-muted)'
                }}
              >
                {preset.label}
              </button>
            );
          })}
        </div>

        {/* Custom Price Slider */}
        <div className="space-y-2 pt-1">
          <div className="flex justify-between items-center text-xs font-bold text-masala-text">
            <span>€0</span>
            <span className="text-masala-primary bg-masala-primary/5 px-2 py-0.5 rounded-md border border-masala-primary/10">
              max €{filters.maxPrice > 50 ? '50+' : filters.maxPrice}
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={50}
            step={1}
            value={Math.min(filters.maxPrice, 50)}
            onChange={e => setFilters({ maxPrice: Number(e.target.value) })}
            className="w-full accent-masala-primary cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-masala-text-light font-medium">
            <span>€0</span>
            <span>€50+</span>
          </div>
        </div>
      </div>

      {opts.showQuantity && (
        <div className="pb-5 border-b border-masala-border space-y-2">
          <p className="text-xs font-black uppercase tracking-widest text-masala-text-muted">Quantity</p>
          <select
            value={filters.quantity}
            onChange={(e) => setFilters({ quantity: e.target.value })}
            className="w-full h-10 rounded-xl border border-masala-border px-3 text-xs bg-white font-bold text-masala-text focus:outline-none focus:border-masala-primary transition-all duration-200 cursor-pointer"
          >
            <option value="">All quantities</option>
            {(opts.quantities ?? []).map((q) => <option key={q} value={q}>{q}</option>)}
          </select>
        </div>
      )}

      {opts.showBrand && (
        <div className="pb-5 border-b border-masala-border space-y-2">
          <p className="text-xs font-black uppercase tracking-widest text-masala-text-muted">Brand</p>
          <div className="flex flex-wrap gap-1.5">
            {(opts.brands ?? []).map((b) => {
              const isSelected = filters.brands.includes(b);
              return (
                <button
                  key={b}
                  onClick={() => toggleArrayFilter('brands', b)}
                  className="px-2.5 py-1 rounded-full text-[10px] font-bold border transition-all duration-200 capitalize cursor-pointer"
                  style={{
                    borderColor: isSelected ? 'var(--color-masala-primary)' : 'var(--color-masala-border)',
                    backgroundColor: isSelected ? 'var(--color-masala-primary)' : '#FFFFFF',
                    color: isSelected ? '#FFFFFF' : 'var(--color-masala-text-muted)'
                  }}
                >
                  {b}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {opts.showType && (
        <div className="pb-5 border-b border-masala-border space-y-2">
          <p className="text-xs font-black uppercase tracking-widest text-masala-text-muted">Type</p>
          <div className="flex flex-wrap gap-1.5">
            {(opts.types ?? []).map((t) => {
              const isSelected = filters.types.includes(t);
              return (
                <button
                  key={t}
                  onClick={() => toggleArrayFilter('types', t)}
                  className="px-2.5 py-1 rounded-full text-[10px] font-bold border transition-all duration-200 capitalize cursor-pointer"
                  style={{
                    borderColor: isSelected ? 'var(--color-masala-primary)' : 'var(--color-masala-border)',
                    backgroundColor: isSelected ? 'var(--color-masala-primary)' : '#FFFFFF',
                    color: isSelected ? '#FFFFFF' : 'var(--color-masala-text-muted)'
                  }}
                >
                  {t}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {opts.showSugar && (
        <div className="pb-5 border-b border-masala-border space-y-2">
          <p className="text-xs font-black uppercase tracking-widest text-masala-text-muted">Sugar Profile</p>
          <div className="space-y-2">
            {(opts.sugarOptions?.length ? opts.sugarOptions : FALLBACK_SUGAR_OPTIONS).map((s) => {
              const checked = filters.sugar.includes(s.id);
              return (
                <button
                  key={s.id}
                  onClick={() => toggleArrayFilter('sugar', s.id)}
                  className="w-full flex items-center justify-between text-left p-2.5 rounded-xl border transition-all duration-200 hover:border-masala-primary/30 cursor-pointer"
                  style={{
                    borderColor: checked ? 'var(--color-masala-primary)' : 'var(--color-masala-border)',
                    backgroundColor: checked ? 'rgba(139, 32, 32, 0.03)' : '#FFFFFF'
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${
                      checked ? 'border-masala-primary bg-masala-primary text-white' : 'border-masala-border bg-white'
                    }`}>
                      {checked && (
                        <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="4">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <span className={`text-[11px] font-bold ${checked ? 'text-masala-primary' : 'text-masala-text'}`}>
                      {s.label}
                    </span>
                  </div>
                  {checked && <span className="w-1.5 h-1.5 rounded-full bg-masala-primary" />}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div>
        <p className="text-xs font-black uppercase tracking-widest text-masala-text-muted mb-3">Stores</p>
        <div className="space-y-2">
          {ALL_STORES.map(store => {
            const checked = filters.stores.includes(store.id);
            return (
              <button
                key={store.id}
                onClick={() => toggleStore(store.id)}
                className="w-full flex items-center justify-between text-left p-2.5 rounded-xl border transition-all duration-200 hover:border-masala-primary/30 cursor-pointer"
                style={{
                  borderColor: checked ? 'var(--color-masala-primary)' : 'var(--color-masala-border)',
                  backgroundColor: checked ? 'rgba(139, 32, 32, 0.03)' : '#FFFFFF'
                }}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${
                    checked ? 'border-masala-primary bg-masala-primary text-white' : 'border-masala-border bg-white'
                  }`}>
                    {checked && (
                      <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <span className={`text-[11px] font-bold ${checked ? 'text-masala-primary font-bold' : 'text-masala-text'}`}>
                    {store.label}
                  </span>
                </div>
                {checked && <span className="w-1.5 h-1.5 rounded-full bg-masala-primary" />}
              </button>
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
      <aside className="hidden lg:block w-56 flex-shrink-0 bg-white rounded-2xl border border-masala-border sticky top-[96px] self-start max-h-[calc(100vh-120px)] overflow-y-auto sidebar-elegant-scroll">
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


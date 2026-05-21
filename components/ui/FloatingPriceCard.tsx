'use client';

interface FloatingPriceCardProps {
  store: string;
  storeColor: string;
  storeTextColor: string;
  productName: string;
  originalPrice: number;
  currentPrice: number;
  savePct: number;
  className?: string;
}

export default function FloatingPriceCard({
  store,
  storeColor,
  storeTextColor,
  productName,
  originalPrice,
  currentPrice,
  savePct,
  className = '',
}: FloatingPriceCardProps) {
  return (
    <div
      className={`bg-white rounded-2xl border border-masala-border p-3 shadow-lg w-[148px] select-none ${className}`}
      aria-hidden="true"
    >
      {/* Store badge */}
      <span
        className="inline-block px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wide mb-2"
        style={{ background: storeColor, color: storeTextColor }}
      >
        {store}
      </span>

      {/* Product name */}
      <p className="text-[12px] font-semibold text-masala-text leading-tight mb-2 line-clamp-1">
        {productName}
      </p>

      {/* Price row */}
      <div className="flex items-baseline gap-1.5 mb-1.5">
        <span
          className="text-[15px] font-black text-masala-primary"
          style={{ fontFamily: 'Fraunces, serif' }}
        >
          €{currentPrice.toFixed(2)}
        </span>
        <span className="text-[11px] text-masala-text-muted line-through">
          €{originalPrice.toFixed(2)}
        </span>
      </div>

      {/* Save badge */}
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-[10px] font-black">
        SAVE {savePct}%
      </span>
    </div>
  );
}

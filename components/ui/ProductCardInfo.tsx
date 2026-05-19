'use client';

import { ExternalLink, Check, ShoppingCart } from 'lucide-react';
import type { GroupedListing } from '@/lib/search/engine';
import { useLang } from '@/lib/utils/LanguageContext';

interface ProductCardInfoProps {
    listing: GroupedListing;
    isInCart: boolean;
    isInStock: boolean;
    storeSlug: string;
    storeLabel: string;
    bestPrice: number;
    pricePerKg?: number | null;
    productName: string;
    productCategory: string;
    weightLabel?: string | null;
    productUrl: string;
    imageUrl?: string | null;
    onAddToCart: () => void;
    onRemoveFromCart: () => void;
}

export default function ProductCardInfo({
    listing,
    isInCart,
    isInStock,
    storeSlug,
    storeLabel,
    bestPrice,
    pricePerKg,
    productName,
    productCategory,
    weightLabel,
    productUrl,
    imageUrl,
    onAddToCart,
    onRemoveFromCart,
}: ProductCardInfoProps) {
    const { t } = useLang();

    return (
        <div className="p-3 flex flex-col gap-2 flex-1">
            {/* Product name */}
            <h3 className="text-[13px] font-bold text-masala-text leading-snug line-clamp-2">
                {productName}
            </h3>

            {/* Category + weight */}
            <p className="text-[11px] text-masala-text-muted capitalize">
                {productCategory}
                {weightLabel && <> · {weightLabel}</>}
            </p>

            {/* Price row */}
            <div className="flex items-end justify-between mt-auto">
                <div>
                    <span className="text-[9px] text-masala-text-muted uppercase font-bold tracking-wider block mb-0.5">{t('search.bestPrice')}</span>
                    <span className="text-[22px] font-black text-masala-primary leading-none" style={{ fontFamily: 'Fraunces, serif' }}>
                        €{bestPrice.toFixed(2)}
                    </span>
                    {pricePerKg && (
                        <span className="text-[10px] text-masala-text-muted block">
                            €{pricePerKg.toFixed(2)}/kg
                        </span>
                    )}
                </div>

                {/* Stock status */}
                <div className={`flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full ${isInStock ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'
                    }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${isInStock ? 'bg-emerald-500' : 'bg-red-400'}`} />
                    {isInStock ? t('product.inStock') : t('product.outOfStock')}
                </div>
            </div>

            {/* Action row */}
            <div className="flex items-center gap-1.5 pt-1" onClick={(e) => e.stopPropagation()}>
                <a
                    href={productUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 h-[38px] sm:h-[42px] bg-masala-primary hover:bg-masala-secondary text-white text-[11px] sm:text-[12px] font-black rounded-xl flex items-center justify-center gap-1 sm:gap-1.5 active:scale-95 transition-all shadow-sm shadow-masala-primary/10 group/btn"
                >
                    <span>{t('product.buyNow')}</span>
                    <ExternalLink className="h-3 w-3 sm:h-3.5 sm:w-3.5 flex-shrink-0 opacity-70 group-hover/btn:opacity-100 transition-opacity" />
                </a>

                <button
                    onClick={isInCart ? onRemoveFromCart : onAddToCart}
                    className={`h-[38px] w-[38px] sm:h-[42px] sm:w-[42px] rounded-xl border transition-all duration-300 flex-shrink-0 flex items-center justify-center active:scale-90 ${isInCart
                        ? 'bg-gradient-to-br from-emerald-500 to-teal-600 border-emerald-500 text-white shadow-md shadow-emerald-500/20 scale-105'
                        : 'bg-white border-emerald-100 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 hover:scale-105'
                        }`}
                    aria-label={isInCart ? t('product.removeFromCart') : t('product.addToCart')}
                >
                    {isInCart ? <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4 stroke-[3]" /> : <ShoppingCart className="h-3.5 w-3.5 sm:h-4 sm:w-4" />}
                </button>
            </div>
        </div>
    );
}
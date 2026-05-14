'use client';

import { useState } from 'react';
import { ShoppingCart, Loader2, ArrowUpRight } from 'lucide-react';
import { trackClick, buildGoUrl } from '@/lib/tracking/clickTracker';

interface AffiliateBuyButtonProps {
    listingId: string;
    storeName: string;
    size?: 'sm' | 'md' | 'lg';
    className?: string;
    isDisabled?: boolean;
    text?: string;
}

export default function AffiliateBuyButton({
    listingId,
    storeName,
    size = 'md',
    className = '',
    isDisabled = false,
    text,
}: AffiliateBuyButtonProps) {
    const [loading, setLoading] = useState(false);
    const [toastVisible, setToastVisible] = useState(false);

    const handleClick = async () => {
        if (loading || isDisabled) return;
        setLoading(true);

        // Show toast
        setToastVisible(true);
        setTimeout(() => setToastVisible(false), 2500);

        // Log the click (fire-and-forget)
        trackClick(listingId).catch(() => {});

        // Build redirect URL and open in a NEW TAB
        const goUrl = buildGoUrl(listingId);
        window.open(goUrl, '_blank', 'noopener,noreferrer');

        // Reset loading state after short delay
        setTimeout(() => setLoading(false), 600);
    };

    const sizeClasses = {
        sm: 'px-4 py-2 text-[10px] gap-2',
        md: 'px-5 py-2.5 text-xs gap-2',
        lg: 'px-7 py-3.5 text-sm gap-2.5',
    };

    return (
        <>
            <button
                id={`buy-btn-${listingId}`}
                onClick={handleClick}
                disabled={loading || isDisabled}
                className={`group/btn inline-flex items-center justify-center font-black uppercase tracking-[0.18em] rounded-2xl transition-all duration-300 ${
                    isDisabled
                        ? 'bg-masala-pill text-masala-text/30 border border-masala-border cursor-not-allowed shadow-none'
                        : 'bg-masala-primary text-white hover:bg-masala-secondary active:scale-[0.97] shadow-md shadow-masala-primary/20 hover:shadow-lg hover:shadow-masala-primary/25 hover:-translate-y-0.5'
                } ${sizeClasses[size]} ${className}`}
            >
                {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                    <ShoppingCart className="h-4 w-4 flex-shrink-0" />
                )}
                <span>{loading ? 'Opening...' : (text || 'Buy Now')}</span>
                {!loading && (
                    <ArrowUpRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5" />
                )}
            </button>

            {/* Toast notification */}
            {toastVisible && (
                <div
                    role="status"
                    className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 px-8 py-4 rounded-[2rem] bg-white border border-masala-border shadow-2xl text-sm text-masala-text flex items-center gap-4 animate-in ring-4 ring-masala-primary/5"
                >
                    <div className="w-10 h-10 rounded-full bg-masala-pill flex items-center justify-center text-xl">
                        🛒
                    </div>
                    <span className="font-medium">
                        Opening <strong className="text-masala-primary font-black">{storeName}</strong> in a new tab...
                    </span>
                </div>
            )}
        </>
    );
}

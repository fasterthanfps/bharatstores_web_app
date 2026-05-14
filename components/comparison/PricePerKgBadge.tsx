import { Scale } from 'lucide-react';
import { formatEUR } from '@/lib/utils/currency';

interface PricePerKgBadgeProps {
    pricePerKg: number | null;
    isLowest?: boolean;
}

export default function PricePerKgBadge({ pricePerKg, isLowest = false }: PricePerKgBadgeProps) {
    if (!pricePerKg) return null;

    return (
        <span
            className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1 text-[10px] font-black uppercase tracking-widest ${isLowest
                    ? 'bg-masala-primary/10 text-masala-primary border border-masala-primary/20 shadow-sm'
                    : 'bg-masala-pill text-masala-text/40 border border-masala-border'
                }`}
        >
            <Scale className="h-3.5 w-3.5" />
            {formatEUR(pricePerKg)}/kg
        </span>
    );
}

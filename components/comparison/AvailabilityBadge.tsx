import { CheckCircle, AlertTriangle, XCircle, HelpCircle, CalendarClock } from 'lucide-react';

interface AvailabilityBadgeProps {
    availability: string;
    small?: boolean;
}

const availabilityConfig = {
    IN_STOCK: {
        label: 'Verfügbar',
        icon: CheckCircle,
        className: 'text-emerald-700 bg-emerald-50 border-emerald-100',
        dotClass: 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.3)]',
    },
    LOW_STOCK: {
        label: 'Wenig verfügbar',
        icon: AlertTriangle,
        className: 'text-amber-700 bg-amber-50 border-amber-100',
        dotClass: 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.3)]',
    },
    OUT_OF_STOCK: {
        label: 'Ausverkauft',
        icon: XCircle,
        className: 'text-rose-700 bg-rose-50 border-rose-100',
        dotClass: 'bg-rose-500',
    },
    UPCOMING: {
        label: 'Demnächst',
        icon: CalendarClock,
        className: 'text-blue-700 bg-blue-50 border-blue-100',
        dotClass: 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.3)]',
    },
    UNKNOWN: {
        label: 'Unbekannt',
        icon: HelpCircle,
        className: 'text-masala-text/40 bg-masala-pill border-masala-border',
        dotClass: 'bg-masala-text/20',
    },
} as const;

export default function AvailabilityBadge({
    availability,
    small = false,
}: AvailabilityBadgeProps) {
    const config =
        availabilityConfig[availability as keyof typeof availabilityConfig] ??
        availabilityConfig.UNKNOWN;

    return (
        <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 font-black uppercase tracking-widest text-[10px] ${config.className}`}
        >
            <span className={`h-1.5 w-1.5 rounded-full flex-shrink-0 ${config.dotClass}`} />
            {config.label}
        </span>
    );
}

'use client';

import Link from 'next/link';

const TRENDING_ITEMS = [
    { label: 'Basmati Rice', emoji: '🍚', query: 'basmati rice' },
    { label: 'Amul Ghee', emoji: '🧈', query: 'amul ghee' },
    { label: 'MDH Masala', emoji: '🌶️', query: 'mdh masala' },
    { label: 'Toor Dal', emoji: '🫘', query: 'toor dal' },
    { label: 'Chai Tea', emoji: '☕', query: 'chai' },
    { label: 'Atta Flour', emoji: '🌾', query: 'atta' },
    { label: 'Paneer', emoji: '🧀', query: 'paneer' },
    { label: 'Chana Dal', emoji: '🟡', query: 'chana dal' },
    { label: 'Coconut Oil', emoji: '🥥', query: 'coconut oil' },
    { label: 'Jeera Rice', emoji: '🍛', query: 'jeera rice' },
    { label: 'Kissan Jam', emoji: '🍓', query: 'kissan jam' },
    { label: 'Haldirams', emoji: '🍿', query: 'haldirams' },
];

// Duplicate for seamless loop
const ITEMS_DOUBLED = [...TRENDING_ITEMS, ...TRENDING_ITEMS];

export default function TrendingTicker() {
    return (
        <div className="relative overflow-hidden py-3.5">
            {/* Left gradient fade */}
            <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-20 z-10 bg-gradient-to-r from-[#fdf6ec] to-transparent" />
            {/* Right gradient fade */}
            <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-16 z-10 bg-gradient-to-l from-[#fdf6ec] to-transparent" />

            {/* "Trending" label overlay on left */}
            <div className="absolute left-0 top-0 bottom-0 z-20 flex items-center pl-3">
                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-masala-primary/50 whitespace-nowrap select-none bg-gradient-to-r from-[#fdf6ec] via-[#fdf6ec] to-transparent pr-4">
                    🔥 Trending
                </span>
            </div>

            {/* Scrolling track — uses global .ticker-track class */}
            <div className="ticker-track flex gap-2.5 w-max pl-28">
                {ITEMS_DOUBLED.map((item, i) => (
                    <Link
                        key={`${item.query}-${i}`}
                        href={`/search?q=${encodeURIComponent(item.query)}`}
                        className="
                            inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full
                            bg-white border border-masala-border
                            text-xs font-semibold text-masala-text/70
                            hover:bg-masala-pill hover:border-masala-primary/30 hover:text-masala-primary
                            transition-all duration-200 whitespace-nowrap shadow-sm
                            hover:-translate-y-px hover:shadow-md
                        "
                    >
                        <span className="text-sm leading-none">{item.emoji}</span>
                        {item.label}
                    </Link>
                ))}
            </div>
        </div>
    );
}

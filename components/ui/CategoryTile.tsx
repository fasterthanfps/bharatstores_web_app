'use client';

import { useRouter } from 'next/navigation';

interface CategoryTileProps {
  emoji: string;
  name: string;
  query: string;
}

export default function CategoryTile({ emoji, name, query }: CategoryTileProps) {
  const router = useRouter();

  return (
    <button
      onClick={() => router.push(`/search?q=${encodeURIComponent(query)}`)}
      className="group flex flex-col items-center justify-center gap-2 bg-white rounded-2xl border border-masala-border p-3 w-[120px] h-[120px] sm:w-[120px] sm:h-[120px] w-[96px] h-[96px] hover:scale-105 hover:shadow-md hover:border-masala-primary/40 transition-all duration-200 cursor-pointer"
      aria-label={`Browse ${name}`}
    >
      <span className="text-4xl sm:text-[40px] leading-none group-hover:scale-110 transition-transform duration-200">
        {emoji}
      </span>
      <span className="text-[11px] sm:text-[13px] font-semibold text-masala-text text-center leading-tight">
        {name}
      </span>
    </button>
  );
}

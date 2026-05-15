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
      className="group flex flex-col items-center justify-center gap-2 bg-white rounded-2xl border border-masala-border p-2 sm:p-3 w-full aspect-square hover:scale-[1.03] hover:shadow-md hover:border-masala-primary/40 transition-all duration-200 cursor-pointer shadow-sm"
      aria-label={`Browse ${name}`}
    >
      <span className="text-3xl sm:text-4xl leading-none group-hover:scale-110 transition-transform duration-200">
        {emoji}
      </span>
      <span className="text-[10px] sm:text-[13px] font-bold text-masala-text text-center leading-tight">
        {name}
      </span>
    </button>
  );
}

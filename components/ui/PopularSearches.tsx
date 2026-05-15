'use client';

import { useRouter } from 'next/navigation';

const POPULAR_SEARCHES = [
  'Basmati Rice', 'Amul Ghee', 'MDH Masala', 'Toor Dal',
  'Atta', 'Paneer', 'Chana Dal', 'Sona Masoori',
  'MTR Ready Meals', 'Haldiram Snacks',
];

export default function PopularSearches() {
  const router = useRouter();

  return (
    <section className="py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <p className="text-sm font-bold text-masala-text-muted mb-4">
          🔥 Trending Today
        </p>
        <div className="scroll-x-snap gap-2 pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex sm:flex-wrap">
          {POPULAR_SEARCHES.map((term) => (
            <button
              key={term}
              onClick={() => router.push(`/search?q=${encodeURIComponent(term)}`)}
              className="px-4 py-2 rounded-xl bg-white border border-masala-border text-xs font-bold text-masala-text hover:bg-masala-primary hover:text-white hover:border-masala-primary transition-all duration-200 whitespace-nowrap flex-shrink-0"
            >
              {term}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

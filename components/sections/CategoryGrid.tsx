'use client';

import { useLang } from '@/lib/utils/LanguageContext';

const CATEGORIES = [
  { emoji: '🌾', key: 'category.flour', query: 'wheat flour' },
  { emoji: '🍚', key: 'category.basmati', query: 'basmati rice' },
  { emoji: '🍛', key: 'category.southrice', query: 'ponni rice' },
  { emoji: '🥣', key: 'category.grains', query: 'flour mixes' },
  { emoji: '🌶️', key: 'category.spices', query: 'spices masala' },
  { emoji: '🍜', key: 'category.instant', query: 'ready to eat' },
  { emoji: '🍬', key: 'category.sweets', query: 'indian sweets' },
  { emoji: '🍘', key: 'category.snacks', query: 'namkeen snacks' },
  { emoji: '🥫', key: 'category.pickles', query: 'pickles chutney' },
  { emoji: '🥤', key: 'category.beverages', query: 'tea coffee' },
  { emoji: '🧴', key: 'category.care', query: 'home care' },
  { emoji: '🪔', key: 'category.pooja', query: 'pooja items' },
];

export default function CategoryGrid() {
  const { t } = useLang();

  return (
    <section className="py-16 px-4 max-w-7xl mx-auto">
      <div className="text-center mb-8 sm:mb-10">
        <h2 className="text-3xl sm:text-4xl font-black text-masala-text" style={{ fontFamily: 'Fraunces, serif' }}>
          {t('categories.title')}
        </h2>
        <p className="text-masala-text-muted mt-3 text-base sm:text-lg">
          {t('categories.subtitle')}
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
        {CATEGORIES.map(cat => (
          <a
            key={cat.query}
            href={`/search?q=${encodeURIComponent(cat.query)}`}
            className="group relative rounded-[1.5rem] border border-masala-border p-4 sm:p-5
              flex flex-col items-center text-center gap-2.5 sm:gap-3
              hover:border-masala-primary/30 hover:shadow-xl hover:-translate-y-1
              transition-all duration-300 cursor-pointer overflow-hidden bg-white min-h-[132px] sm:min-h-[146px]"
          >
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-br from-masala-pill/50 to-white" />

            <span className="relative text-3xl sm:text-4xl group-hover:scale-110 transition-transform duration-300">
              {cat.emoji}
            </span>
            <div className="relative">
              <span className="block text-[13px] sm:text-[14px] font-black text-masala-text leading-tight">
                {t(cat.key)}
              </span>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}

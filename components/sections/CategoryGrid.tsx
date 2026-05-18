const CATEGORIES = [
  { emoji: '🌾', label: 'Wheat / Chapati Flour', query: 'wheat flour' },
  { emoji: '🍚', label: 'Basmati Rice', query: 'basmati rice' },
  { emoji: '🍛', label: 'South Indian Rice', query: 'ponni rice' },
  { emoji: '🥣', label: 'Grains, Flours & Mixes', query: 'flour mixes' },
  { emoji: '🌶️', label: 'Spices & Condiments', query: 'spices masala' },
  { emoji: '🍜', label: 'Instant Food / Ready To Eat', query: 'ready to eat' },
  { emoji: '🍬', label: 'Sweets', query: 'indian sweets' },
  { emoji: '🍘', label: 'Savoury Snacks', query: 'namkeen snacks' },
  { emoji: '🥫', label: 'Pickles & Sauces', query: 'pickles chutney' },
  { emoji: '🥤', label: 'Beverages', query: 'tea coffee' },
  { emoji: '🧴', label: 'Personal & Home Care', query: 'home care' },
  { emoji: '🪔', label: 'Pooja Items', query: 'pooja items' },
];

export default function CategoryGrid() {
  return (
    <section className="py-16 px-4 max-w-7xl mx-auto">
      <div className="text-center mb-8 sm:mb-10">
        <h2 className="text-3xl sm:text-4xl font-black text-masala-text" style={{ fontFamily: 'Fraunces, serif' }}>
          Explore Popular Categories
        </h2>
        <p className="text-masala-text-muted mt-3 text-base sm:text-lg">
          Jump straight into what you want to compare across stores
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
                {cat.label}
              </span>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}

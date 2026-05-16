const CATEGORIES = [
  { emoji: '🌾', label: 'Atta & Rice',       slug: 'atta-rice',       count: '320+' },
  { emoji: '🫘', label: 'Dal & Pulses',       slug: 'dal-pulses',      count: '180+' },
  { emoji: '🧈', label: 'Dairy & Ghee',       slug: 'dairy-ghee',      count: '95+'  },
  { emoji: '🌶️', label: 'Masala & Spices',   slug: 'masala-spices',   count: '410+' },
  { emoji: '🍵', label: 'Tea & Coffee',       slug: 'tea-coffee',      count: '140+' },
  { emoji: '🫙', label: 'Pickles & Chutneys', slug: 'pickles',         count: '75+'  },
  { emoji: '🍘', label: 'Snacks',             slug: 'snacks',          count: '290+' },
  { emoji: '🥗', label: 'Frozen Food',        slug: 'frozen',          count: '120+' },
  { emoji: '🧴', label: 'Personal Care',      slug: 'personal-care',   count: '85+'  },
  { emoji: '🏠', label: 'Home Essentials',    slug: 'home',            count: '60+'  },
];

export default function CategoryGrid() {
  return (
    <section className="py-14 px-4 max-w-7xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-black" style={{ fontFamily: 'Fraunces, serif' }}>
          Shop by Category
        </h2>
        <p className="text-masala-text-muted mt-2">Browse 5,000+ Indian products across 8 stores</p>
      </div>

      {/* 5-col desktop, 2-col mobile */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
        {CATEGORIES.map(cat => (
          <a
            key={cat.slug}
            href={`/search?category=${cat.slug}`}
            className="group bg-white rounded-2xl border border-masala-border p-4 
              flex flex-col items-center text-center gap-2
              hover:border-masala-primary/50 hover:shadow-md hover:bg-masala-primary/3
              transition-all duration-200 cursor-pointer"
          >
            <span className="text-3xl sm:text-4xl group-hover:scale-110 transition-transform duration-200">
              {cat.emoji}
            </span>
            <span className="text-[13px] font-semibold text-masala-text leading-tight">
              {cat.label}
            </span>
            <span className="text-[10px] text-masala-text-muted font-medium">
              {cat.count} products
            </span>
          </a>
        ))}
      </div>
    </section>
  );
}

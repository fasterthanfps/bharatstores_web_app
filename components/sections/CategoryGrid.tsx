import { getStoreConfig } from '@/lib/stores';

const CATEGORIES = [
  { emoji: '🌾', label: 'Atta & Rice',       slug: 'atta-rice',       count: '320+', color: '#FDF7F2' },
  { emoji: '🫘', label: 'Dal & Pulses',       slug: 'dal-pulses',      count: '180+', color: '#F5F9F5' },
  { emoji: '🧈', label: 'Dairy & Ghee',       slug: 'dairy-ghee',      count: '95+',  color: '#FFFDF0' },
  { emoji: '🌶️', label: 'Masala & Spices',   slug: 'masala-spices',   count: '410+', color: '#FFF5F5' },
  { emoji: '🍘', label: 'Snacks',             slug: 'snacks',          count: '290+', color: '#F7F7FF' },
];

export default function CategoryGrid() {
  return (
    <section className="py-20 px-4 max-w-7xl mx-auto">
      <div className="text-center mb-12">
        <h2 className="text-3xl sm:text-4xl font-black text-masala-text" style={{ fontFamily: 'Fraunces, serif' }}>
          Shop by Category
        </h2>
        <p className="text-masala-text-muted mt-3 text-lg">Browse 5,000+ Indian products across 8 stores</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {CATEGORIES.map(cat => (
          <a
            key={cat.slug}
            href={`/search?category=${cat.slug}`}
            className="group relative rounded-[2rem] border border-masala-border p-6 
              flex flex-col items-center text-center gap-3
              hover:border-masala-primary/30 hover:shadow-xl hover:-translate-y-1
              transition-all duration-300 cursor-pointer overflow-hidden bg-white"
          >
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" 
              style={{ backgroundColor: cat.color }} />
            
            <span className="relative text-4xl sm:text-5xl group-hover:scale-110 transition-transform duration-300">
              {cat.emoji}
            </span>
            <div className="relative">
              <span className="block text-[15px] font-black text-masala-text leading-tight mb-1">
                {cat.label}
              </span>
              <span className="block text-[11px] text-masala-text-muted font-bold uppercase tracking-wider">
                {cat.count} items
              </span>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}

import { STORE_CONFIG } from '@/lib/stores';

const STORE_STATS: Record<string, { products: string; since: string }> = {
  dookan:       { products: '800+',  since: '2021' },
  jamoona:      { products: '600+',  since: '2020' },
  swadesh:      { products: '500+',  since: '2022' },
  nammamarkt:   { products: '700+',  since: '2019' },
  angaadi:      { products: '400+',  since: '2022' },
  littleindia:  { products: '350+',  since: '2021' },
  spicevillage: { products: '550+',  since: '2020' },
  grocera:      { products: '450+',  since: '2023' },
};

export default function StoreTrustBar() {
  return (
    <section className="py-12 px-4 max-w-7xl mx-auto">
      <p className="text-center text-xs font-black uppercase tracking-[0.3em] text-masala-text-muted mb-8">
        Comparing prices across these stores
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        {Object.entries(STORE_CONFIG).map(([slug, config]) => {
          const stats = STORE_STATS[slug];
          return (
            <div key={slug} 
              className="flex flex-col items-center gap-2 p-3 rounded-xl border border-masala-border 
                bg-white hover:shadow-sm hover:border-masala-primary/30 transition-all">
              <div 
                className="w-10 h-10 rounded-xl text-sm font-black flex items-center justify-center"
                style={{ background: config.color, color: config.textColor }}
              >
                {config.initials}
              </div>
              <span className="text-[12px] font-semibold text-masala-text text-center">
                {config.label}
              </span>
              <span className="text-[10px] text-masala-text-muted">{stats?.products}</span>
            </div>
          );
        })}
      </div>
    </section>
  );
}

import { STORE_CONFIG } from '@/lib/stores';

export default function StoreTrustBar() {
  return (
    <section className="py-20 px-4 max-w-7xl mx-auto">
      <div className="text-center mb-12">
        <p className="text-[11px] font-black uppercase tracking-[0.4em] text-masala-text-muted mb-4 opacity-70">
          Integrated with 8 leading stores
        </p>
      </div>
      
      <div className="flex flex-wrap justify-center items-center gap-x-12 gap-y-10 px-4 sm:px-12 opacity-40 hover:opacity-100 transition-opacity duration-700">
        {Object.entries(STORE_CONFIG).map(([slug, config]) => (
          <div key={slug} className="flex flex-col items-center group cursor-default">
            <div 
              className="w-14 h-14 rounded-2xl text-lg font-black flex items-center justify-center transition-all duration-500 grayscale group-hover:grayscale-0 group-hover:scale-110 group-hover:rotate-3 shadow-sm group-hover:shadow-xl"
              style={{ background: config.color, color: config.textColor }}
            >
              {config.initials}
            </div>
            <span className="text-[11px] font-black text-masala-text mt-4 uppercase tracking-[0.2em] opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
              {config.label}
            </span>
          </div>
        ))}
      </div>
      
      <div className="mt-16 text-center">
        <div className="inline-flex items-center gap-6 px-8 py-4 rounded-[2rem] bg-masala-pill border border-masala-border shadow-sm">
           <div className="flex items-center gap-2">
              <span className="text-xs font-black text-masala-text">Live Prices</span>
              <div className="flex h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
           </div>
           <div className="w-px h-4 bg-masala-border" />
           <p className="text-[11px] font-bold text-masala-text-muted uppercase tracking-widest">
              Last synced 14 minutes ago
           </p>
        </div>
      </div>
    </section>
  );
}

export default function CTABanner() {
  return (
    <section className="px-4 pb-20 max-w-7xl mx-auto">
      <div className="relative bg-gradient-to-br from-masala-primary via-masala-secondary to-masala-accent rounded-[2.5rem] p-10 sm:p-20 text-center text-white overflow-hidden shadow-2xl shadow-masala-primary/20">
        {/* Decorative blobs */}
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-masala-accent/20 rounded-full blur-3xl" />
        
        <div className="relative z-10">
          <h2 className="text-3xl sm:text-5xl font-black mb-6 leading-tight" style={{ fontFamily: 'Fraunces, serif' }}>
            Ready to save on your <br className="hidden sm:block" /> next grocery run?
          </h2>
          <p className="text-white/80 text-lg sm:text-xl mb-10 max-w-2xl mx-auto leading-relaxed">
            Join thousands of smart shoppers in Germany finding the best deals on Indian food daily. 
            Exact matches from all 8 major stores, instantly.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <a href="/search" 
              className="w-full sm:w-auto px-10 py-4 bg-white text-masala-primary rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl hover:scale-105 active:scale-95 transition-all">
              Get Started for Free
            </a>
            <a href="/search?q=deals"
              className="w-full sm:w-auto px-10 py-4 bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-white/20 transition-all">
              View Today's Deals
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

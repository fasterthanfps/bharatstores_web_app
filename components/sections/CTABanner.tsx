export default function CTABanner() {
  return (
    <section className="px-4 pb-16 max-w-7xl mx-auto">
      <div className="bg-masala-primary rounded-3xl p-10 sm:p-14 text-center text-white">
        <h2 className="text-3xl sm:text-4xl font-black mb-3" style={{ fontFamily: 'Fraunces, serif' }}>
          Ready to save on your next grocery run?
        </h2>
        <p className="text-white/70 text-lg mb-8 max-w-lg mx-auto">
          Join thousands of smart shoppers in Germany finding the best deals on Indian food daily.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <a href="/search" 
            className="px-8 py-3.5 bg-white text-masala-primary rounded-xl font-bold 
              hover:bg-masala-bg transition-colors">
            Get Started for Free →
          </a>
          <a href="/deals"
            className="px-8 py-3.5 border-2 border-white/30 text-white rounded-xl font-bold 
              hover:bg-white/10 transition-colors">
            View Today's Deals
          </a>
        </div>
      </div>
    </section>
  );
}

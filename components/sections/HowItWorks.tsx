const STEPS = [
  {
    number: '01',
    icon: '🔍',
    title: 'Search Any Product',
    desc: 'Type in English or German. Our smart search understands both and finds exact matches instantly.',
    color: 'bg-blue-50 border-blue-100',
    numColor: 'text-blue-400',
  },
  {
    number: '02', 
    icon: '📊',
    title: 'Compare Live Prices',
    desc: 'See prices from all 8 Indian stores side by side — updated every few hours. Including delivery costs.',
    color: 'bg-amber-50 border-amber-100',
    numColor: 'text-amber-400',
  },
  {
    number: '03',
    icon: '🛒',
    title: 'Add to Smart Cart',
    desc: 'Add items from multiple stores. We calculate delivery totals and show you the cheapest real basket.',
    color: 'bg-green-50 border-green-100',
    numColor: 'text-green-400',
  },
  {
    number: '04',
    icon: '✅',
    title: 'Checkout at Best Price',
    desc: 'Go directly to the store with your cart pre-filled. One click. No re-typing. Save time and money.',
    color: 'bg-masala-muted border-masala-border',
    numColor: 'text-masala-primary/40',
  },
];

export default function HowItWorks() {
  return (
    <section className="py-16 bg-white border-y border-masala-border">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-10">
          <span className="text-xs font-black uppercase tracking-[0.3em] text-masala-primary">
            How it works
          </span>
          <h2 className="text-3xl font-black mt-2" style={{ fontFamily: 'Fraunces, serif' }}>
            Save smarter in 4 steps
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {STEPS.map((step, i) => (
            <div key={i} className={`relative rounded-2xl border p-6 ${step.color}`}>
              <span className={`text-5xl font-black ${step.numColor} leading-none`}>
                {step.number}
              </span>
              <div className="text-3xl mt-3 mb-2">{step.icon}</div>
              <h3 className="font-bold text-masala-text mb-2">{step.title}</h3>
              <p className="text-sm text-masala-text-muted leading-relaxed">{step.desc}</p>
              {i < STEPS.length - 1 && (
                <div className="hidden lg:block absolute top-1/2 -right-3 text-masala-border text-xl z-10">
                  →
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

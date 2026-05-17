import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service – BharatStores.eu',
  description: 'Terms of service and usage conditions for BharatStores.eu price comparison services.',
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-masala-bg pt-28 pb-20">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-10 text-center md:text-left">
          <p className="text-xs font-black uppercase tracking-widest text-masala-primary mb-2">Usage Agreement</p>
          <h1 className="text-4xl md:text-5xl font-black text-masala-text tracking-tight" style={{ fontFamily: 'Fraunces, serif' }}>
            Terms &amp; <span className="text-masala-primary italic">Conditions</span>
          </h1>
        </div>

        {/* Content Card */}
        <div className="bg-white rounded-3xl border border-masala-border p-8 md:p-12 shadow-sm space-y-10 text-masala-text text-sm md:text-base leading-relaxed">
          
          <p className="font-semibold text-masala-text-muted">
            Welcome to BharatStores.eu. By accessing and using our website, you agree to comply with and be bound by the following Terms &amp; Conditions. Please read them carefully.
          </p>

          {/* Section 1: Services */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold tracking-tight border-b border-masala-border pb-2 text-masala-primary">
              1. Scope of Services
            </h2>
            <p>
              BharatStores.eu is a free online price comparison platform that aggregates products and pricing information from various third-party Indian grocery webshops across Europe. 
              <strong> We do not sell any groceries directly, nor are we a retail store or online merchant.</strong> 
              All product purchases are executed directly on the respective third-party merchant's platform. We do not process orders, shipments, or customer service queries regarding purchased goods.
            </p>
          </section>

          {/* Section 2: Pricing Accuracy */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold tracking-tight border-b border-masala-border pb-2 text-masala-primary">
              2. Product &amp; Pricing Accuracy
            </h2>
            <p>
              While we strive to maintain high-quality data and update pricing information multiple times per day, grocery store inventories and prices can shift rapidly. 
              BharatStores.eu assumes no liability for the absolute accuracy, completeness, or correctness of the prices, stock information, shipping costs, or product descriptions displayed on our platform. 
              The actual transaction price on the partner store's checkout page at the time of purchase is the only binding figure.
            </p>
          </section>

          {/* Section 3: Smart Cart & Analytics */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold tracking-tight border-b border-masala-border pb-2 text-masala-primary">
              3. Cart &amp; Saved Data Disclaimer
            </h2>
            <p>
              Our custom features (like the Smart Cart, popular keywords, and recent searches) are stored in your local browser cache to enable seamless comparison experience. 
              We do not guarantee the permanent preservation of local data. Users are responsible for checking final shopping lists before proceeding to retail checkouts.
            </p>
          </section>

          {/* Section 4: Acceptable Use */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold tracking-tight border-b border-masala-border pb-2 text-masala-primary">
              4. Acceptable Use &amp; Intellectual Property
            </h2>
            <p>
              The content, visual layout, logic, and comparison software algorithms of BharatStores.eu are protected by international copyright laws. 
              Automated crawling, scraping, or mass extraction of prices from BharatStores.eu for competing commercial purposes is strictly prohibited without written consent.
            </p>
          </section>

          {/* Section 5: Limitation of Liability */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold tracking-tight border-b border-masala-border pb-2 text-masala-primary">
              5. Limitation of Liability
            </h2>
            <p>
              BharatStores.eu is provided on an "as is" and "as available" basis without any express or implied warranties. 
              We are not responsible for any issues arising from your connection, purchases made at third-party webshops, or temporary platform downtime.
            </p>
          </section>

          {/* Section 6: Modifications */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold tracking-tight border-b border-masala-border pb-2 text-masala-primary">
              6. Modifications to Terms
            </h2>
            <p>
              We reserves the right to modify or replace these terms at any time. Changes will be posted directly to this page. Continued usage of our website indicates your consent to the amended terms.
            </p>
          </section>

        </div>
      </div>
    </div>
  );
}

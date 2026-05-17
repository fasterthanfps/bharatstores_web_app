import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy (Datenschutz) – BharatStores.eu',
  description: 'Privacy policy and data protection information for users of BharatStores.eu.',
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-masala-bg pt-28 pb-20">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-10 text-center md:text-left">
          <p className="text-xs font-black uppercase tracking-widest text-masala-primary mb-2">GDPR Compliance</p>
          <h1 className="text-4xl md:text-5xl font-black text-masala-text tracking-tight" style={{ fontFamily: 'Fraunces, serif' }}>
            Privacy Policy / <span className="text-masala-primary italic">Datenschutz</span>
          </h1>
        </div>

        {/* Content Card */}
        <div className="bg-white rounded-3xl border border-masala-border p-8 md:p-12 shadow-sm space-y-10 text-masala-text text-sm md:text-base leading-relaxed">
          
          <p className="font-semibold text-masala-text-muted">
            Below we inform you about the collection of personal data when using our website. Personal data is all data that can be related to you personally, e.g., name, address, email addresses, user behavior.
          </p>

          {/* Section 1: Controller */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold tracking-tight border-b border-masala-border pb-2 text-masala-primary">
              1. Information on the Collection of Personal Data
            </h2>
            <p>
              The controller pursuant to Art. 4 para. 7 of the EU General Data Protection Regulation (GDPR) is:
            </p>
            <div className="font-semibold text-masala-text-muted mt-2 pl-4 border-l-2 border-masala-primary/40">
              <p>BharatStores.eu Project Group</p>
              <p>c/o BharatStores Europe Tech</p>
              <p>Berlin, Germany</p>
              <p>Email: <a href="mailto:contact@bharatstores.eu" className="text-masala-primary hover:underline">contact@bharatstores.eu</a></p>
            </div>
          </section>

          {/* Section 2: Collection during visit */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold tracking-tight border-b border-masala-border pb-2 text-masala-primary">
              2. Collection of Personal Data When Visiting Our Website
            </h2>
            <p>
              When you use the website for information purposes only, i.e. if you do not register or otherwise provide us with information, we only collect the personal data that your browser transmits to our server. 
              This includes technical data necessary to display our website and ensure stability and security (legal basis: Art. 6 para. 1 sentence 1 lit. f GDPR):
            </p>
            <ul className="list-disc pl-6 space-y-1 font-medium text-masala-text-muted">
              <li>IP address</li>
              <li>Date and time of the request</li>
              <li>Time zone difference to Greenwich Mean Time (GMT)</li>
              <li>Content of the request (specific page)</li>
              <li>Access status/HTTP status code</li>
              <li>Volume of data transferred in each case</li>
              <li>Website from which the request comes (referrer)</li>
              <li>Browser, operating system, and interface</li>
            </ul>
          </section>

          {/* Section 3: Smart platform search clicks */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold tracking-tight border-b border-masala-border pb-2 text-masala-primary">
              3. Processing of Click and Analytics Data
            </h2>
            <p>
              BharatStores.eu is a price comparison search engine. To provide, optimize, and evaluate our comparison services, we process user search terms and interactions (such as when you click a link to go to a partner grocery store). 
              This click data is anonymized/pseudonymized wherever possible and is processed for our legitimate interest in compiling click analytics and referral performance (legal basis: Art. 6 para. 1 sentence 1 lit. f GDPR).
            </p>
          </section>

          {/* Section 4: Cookies */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold tracking-tight border-b border-masala-border pb-2 text-masala-primary">
              4. Cookies &amp; LocalStorage
            </h2>
            <p>
              In addition to the aforementioned data, cookies or local browser storage (LocalStorage) may be stored on your computer when you use our website. 
              These are used to store your preferred language, recently searched items, and comparison carts locally on your browser. 
              Most cookies we use are "session cookies" which are deleted automatically after your visit. You can configure your browser settings to refuse cookies.
            </p>
          </section>

          {/* Section 5: Rights */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold tracking-tight border-b border-masala-border pb-2 text-masala-primary">
              5. Your Rights as a Data Subject
            </h2>
            <p>
              You have the following rights regarding the personal data concerning you:
            </p>
            <ul className="list-disc pl-6 space-y-1 font-medium text-masala-text-muted">
              <li>Right to information (Art. 15 GDPR)</li>
              <li>Right to rectification or erasure (Art. 16 and 17 GDPR)</li>
              <li>Right to restriction of processing (Art. 18 GDPR)</li>
              <li>Right to object to processing (Art. 21 GDPR)</li>
              <li>Right to data portability (Art. 20 GDPR)</li>
            </ul>
            <p className="mt-2 text-sm">
              You also have the right to complain to a data protection supervisory authority about the processing of your personal data by us.
            </p>
          </section>

        </div>
      </div>
    </div>
  );
}

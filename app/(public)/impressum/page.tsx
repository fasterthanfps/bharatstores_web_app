import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Imprint (Impressum) – BharatStores.eu',
  description: 'Legal imprint and operator information for BharatStores.eu, the European Indian grocery price comparison engine.',
};

export default function ImprintPage() {
  return (
    <div className="min-h-screen bg-masala-bg pt-28 pb-20">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-10 text-center md:text-left">
          <p className="text-xs font-black uppercase tracking-widest text-masala-primary mb-2">Legal Notice</p>
          <h1 className="text-4xl md:text-5xl font-black text-masala-text tracking-tight" style={{ fontFamily: 'Fraunces, serif' }}>
            Imprint / <span className="text-masala-primary italic">Impressum</span>
          </h1>
        </div>

        {/* Content Card */}
        <div className="bg-white rounded-3xl border border-masala-border p-8 md:p-12 shadow-sm space-y-10 text-masala-text">
          
          {/* Section 1: Operator info */}
          <section className="space-y-4">
            <h2 className="text-xl font-bold tracking-tight border-b border-masala-border pb-2 text-masala-primary">
              Information pursuant to § 5 TMG / Angaben gemäß § 5 TMG
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm leading-relaxed">
              <div>
                <p className="font-semibold text-masala-text-muted uppercase text-xs tracking-wider mb-1">Operator / Betreiber</p>
                <p className="font-medium text-[15px]">BharatStores.eu Project Group</p>
                <p className="font-medium text-[15px]">c/o BharatStores Europe Tech</p>
                <p className="font-medium text-[15px]">Berlin, Germany</p>
              </div>
              <div>
                <p className="font-semibold text-masala-text-muted uppercase text-xs tracking-wider mb-1">Represented by / Vertreten durch</p>
                <p className="font-medium text-[15px]">Tech Operations Lead</p>
                <p className="font-medium text-[15px]">Email: contact@bharatstores.eu</p>
              </div>
            </div>
          </section>

          {/* Section 2: Contact */}
          <section className="space-y-4">
            <h2 className="text-xl font-bold tracking-tight border-b border-masala-border pb-2 text-masala-primary">
              Contact / Kontakt
            </h2>
            <div className="text-sm leading-relaxed space-y-1 font-medium">
              <p>Email: <a href="mailto:contact@bharatstores.eu" className="text-masala-primary hover:underline font-semibold">contact@bharatstores.eu</a></p>
              <p>Website: <a href="https://bharatstores.eu" className="text-masala-primary hover:underline font-semibold">www.bharatstores.eu</a></p>
            </div>
          </section>

          {/* Section 3: Disclaimer */}
          <section className="space-y-4">
            <h2 className="text-xl font-bold tracking-tight border-b border-masala-border pb-2 text-masala-primary">
              Disclaimer / Haftungsausschluss
            </h2>
            <div className="space-y-6 text-[14px] leading-relaxed font-medium text-masala-text-muted">
              <div className="space-y-2">
                <h3 className="font-bold text-masala-text">Liability for Content (Haftung für Inhalte)</h3>
                <p>
                  As a service provider, we are responsible for our own content on these pages under general laws according to § 7 para. 1 TMG. 
                  However, according to §§ 8 to 10 TMG, we are not obligated to monitor transmitted or stored external information or to investigate circumstances that indicate illegal activity.
                </p>
                <p className="italic text-xs">
                  Als Diensteanbieter sind wir gemäß § 7 Abs.1 TMG für eigene Inhalte auf diesen Seiten nach den allgemeinen Gesetzen verantwortlich. 
                  Nach §§ 8 bis 10 TMG sind wir jedoch nicht verpflichtet, übermittelte oder gespeicherte fremde Informationen zu überwachen oder nach Umständen zu forschen, die auf eine rechtswidrige Tätigkeit hinweisen.
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="font-bold text-masala-text">Liability for Links (Haftung für Links)</h3>
                <p>
                  Our service contains links to external websites of third parties, on whose content we have no influence. Therefore, we cannot assume any liability for these external contents. 
                  The respective provider or operator of the pages is always responsible for the content of the linked pages.
                </p>
                <p className="italic text-xs">
                  Unser Angebot enthält Links zu externen Websites Dritter, auf deren Inhalte wir keinen Einfluss haben. Deshalb können wir für diese fremden Inhalte auch keine Gewähr übernehmen. 
                  Für die Inhalte der verlinkten Seiten ist stets der jeweilige Anbieter oder Betreiber der Seiten verantwortlich.
                </p>
              </div>
            </div>
          </section>

          {/* Section 4: Dispute resolution */}
          <section className="space-y-4">
            <h2 className="text-xl font-bold tracking-tight border-b border-masala-border pb-2 text-masala-primary">
              EU Dispute Resolution / Streitschlichtung
            </h2>
            <p className="text-sm leading-relaxed font-medium">
              The European Commission provides a platform for online dispute resolution (ODR): <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener noreferrer" className="text-masala-primary hover:underline font-semibold">https://ec.europa.eu/consumers/odr</a>.<br />
              Our email address can be found above in the imprint. We are neither willing nor obligated to participate in dispute resolution proceedings before a consumer arbitration board.
            </p>
            <p className="text-xs italic leading-relaxed text-masala-text-muted">
              Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit: https://ec.europa.eu/consumers/odr.<br />
              Unsere E-Mail-Adresse finden Sie oben im Impressum. Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.
            </p>
          </section>

        </div>
      </div>
    </div>
  );
}

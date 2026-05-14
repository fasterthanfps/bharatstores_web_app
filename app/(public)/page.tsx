import type { Metadata } from 'next';
import Link from 'next/link';
import SearchBar from '@/components/search/SearchBar';
import { ShoppingBasket, TrendingDown, Zap, Shield } from 'lucide-react';

export const metadata: Metadata = {
    title: 'BharatStores.eu – Indianische Lebensmittel Preisvergleich in Deutschland',
    description:
        'Vergleiche Preise für Basmati Reis, Amul Ghee, MDH Masala und mehr bei Grocera, Jamoona und Little India. Spare Zeit und Geld!',
};

const FEATURED_CATEGORIES = [
    { label: 'Basmati Reis', emoji: '🍚', query: 'basmati rice' },
    { label: 'Amul Ghee', emoji: '🧈', query: 'ghee' },
    { label: 'MDH Masala', emoji: '🌶️', query: 'spices' },
    { label: 'Toor Dal', emoji: '🫘', query: 'toor dal' },
    { label: 'Chai Tee', emoji: '☕', query: 'chai' },
    { label: 'Atta Mehl', emoji: '🌾', query: 'atta' },
    { label: 'Snacks', emoji: '🍿', query: 'snacks' },
    { label: 'Paneer', emoji: '🧀', query: 'paneer' },
];

const STORES = [
    { name: 'Grocera', domain: 'grocera.de', desc: 'Breites Sortiment' },
    { name: 'Jamoona', domain: 'jamoona.com', desc: 'Shopify Store' },
    { name: 'Little India', domain: 'littleindia.de', desc: 'WooCommerce' },
];

const FEATURES = [
    {
        icon: TrendingDown,
        title: 'Günstigen Preis finden',
        desc: 'Wir vergleichen alle 3 großen deutschen Indienläden und zeigen dir den besten Preis.',
    },
    {
        icon: Zap,
        title: 'Immer aktuell',
        desc: 'Preise werden alle 6 Stunden automatisch aktualisiert – du siehst immer tagesaktuelle Preise.',
    },
    {
        icon: Shield,
        title: 'Kostenlos & transparent',
        desc: 'BharatStores ist kostenlos. Wir verdienen eine kleine Provision wenn du kaufst – ohne Aufpreis für dich.',
    },
];

export default function LandingPage() {
    return (
        <div className="bg-gradient-to-br from-masala-bg to-[#f5dfc8] overflow-hidden">
            {/* Hero Section */}
            <section className="relative px-4 sm:px-6 lg:px-8 pb-16 pt-12 sm:pb-24 sm:pt-20 text-center">
                {/* Decorative glow orbs */}
                <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
                    <div className="absolute left-1/2 top-0 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-masala-pill blur-[120px]" />
                </div>

                <div className="relative mx-auto max-w-4xl">
                    {/* Badge */}
                    <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-masala-primary/20 bg-white/80 px-4 py-1.5 text-xs sm:text-sm text-masala-primary shadow-sm backdrop-blur-md animate-fade-in">
                        <span className="relative flex h-2 w-2">
                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-masala-primary opacity-75" />
                            <span className="relative inline-flex h-2 w-2 rounded-full bg-masala-primary" />
                        </span>
                        Preise gerade aktualisiert · 3 Shops verglichen
                    </div>

                    {/* Headline */}
                    <h1 className="mb-6 text-4xl font-black font-serif leading-[1.1] tracking-tight sm:text-6xl lg:text-7xl animate-fade-in">
                        <span className="gradient-text">One search.</span>
                        <br className="hidden sm:block" />
                        <span className="text-masala-text"> Every Indian store.</span>
                    </h1>

                    <p className="mb-10 text-base sm:text-lg text-masala-text/70 max-w-2xl mx-auto leading-relaxed animate-fade-in" style={{ animationDelay: '0.1s' }}>
                        Vergleiche Preise für Basmati Reis, Ghee, Masala & mehr bei{' '}
                        <span className="text-masala-text font-bold">Grocera</span>,{' '}
                        <span className="text-masala-text font-bold">Jamoona</span> und{' '}
                        <span className="text-masala-text font-bold">Little India</span> – in Lichtgeschwindigkeit.
                    </p>

                    {/* Search Bar */}
                    <div className="mx-auto max-w-2xl">
                        <SearchBar size="hero" />
                    </div>
                </div>
            </section>

            {/* Featured Categories */}
            <section className="px-4 sm:px-6 lg:px-8 pb-16 pt-4 sm:pt-0">
                <div className="mx-auto max-w-5xl">
                    <h2 className="mb-8 text-center text-xs font-bold uppercase tracking-[0.2em] text-masala-text/50 animate-fade-in" style={{ animationDelay: '0.2s' }}>
                        Beliebte Kategorien
                    </h2>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 animate-fade-in" style={{ animationDelay: '0.3s' }}>
                        {FEATURED_CATEGORIES.map((cat) => (
                            <Link
                                key={cat.query}
                                href={`/search?q=${encodeURIComponent(cat.query)}`}
                                className="bg-white border border-masala-border flex flex-col items-center gap-3 p-6 rounded-2xl hover:border-masala-primary/40 hover:bg-masala-pill transition-all duration-300 group shadow-sm hover:shadow-md"
                            >
                                <div className="text-4xl group-hover:scale-110 transition-transform duration-300">{cat.emoji}</div>
                                <span className="text-sm font-semibold text-masala-text/80 group-hover:text-masala-primary text-center transition-colors">
                                    {cat.label}
                                </span>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            {/* Store Logos */}
            <section className="border-y border-masala-border px-4 sm:px-6 lg:px-8 py-12 bg-white/50">
                <div className="mx-auto max-w-5xl text-center">
                    <p className="mb-10 text-xs font-bold uppercase tracking-[0.2em] text-masala-text/60">
                        Wir vergleichen diese Shops für dich
                    </p>
                    <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-12">
                        {STORES.map((store) => (
                            <div
                                key={store.domain}
                                className="flex flex-col items-center gap-2 group animate-fade-in"
                            >
                                <div className="h-14 w-44 rounded-2xl bg-white border border-masala-border flex items-center justify-center group-hover:border-masala-primary/30 group-hover:shadow-md transition-all duration-300 shadow-sm">
                                    <span className="text-sm font-bold font-serif text-masala-text group-hover:text-masala-primary">{store.name}</span>
                                </div>
                                <span className="text-[10px] sm:text-xs font-medium text-masala-text/60 group-hover:text-masala-text transition-colors uppercase tracking-wider">{store.desc}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Features */}
            <section className="px-4 sm:px-6 lg:px-8 py-24">
                <div className="mx-auto max-w-5xl">
                    <h2 className="mb-16 text-center text-3xl font-black font-serif text-masala-text sm:text-4xl">
                        Warum <span className="gradient-text">BharatStores</span>?
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {FEATURES.map((feat, i) => (
                            <div key={feat.title} className="bg-white border border-masala-border rounded-2xl p-8 space-y-5 group hover:border-masala-primary/30 transition-all duration-300 shadow-sm hover:shadow-md animate-fade-in" style={{ animationDelay: `${0.4 + i * 0.1}s` }}>
                                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-masala-pill border border-masala-primary/20 group-hover:scale-110 transition-transform duration-300">
                                    <feat.icon className="h-6 w-6 text-masala-primary" />
                                </div>
                                <h3 className="text-xl font-bold font-serif text-masala-text">{feat.title}</h3>
                                <p className="text-masala-text/70 leading-relaxed">{feat.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="px-4 sm:px-6 lg:px-8 pb-24">
                <div className="mx-auto max-w-3xl">
                    <div className="rounded-3xl border border-masala-primary/20 bg-white p-10 text-center shadow-xl shadow-masala-primary/5">
                        <ShoppingBasket className="h-12 w-12 text-masala-primary mx-auto mb-4" />
                        <h2 className="text-2xl font-bold font-serif text-masala-text mb-3">
                            Jetzt Preise vergleichen
                        </h2>
                        <p className="text-masala-text/70 mb-6 text-sm">
                            Spare durchschnittlich 15–30% bei deinem nächsten indischen Einkauf.
                        </p>
                        <Link
                            href="/search?q=basmati rice"
                            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl gradient-header text-white font-semibold hover:opacity-90 transition-all shadow-lg shadow-masala-primary/25 active:scale-95"
                        >
                            <ShoppingBasket className="h-5 w-5" />
                            Preisvergleich starten
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    );
}

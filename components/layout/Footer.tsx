import Link from 'next/link';
import { Heart } from 'lucide-react';

export default function Footer() {
    return (
        <footer className="relative mt-20 border-t border-masala-border bg-white pt-16 pb-8 px-4 sm:px-6 lg:px-8 overflow-hidden">
            {/* Background Glow */}
            <div className="absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-masala-pill blur-[100px] pointer-events-none" />

            <div className="mx-auto max-w-7xl relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
                    <div className="col-span-1 md:col-span-2 space-y-6">
                        <Link href="/" className="flex items-center mb-6">
                            <span className="text-2xl font-black font-serif tracking-tight text-masala-primary group-hover:scale-105 transition-transform">
                                Bharat<span className="text-masala-secondary">Stores</span>
                            </span>
                        </Link>
                        <p className="text-masala-text/70 text-sm max-w-sm leading-relaxed">
                            Dein ultimativer Preisvergleich für indische Lebensmittel in Deutschland.
                            Wir helfen dir, die besten Angebote für deine Lieblingsprodukte zu finden.
                        </p>
                    </div>

                    <div>
                        <h4 className="text-masala-text font-bold font-serif mb-6 text-sm uppercase tracking-widest">Partner Shops</h4>
                        <ul className="space-y-3">
                            {['Grocera', 'Jamoona', 'Little India', 'Namma Markt'].map((shop) => (
                                <li key={shop}>
                                    <span className="text-masala-text/60 text-sm hover:text-masala-primary cursor-default transition-colors">{shop}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div>
                        <h4 className="text-masala-text font-bold font-serif mb-6 text-sm uppercase tracking-widest">Rechtliches</h4>
                        <ul className="space-y-3 text-sm">
                            <li><Link href="/impressum" className="text-masala-text/60 hover:text-masala-text transition-colors">Impressum</Link></li>
                            <li><Link href="/datenschutz" className="text-masala-text/60 hover:text-masala-text transition-colors">Datenschutz</Link></li>
                        </ul>
                    </div>
                </div>

                <div className="pt-8 border-t border-masala-border flex flex-col sm:flex-row justify-between items-center gap-4 text-[10px] font-bold uppercase tracking-[0.2em] text-masala-text/50">
                    <p>© {new Date().getFullYear()} BharatStores.eu</p>
                    <div className="flex items-center gap-1">
                        Designed with <Heart className="h-3 w-3 text-masala-primary" /> for the Desi Community in 🇩🇪
                    </div>
                </div>
            </div>
        </footer>
    );
}

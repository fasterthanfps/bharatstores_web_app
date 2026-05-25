'use client';

import Link from 'next/link';
import { ShoppingBasket, CheckCircle2, TrendingDown, Bell, ArrowLeft } from 'lucide-react';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen w-full bg-masala-bg relative overflow-hidden flex flex-col lg:flex-row font-sans">
            {/* Ambient Background Glowing Orbs */}
            <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full filter blur-[120px] pointer-events-none opacity-40 bg-radial from-masala-primary/10 to-transparent animate-pulse" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[45%] h-[45%] rounded-full filter blur-[120px] pointer-events-none opacity-30 bg-radial from-masala-accent/15 to-transparent" />

            {/* Left Column: Visual Showcase Pane (Desktop Only) */}
            <div className="hidden lg:flex lg:w-1/2 relative bg-masala-primary/5 border-r border-masala-border/40 p-16 flex-col justify-between overflow-hidden">
                {/* Visual grid overlay for premium texture */}
                <div className="absolute inset-0 hero-dot-grid opacity-30 pointer-events-none" />

                {/* Top Nav/Branding */}
                <div className="relative z-10">
                    <Link href="/" className="flex items-center gap-3 group w-fit">
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-masala-primary to-masala-accent shadow-md shadow-masala-primary/20 group-hover:scale-105 transition-transform duration-300">
                            <ShoppingBasket className="h-5 w-5 text-white" />
                        </div>
                        <span className="text-2xl font-black tracking-tight">
                            <span className="gradient-text">Bharat</span>
                            <span className="text-masala-text">Stores</span>
                        </span>
                    </Link>
                </div>

                {/* Hero Showcase Content */}
                <div className="relative z-10 max-w-lg my-auto space-y-8 animate-fade-in">
                    <div className="space-y-4">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-masala-primary/10 text-masala-primary text-xs font-black uppercase tracking-wider">
                            ✨ Europe's #1 comparison portal
                        </span>
                        <h2 className="text-4xl xl:text-5xl font-black text-masala-text leading-[1.15] font-display">
                            Smarter shopping. <br />
                            <span className="gradient-text">Unbeatable savings.</span>
                        </h2>
                        <p className="text-sm text-masala-text-muted leading-relaxed font-semibold">
                            Compare Indian groceries across multiple premium stores in Europe, track real-time price drops, and build your smart cart to unlock deep savings of up to 40% every single week.
                        </p>
                    </div>

                    {/* Features list */}
                    <div className="space-y-4">
                        {[
                          {
                            icon: CheckCircle2,
                            title: 'Real-Time Price Comparison',
                            desc: 'Instant price check across Spice Village, Kohinoor, Bharat Stores & more.',
                            color: 'text-emerald-600 bg-emerald-50'
                          },
                          {
                            icon: Bell,
                            title: 'Instant Price Alerts',
                            desc: 'Get notified via email when your favorite products drop below your target price.',
                            color: 'text-amber-600 bg-amber-50'
                          },
                          {
                            icon: TrendingDown,
                            title: 'Smart Cart Optimization',
                            desc: 'Automatically distribute your cart items across stores to find the absolute lowest total cost.',
                            color: 'text-indigo-600 bg-indigo-50'
                          }
                        ].map((feat, i) => (
                            <div key={i} className="flex gap-4 p-4 rounded-2xl bg-white/60 border border-masala-border/30 hover:bg-white transition-colors duration-300 shadow-sm">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${feat.color}`}>
                                    <feat.icon className="h-5 w-5" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-masala-text">{feat.title}</h3>
                                    <p className="text-xs text-masala-text-muted leading-normal mt-0.5">{feat.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Bottom Footer Details */}
                <div className="relative z-10 flex items-center justify-between text-xs text-masala-text-light font-bold">
                    <Link href="/" className="hover:text-masala-primary flex items-center gap-1.5 transition-colors">
                        <ArrowLeft className="h-4 w-4" />
                        <span>Back to home</span>
                    </Link>
                    <span>© {new Date().getFullYear()} BharatStores.eu</span>
                </div>
            </div>

            {/* Right Column: Form Container */}
            <div className="flex-1 flex flex-col justify-center items-center px-6 py-12 lg:py-16 relative z-10">
                {/* Mobile Header Branding (Visible only on mobile/tablet) */}
                <div className="lg:hidden mb-8">
                    <Link href="/" className="flex items-center gap-2 group justify-center">
                        <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br from-masala-primary to-masala-accent shadow-md shadow-masala-primary/20">
                            <ShoppingBasket className="h-4 w-4 text-white" />
                        </div>
                        <span className="text-xl font-black">
                            <span className="gradient-text">Bharat</span>
                            <span className="text-masala-text">Stores</span>
                        </span>
                    </Link>
                </div>

                {/* Floating Form Glass Card Container */}
                <div className="w-full max-w-[440px] bg-white/80 backdrop-blur-md border border-masala-border/40 p-8 rounded-[32px] shadow-[0_24px_64px_-16px_rgba(139,32,32,0.06)] hover:shadow-[0_32px_80px_-16px_rgba(139,32,32,0.08)] transition-all duration-500 animate-slide-up">
                    {children}
                </div>

                {/* Mobile back to home link */}
                <div className="lg:hidden mt-6 text-center">
                    <Link href="/" className="text-xs font-black text-masala-text-muted hover:text-masala-primary flex items-center gap-1 justify-center transition-colors">
                        <ArrowLeft className="h-4.5 w-4.5" />
                        <span>Zurück zur Startseite</span>
                    </Link>
                </div>
            </div>
        </div>
    );
}

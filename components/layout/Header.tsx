'use client';

import Link from 'next/link';
import { ShoppingBasket, Bell, User, Menu, X } from 'lucide-react';
import { useState } from 'react';

export default function Header() {
    const [menuOpen, setMenuOpen] = useState(false);

    return (
        <header className="sticky top-0 z-50 border-b border-masala-border bg-masala-bg/80 backdrop-blur-xl">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="flex h-16 items-center justify-between">
                    <Link href="/" className="flex items-center group flex-shrink-0">
                        {/* We use a text logo or keep the img if it exists. Since the bg changed, logo might need to be visible. Let's use text for now to be safe. */}
                        <span className="text-2xl font-black font-serif tracking-tight text-masala-primary group-hover:scale-105 transition-transform">
                            Bharat<span className="text-masala-secondary">Stores</span>
                        </span>
                    </Link>

                    {/* Desktop Nav */}
                    <nav className="hidden md:flex items-center gap-1">
                        <NavLink href="/search?q=basmati rice">Reis & Getreide</NavLink>
                        <NavLink href="/search?q=spices">Gewürze</NavLink>
                        <NavLink href="/search?q=ghee">Öl & Ghee</NavLink>
                        <NavLink href="/search?q=snacks">Snacks</NavLink>
                        <NavLink href="/search?q=tea">Tee</NavLink>
                    </nav>

                    {/* Right side */}
                    <div className="flex items-center gap-2">
                        <Link
                            href="/account/alerts"
                            className="hidden md:flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-masala-text hover:text-masala-primary hover:bg-masala-border/50 transition-colors"
                        >
                            <Bell className="h-4 w-4" />
                            <span>Preisalarm</span>
                        </Link>
                        <Link
                            href="/account"
                            className="hidden md:flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-masala-text hover:text-masala-primary hover:bg-masala-border/50 transition-colors"
                        >
                            <User className="h-4 w-4" />
                            <span>Konto</span>
                        </Link>
                        <button
                            className="md:hidden rounded-lg p-2 text-masala-text hover:text-masala-primary hover:bg-masala-border/50 transition-colors"
                            onClick={() => setMenuOpen(!menuOpen)}
                            aria-label="Menü öffnen"
                        >
                            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            {menuOpen && (
                <div className="md:hidden border-t border-masala-border bg-masala-bg/95 backdrop-blur-xl px-4 py-4 space-y-1 shadow-xl">
                    <MobileNavLink href="/search?q=basmati rice" onClick={() => setMenuOpen(false)}>Reis & Getreide</MobileNavLink>
                    <MobileNavLink href="/search?q=spices" onClick={() => setMenuOpen(false)}>Gewürze</MobileNavLink>
                    <MobileNavLink href="/search?q=ghee" onClick={() => setMenuOpen(false)}>Öl & Ghee</MobileNavLink>
                    <MobileNavLink href="/search?q=snacks" onClick={() => setMenuOpen(false)}>Snacks</MobileNavLink>
                    <MobileNavLink href="/search?q=tea" onClick={() => setMenuOpen(false)}>Tee</MobileNavLink>
                    <div className="border-t border-masala-border pt-3 mt-3 space-y-1">
                        <MobileNavLink href="/account/alerts" onClick={() => setMenuOpen(false)}>🔔 Preisalarm</MobileNavLink>
                        <MobileNavLink href="/account" onClick={() => setMenuOpen(false)}>👤 Mein Konto</MobileNavLink>
                    </div>
                </div>
            )}
        </header>
    );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
    return (
        <Link
            href={href}
            className="rounded-lg px-3 py-1.5 text-sm font-medium text-masala-text hover:text-masala-primary hover:bg-masala-border/50 transition-colors"
        >
            {children}
        </Link>
    );
}

function MobileNavLink({
    href,
    children,
    onClick,
}: {
    href: string;
    children: React.ReactNode;
    onClick?: () => void;
}) {
    return (
        <Link
            href={href}
            onClick={onClick}
            className="block rounded-lg px-3 py-2.5 text-sm font-medium text-masala-text hover:text-masala-primary hover:bg-masala-border/50 transition-colors"
        >
            {children}
        </Link>
    );
}

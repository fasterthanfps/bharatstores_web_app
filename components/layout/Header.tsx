'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bell, User, Menu, X, BookOpen } from 'lucide-react';
import { useState, useEffect } from 'react';
import LanguageToggle from '@/components/layout/LanguageToggle';
import SearchAutocomplete from '@/components/search/SearchAutocomplete';
import { useLang } from '@/lib/utils/LanguageContext';

export default function Header() {
    const [menuOpen, setMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const pathname = usePathname();
    const { t } = useLang();

    const isHome = pathname === '/';

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 200);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // On homepage, hide mobile search bar until scrolled
    const showMobileSearch = !isHome || scrolled;

    return (
        <header className="sticky top-0 z-50 bg-masala-bg/90 backdrop-blur-xl shadow-[0_1px_0_0_rgba(240,224,204,0.8)] border-b border-masala-border/50">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="flex h-[72px] items-center gap-3 justify-between">

                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-1.5 group flex-shrink-0">
                        <span className="text-xl sm:text-2xl font-black font-serif tracking-tight text-masala-primary group-hover:scale-105 transition-transform">
                            Bharat<span className="text-masala-secondary">Stores</span>
                            <span className="text-[10px] sm:text-xs text-masala-text/40 font-sans font-semibold tracking-normal ml-0.5">.eu</span>
                        </span>
                    </Link>

                    {/* Search Bar — center/flex-grow (Desktop always, Mobile on scroll) */}
                    <div className={`hidden md:flex flex-1 justify-center px-4 max-w-2xl mx-auto transition-opacity duration-300 ${isHome && !scrolled ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
                        <SearchAutocomplete size="header" />
                    </div>

                    {/* Right side: Blog · Price Alert · Account · Lang Toggle · Mobile Menu */}
                    <div className="flex items-center gap-1 sm:gap-1.5 flex-shrink-0">
                        {/* Blog */}
                        <Link
                            href="/blog"
                            className="hidden md:flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-sm font-medium text-masala-text hover:text-masala-primary hover:bg-masala-border/40 transition-colors"
                        >
                            <BookOpen className="h-4 w-4" />
                            <span>{t('blog')}</span>
                        </Link>

                        {/* Price Alert */}
                        <Link
                            href="/account/alerts"
                            className="hidden md:flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-sm font-medium text-masala-text hover:text-masala-primary hover:bg-masala-border/40 transition-colors"
                        >
                            <Bell className="h-4 w-4" />
                            <span>{t('priceAlert')}</span>
                        </Link>

                        {/* Account */}
                        <Link
                            href="/account"
                            className="hidden md:flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-sm font-medium text-masala-text hover:text-masala-primary hover:bg-masala-border/40 transition-colors"
                        >
                            <User className="h-4 w-4" />
                            <span>{t('account')}</span>
                        </Link>

                        {/* Separator & Language Toggle */}
                        <div className="hidden md:flex items-center gap-3 pl-2 ml-1 border-l border-masala-border/60">
                            <LanguageToggle />
                        </div>

                        {/* Mobile menu button */}
                        <button
                            className="md:hidden rounded-lg p-2 text-masala-text hover:text-masala-primary hover:bg-masala-border/50 transition-colors"
                            onClick={() => setMenuOpen(!menuOpen)}
                            aria-label="Open menu"
                        >
                            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                        </button>
                    </div>
                </div>

                {/* Mobile search bar row — only if not home or scrolled */}
                {showMobileSearch && (
                    <div className="md:hidden pb-3 animate-fade-in">
                        <SearchAutocomplete size="header" />
                    </div>
                )}
            </div>

            {/* Mobile Menu */}
            {menuOpen && (
                <div className="md:hidden border-t border-masala-border bg-masala-bg/95 backdrop-blur-xl px-4 py-4 space-y-1 shadow-xl">
                    <MobileNavLink href="/blog" onClick={() => setMenuOpen(false)}>
                        📝 {t('blog')}
                    </MobileNavLink>
                    <div className="border-t border-masala-border pt-3 mt-3 space-y-1">
                        <MobileNavLink href="/account/alerts" onClick={() => setMenuOpen(false)}>
                            🔔 {t('priceAlert')}
                        </MobileNavLink>
                        <MobileNavLink href="/account" onClick={() => setMenuOpen(false)}>
                            👤 {t('account')}
                        </MobileNavLink>
                    </div>
                    {/* Language toggle in mobile menu */}
                    <div className="border-t border-masala-border pt-3 mt-3 flex items-center justify-between px-1">
                        <span className="text-xs font-medium text-masala-text/60 uppercase tracking-wider">Language</span>
                        <LanguageToggle />
                    </div>
                </div>
            )}
        </header>
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

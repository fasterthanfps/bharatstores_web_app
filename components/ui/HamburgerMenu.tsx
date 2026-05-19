'use client';
import { useState } from 'react';
import Link from 'next/link';
import { X, Home, Search, Tag, Bell, User, BookOpen } from 'lucide-react';
import LanguageToggle from '@/components/layout/LanguageToggle';

const NAV_ITEMS = [
  { href: '/',        icon: Home,     label: 'Home' },
  { href: '/search',  icon: Search,   label: 'Search' },
  { href: '/deals',   icon: Tag,      label: 'Deals', badge: 'NEW' },
  { href: '/alerts',  icon: Bell,     label: 'Price Alerts' },
  { href: '/account', icon: User,     label: 'Account' },
  { href: '/blog',    icon: BookOpen, label: 'Blog' },
];

export default function HamburgerMenu() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Hamburger button */}
      <button
        onClick={() => setOpen(true)}
        className="flex flex-col gap-1.5 p-2 rounded-xl hover:bg-masala-muted transition-colors"
        aria-label="Open menu"
      >
        <span className="w-5 h-0.5 bg-masala-text rounded-full" />
        <span className="w-4 h-0.5 bg-masala-text rounded-full" />
        <span className="w-5 h-0.5 bg-masala-text rounded-full" />
      </button>

      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Drawer — slides from LEFT */}
      <div className={`fixed top-0 left-0 h-full w-72 bg-white z-[60] shadow-2xl
        transition-transform duration-300 ease-out flex flex-col ${
        open ? 'translate-x-0' : '-translate-x-full'
      }`}>

        {/* Drawer header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-masala-border">
          <span className="text-lg font-black text-masala-primary" style={{ fontFamily: 'Fraunces, serif' }}>
            BharatStores<span className="text-masala-text-muted text-sm">.eu</span>
          </span>
          <button onClick={() => setOpen(false)}
            className="w-8 h-8 rounded-full border border-masala-border flex items-center justify-center">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Nav links */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV_ITEMS.map(item => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-masala-muted
                text-masala-text font-semibold transition-colors group"
            >
              <item.icon className="w-5 h-5 text-masala-text-muted group-hover:text-masala-primary transition-colors" />
              <span>{item.label}</span>
              {item.badge && (
                <span className="ml-auto px-2 py-0.5 rounded-full bg-masala-primary text-white text-[9px] font-black">
                  {item.badge}
                </span>
              )}
            </Link>
          ))}
        </nav>

        {/* Language toggle at bottom */}
        <div className="px-5 py-4 border-t border-masala-border">
          <p className="text-[10px] font-black uppercase tracking-widest text-masala-text-muted mb-2">Language</p>
          <LanguageToggle size="compact" />
        </div>
      </div>
    </>
  );
}

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, Bell, User } from 'lucide-react';

const NAV_ITEMS = [
  { icon: Home,   label: 'Home',    href: '/' },
  { icon: Search, label: 'Search',  href: '/search' },
  { icon: Bell,   label: 'Alerts',  href: '/account/alerts' },
  { icon: User,   label: 'Account', href: '/account' },
];

export default function MobileNav() {
  const pathname = usePathname();

  return (
    <nav
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-masala-border/60"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex items-stretch h-[60px]">
        {NAV_ITEMS.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== '/' && pathname?.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex-1 flex flex-col items-center justify-center gap-0.5 transition-all active:scale-90 relative ${
                isActive ? 'text-masala-primary' : 'text-masala-text-light hover:text-masala-text-muted'
              }`}
            >
              {/* Active pill background */}
              {isActive && (
                <span className="absolute inset-x-2 top-1.5 bottom-1.5 rounded-xl bg-masala-primary/8 -z-10" />
              )}
              <item.icon
                className={`transition-all duration-200 ${isActive ? 'h-[22px] w-[22px]' : 'h-5 w-5'}`}
                strokeWidth={isActive ? 2.5 : 1.8}
              />
              <span className={`text-[10px] font-${isActive ? 'black' : 'medium'} leading-none tracking-tight`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

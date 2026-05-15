'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, Tag, Bell, User } from 'lucide-react';

const NAV_ITEMS = [
  { icon: Home, label: '🏠 Home', href: '/' },
  { icon: Search, label: '🔍 Search', href: '/search' },
  { icon: Tag, label: '🏷️ Deals', href: '/deals' },
  { icon: Bell, label: '🔔 Alerts', href: '/account/alerts' },
  { icon: User, label: '👤 Account', href: '/account' },
];

export default function MobileNav() {
  const pathname = usePathname();

  return (
    <nav
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-masala-border"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex items-stretch h-[60px]">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/' && pathname?.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex-1 flex flex-col items-center justify-center gap-0.5 text-[10px] font-semibold transition-colors min-h-[44px] relative ${
                isActive ? 'text-masala-primary' : 'text-masala-text-light hover:text-masala-text-muted'
              }`}
            >
              {isActive && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-[2px] rounded-full bg-masala-primary" />
              )}
              <item.icon className="h-5 w-5" />
              <span>{item.label.split(' ').slice(1).join(' ')}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

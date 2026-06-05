'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Sparkles, Bell, Settings } from 'lucide-react';

export default function AccountNav() {
  const pathname = usePathname();

  const navItems = [
    {
      href: '/account',
      label: 'Suggested Products',
      icon: Sparkles,
    },
    {
      href: '/account/alerts',
      label: 'Price Alerts',
      icon: Bell,
    },
    {
      href: '/account/settings',
      label: 'Settings',
      icon: Settings,
    },
  ];

  return (
    <div className="flex items-center gap-2 bg-masala-muted/30 p-1.5 rounded-2xl border border-masala-border/40">
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-2 text-xs md:text-sm font-bold transition-all px-4 py-2 rounded-xl ${
              isActive
                ? 'bg-masala-primary text-white shadow-sm shadow-masala-primary/10'
                : 'text-masala-text-muted hover:text-masala-primary hover:bg-masala-muted/50'
            }`}
          >
            <Icon className="h-3.5 w-3.5 md:h-4 md:w-4 stroke-[2.5]" />
            {item.label}
          </Link>
        );
      })}
    </div>
  );
}

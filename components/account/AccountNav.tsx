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
      mobileLabel: 'For You',
      icon: Sparkles,
    },
    {
      href: '/account/alerts',
      label: 'Price Alerts',
      mobileLabel: 'Alerts',
      icon: Bell,
    },
    {
      href: '/account/settings',
      label: 'Settings',
      mobileLabel: 'Settings',
      icon: Settings,
    },
  ];

  return (
    /* Horizontal scroll on mobile, no-wrap, short labels (FIX 4) */
    <div className="flex items-center gap-2 overflow-x-auto [&::-webkit-scrollbar]:hidden [scrollbar-width:none] -mx-4 px-4 sm:mx-0 sm:px-0 pb-1 sm:pb-0 sm:bg-masala-muted/30 sm:p-1.5 sm:rounded-2xl sm:border sm:border-masala-border/40">
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full sm:rounded-xl text-xs font-bold transition-all whitespace-nowrap border sm:border-0 ${
              isActive
                ? 'bg-masala-primary text-white border-masala-primary shadow-sm'
                : 'bg-white text-masala-text-muted border-masala-border hover:border-masala-primary/40 sm:bg-transparent sm:border-transparent sm:hover:text-masala-primary sm:hover:bg-masala-muted/50'
            }`}
          >
            <Icon className="h-3.5 w-3.5 stroke-[2.5]" />
            <span className="sm:hidden">{item.mobileLabel}</span>
            <span className="hidden sm:inline">{item.label}</span>
          </Link>
        );
      })}
    </div>
  );
}

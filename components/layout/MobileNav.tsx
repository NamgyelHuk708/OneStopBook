'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, CalendarDays, Bell } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

const navItems = [
  { href: '/', icon: Home, label: 'Home' },
  { href: '/dashboard', icon: CalendarDays, label: 'Bookings' },
  { href: '/dashboard?tab=notifications', icon: Bell, label: 'Alerts' },
];

export function MobileNav() {
  const pathname = usePathname();

  // Hide on admin routes
  if (pathname.startsWith('/admin')) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-[#d0ebe0] sm:hidden">
      <div className="flex items-center justify-around h-14">
        {navItems.map(({ href, icon: Icon, label }) => {
          const isActive = href === '/' ? pathname === '/' : pathname.startsWith(href.split('?')[0]);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex flex-col items-center gap-0.5 px-4 py-2 text-[10px] font-medium transition-colors',
                isActive ? 'text-g400' : 'text-g600 hover:text-g400'
              )}
            >
              <Icon size={20} />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

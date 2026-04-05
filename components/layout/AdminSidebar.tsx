'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, CalendarDays, Building2, Bell, Users, Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

const navItems = [
  { href: '/admin', icon: LayoutDashboard, label: 'Dashboard', exact: true },
  { href: '/admin/bookings', icon: CalendarDays, label: 'Bookings' },
  { href: '/admin/services', icon: Building2, label: 'Services' },
  { href: '/admin/alerts', icon: Bell, label: 'Alerts' },
  { href: '/admin/users', icon: Users, label: 'Users' },
];

function NavLinks({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  return (
    <>
      {navItems.map(({ href, icon: Icon, label, exact }) => {
        const isActive = exact ? pathname === href : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-[10px] text-sm font-medium transition-all',
              isActive
                ? 'bg-g400/10 text-g400 border-l-2 border-g400 pl-[calc(0.75rem-2px)]'
                : 'text-g600 hover:bg-g50 hover:text-g800'
            )}
          >
            <Icon size={16} />
            {label}
          </Link>
        );
      })}
    </>
  );
}

export function AdminSidebar() {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <>
      {/* ── Desktop sidebar (lg+) ────────────────────────────────────── */}
      <aside className="hidden lg:flex flex-col w-56 h-screen sticky top-0 bg-white border-r border-[#d0ebe0] py-6 px-3 flex-shrink-0">
        <div className="px-3 mb-8">
          <Link href="/admin" className="flex items-center gap-2">
            <span className="text-xl font-semibold tracking-heading text-g900">
              onestop<span className="text-g400">book</span>
            </span>
            <span className="px-2 py-0.5 text-[10px] font-medium bg-g400/10 text-g400 rounded-tag tracking-label uppercase border border-g400/20">
              admin
            </span>
          </Link>
        </div>
        <nav className="space-y-0.5 flex-1">
          <NavLinks pathname={pathname} />
        </nav>
        <Link
          href="/"
          className="flex items-center gap-2 px-3 py-2 text-xs text-g600 hover:text-g800 transition-colors"
        >
          ← Back to site
        </Link>
      </aside>

      {/* ── Mobile top bar (below lg) ────────────────────────────────── */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-white border-b border-[#d0ebe0] h-14 flex items-center justify-between px-4">
        <Link href="/admin" className="flex items-center gap-2">
          <span className="text-lg font-semibold tracking-heading text-g900">
            onestop<span className="text-g400">book</span>
          </span>
          <span className="px-2 py-0.5 text-[10px] font-medium bg-g400/10 text-g400 rounded-tag tracking-label uppercase border border-g400/20">
            admin
          </span>
        </Link>
        <button
          onClick={() => setDrawerOpen(true)}
          className="p-2 rounded-[10px] text-g600 hover:bg-g50 transition-colors"
          aria-label="Open menu"
        >
          <Menu size={20} />
        </button>
      </div>

      {/* ── Mobile top-bar spacer ─────────────────────────────────────── */}
      <div className="lg:hidden h-14 flex-shrink-0" />

      {/* ── Drawer overlay ───────────────────────────────────────────── */}
      {drawerOpen && (
        <div
          className="lg:hidden fixed inset-0 z-50 flex"
          onClick={() => setDrawerOpen(false)}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-g900/40 backdrop-blur-sm" />

          {/* Drawer panel */}
          <div
            className="relative w-64 bg-white h-full flex flex-col py-6 px-3 shadow-xl"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-3 mb-8">
              <Link href="/admin" className="flex items-center gap-2" onClick={() => setDrawerOpen(false)}>
                <span className="text-xl font-semibold tracking-heading text-g900">
                  onestop<span className="text-g400">book</span>
                </span>
                <span className="px-2 py-0.5 text-[10px] font-medium bg-g400/10 text-g400 rounded-tag tracking-label uppercase border border-g400/20">
                  admin
                </span>
              </Link>
              <button
                onClick={() => setDrawerOpen(false)}
                className="p-1.5 rounded-full text-g600 hover:bg-g50 transition-colors"
                aria-label="Close menu"
              >
                <X size={18} />
              </button>
            </div>

            {/* Nav */}
            <nav className="space-y-0.5 flex-1">
              <NavLinks pathname={pathname} onNavigate={() => setDrawerOpen(false)} />
            </nav>

            {/* Back to site */}
            <Link
              href="/"
              onClick={() => setDrawerOpen(false)}
              className="flex items-center gap-2 px-3 py-2 text-xs text-g600 hover:text-g800 transition-colors"
            >
              ← Back to site
            </Link>
          </div>
        </div>
      )}

      {/* ── Mobile bottom nav bar ─────────────────────────────────────── */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-[#d0ebe0]">
        <div className="flex items-center justify-around h-14">
          {navItems.map(({ href, icon: Icon, label, exact }) => {
            const isActive = exact ? pathname === href : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex flex-col items-center gap-0.5 px-3 py-2 text-[10px] font-medium transition-colors',
                  isActive ? 'text-g400' : 'text-g600'
                )}
              >
                <Icon size={19} />
                {label}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* ── Mobile bottom nav spacer ──────────────────────────────────── */}
      <div className="lg:hidden h-14 flex-shrink-0 fixed bottom-0 left-0 right-0 pointer-events-none" />
    </>
  );
}

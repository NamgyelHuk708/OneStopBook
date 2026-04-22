'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LogOut, LayoutDashboard } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { signOut } from '@/app/login/actions';
import { useAuth } from '@/hooks/useAuth';
import { useTransition } from 'react';

interface NavbarProps {
  backHref?: string;
  showAdminBadge?: boolean;
  overlay?: boolean;
}

export function Navbar({ backHref, showAdminBadge = false, overlay = false }: NavbarProps) {
  const { user, profile, loading } = useAuth();
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const initials = profile?.full_name
    ? profile.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : user?.email?.slice(0, 2).toUpperCase() ?? '?';

  return (
    <nav className={
      overlay
        ? 'absolute top-0 left-0 right-0 z-50'
        : 'sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-[#d0ebe0]'
    }>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        {/* Left: back arrow or logo */}
        <div className="flex items-center gap-3">
          {backHref && (
            <button
              onClick={() => router.back()}
              className={`p-1.5 rounded-full transition-colors mr-1 ${overlay ? 'text-white/80 hover:bg-white/10' : 'text-g600 hover:bg-g100/30'}`}
              aria-label="Go back"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5M12 5l-7 7 7 7" />
              </svg>
            </button>
          )}
          <Link href="/home" className="flex items-center">
            <span className={`text-xl font-semibold tracking-heading ${overlay ? 'text-white' : 'text-g900'}`}>
              onestop<span className="text-g400">book</span>
            </span>
            {showAdminBadge && (
              <span className="ml-2 px-2 py-0.5 text-[10px] font-medium bg-g400/10 text-g400 rounded-tag tracking-label uppercase border border-g400/20">
                admin
              </span>
            )}
          </Link>
        </div>

        {/* Right */}
        <div className="flex items-center gap-2">
          {loading ? (
            <div className={`w-8 h-8 rounded-full animate-pulse ${overlay ? 'bg-white/20' : 'bg-g100/40'}`} />
          ) : user ? (
            <>
              <Link href="/dashboard">
                <Button
                  variant="ghost"
                  size="sm"
                  className={`hidden sm:flex gap-1.5 ${overlay ? 'text-white/90 hover:bg-white/10 hover:text-white' : ''}`}
                >
                  <LayoutDashboard size={15} />
                  My bookings
                </Button>
              </Link>
              <Link
                href="/dashboard"
                className="w-8 h-8 rounded-full bg-g400 text-g50 text-xs font-medium flex items-center justify-center hover:bg-g600 transition-colors"
              >
                {initials}
              </Link>
              <button
                onClick={() => startTransition(() => signOut())}
                disabled={isPending}
                className={`p-1.5 rounded-full transition-colors ${overlay ? 'text-white/80 hover:bg-white/10' : 'text-g600 hover:bg-g100/30'}`}
                title="Sign out"
              >
                <LogOut size={16} />
              </button>
            </>
          ) : (
            <Link href="/login">
              <Button
                variant={overlay ? 'primary' : 'secondary'}
                size="sm"
                className={overlay ? 'bg-white/10 backdrop-blur-sm border border-white/30 text-white hover:bg-white/20' : ''}
              >
                Sign in
              </Button>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}

'use client';

import { useState } from 'react';
import { Search } from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { AlertBar } from '@/components/layout/AlertBar';
import { MobileNav } from '@/components/layout/MobileNav';
import { FacilityGrid } from '@/components/facilities/FacilityGrid';
import { UpcomingBookingsStrip } from '@/components/dashboard/UpcomingBookingsStrip';
import type { Alert, Facility } from '@/lib/types/database';

interface HomepageClientProps {
  facilities: Facility[];
  activeAlert: Alert | null;
}

export function HomepageClient({ facilities, activeAlert }: HomepageClientProps) {
  const [search, setSearch] = useState('');

  const filtered = search.trim()
    ? facilities.filter(f =>
        f.name.toLowerCase().includes(search.toLowerCase()) ||
        f.description?.toLowerCase().includes(search.toLowerCase())
      )
    : facilities;

  return (
    <>
      <AlertBar alert={activeAlert} />

      <main className="pb-20 sm:pb-8">
        {/* Hero */}
        <section
          className="relative px-4 sm:px-6 pt-24 pb-20 sm:pt-32 sm:pb-28 overflow-hidden"
          style={{ backgroundImage: "url('/homepageimage.jpg')", backgroundSize: 'cover', backgroundPosition: 'center' }}
        >
          {/* Dark gradient overlay for readability */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-black/20" />

          <Navbar overlay />

          <div className="relative max-w-6xl mx-auto">
            <h1 className="text-4xl sm:text-5xl font-medium text-white leading-tight tracking-heading mb-4 max-w-xl">
              Book your <span className="text-g400">space</span>,<br />
              play your game.
            </h1>
            <p className="text-white/70 text-base max-w-md mb-8 leading-body">
              Reserve sports courts, indoor arenas, and laundry services — all in one place.
            </p>

            {/* Search */}
            <div className="flex gap-3 max-w-lg">
              <div className="relative flex-1">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-g200" />
                <input
                  type="text"
                  placeholder="Search facilities…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-pill border border-white/20 bg-white/10 backdrop-blur-sm text-white text-sm placeholder:text-white/50 focus:outline-none focus:border-g400 transition-colors"
                />
              </div>
              <button className="px-6 py-3 rounded-pill bg-g400 text-g50 text-sm font-medium hover:bg-g600 transition-colors">
                Search
              </button>
            </div>
          </div>
        </section>

        {/* Facilities */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 mt-10">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-medium text-g800 tracking-heading">
              All facilities
            </h2>
            <span className="text-sm text-g600">{filtered.length} available</span>
          </div>
          <FacilityGrid facilities={filtered} loading={false} />
        </section>

        {/* Upcoming bookings strip (logged-in only) */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 mt-12">
          <UpcomingBookingsStrip />
        </section>
      </main>

      <MobileNav />
    </>
  );
}

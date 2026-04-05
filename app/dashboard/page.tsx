'use client';

import { useState } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { MobileNav } from '@/components/layout/MobileNav';
import { BookingList } from '@/components/dashboard/BookingList';
import { NotificationList } from '@/components/dashboard/NotificationList';
import { CreditList } from '@/components/dashboard/CreditList';
import { ProfileCard } from '@/components/dashboard/ProfileCard';
import { useMyBookings } from '@/hooks/useBookings';
import { cn } from '@/lib/utils/cn';

type Tab = 'upcoming' | 'past' | 'notifications' | 'credits' | 'profile';

const tabs: { id: Tab; label: string }[] = [
  { id: 'upcoming', label: 'Upcoming' },
  { id: 'past', label: 'Past' },
  { id: 'notifications', label: 'Notifications' },
  { id: 'credits', label: 'Credits' },
  { id: 'profile', label: 'Profile' },
];

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<Tab>('upcoming');
  const { bookings, loading, refetch } = useMyBookings();

  const today = new Date().toISOString().split('T')[0];

  const upcomingBookings = bookings.filter(
    b => b.slot && b.slot.date >= today && (b.status === 'confirmed' || b.status === 'delayed')
  );
  const pastBookings = bookings.filter(
    b => !b.slot || b.slot.date < today || b.status === 'cancelled' || b.status === 'completed'
  );

  return (
    <>
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-8 pb-24 sm:pb-8">
        <h1 className="text-2xl font-medium text-g800 tracking-heading mb-6">My account</h1>

        {/* Tab row */}
        <div className="flex gap-1 bg-g50 rounded-input border border-[#d0ebe0] p-1 mb-6 overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex-1 min-w-max px-4 py-2 rounded-[8px] text-sm font-medium transition-all whitespace-nowrap',
                activeTab === tab.id
                  ? 'bg-g400 text-g50'
                  : 'text-g600 hover:text-g800'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {activeTab === 'upcoming' && (
          <BookingList
            bookings={upcomingBookings}
            loading={loading}
            type="upcoming"
            onRefresh={refetch}
          />
        )}
        {activeTab === 'past' && (
          <BookingList
            bookings={pastBookings}
            loading={loading}
            type="past"
            onRefresh={refetch}
          />
        )}
        {activeTab === 'notifications' && <NotificationList />}
        {activeTab === 'credits' && <CreditList />}
        {activeTab === 'profile' && <ProfileCard />}
      </main>
      <MobileNav />
    </>
  );
}

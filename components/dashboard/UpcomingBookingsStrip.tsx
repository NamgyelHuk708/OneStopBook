'use client';

import Link from 'next/link';
import { CalendarDays, Clock } from 'lucide-react';
import { useUpcomingBookings } from '@/hooks/useBookings';
import { useAuth } from '@/hooks/useAuth';
import { Badge } from '@/components/ui/Badge';
import { formatDate, formatTimeRange } from '@/lib/utils/formatters';

export function UpcomingBookingsStrip() {
  const { user } = useAuth();
  const { bookings, loading } = useUpcomingBookings();

  if (!user) return null;

  const next2 = bookings.slice(0, 2);

  if (loading) {
    return (
      <div>
        <div className="h-6 w-48 skeleton mb-4 rounded" />
        <div className="grid sm:grid-cols-2 gap-4">
          {[1, 2].map(i => <div key={i} className="h-24 skeleton rounded-card" />)}
        </div>
      </div>
    );
  }

  if (next2.length === 0) return null;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-medium text-g800 tracking-heading">Upcoming bookings</h2>
        <Link href="/dashboard" className="text-sm text-g400 hover:text-g600 font-medium">
          View all →
        </Link>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {next2.map(booking => (
          <div
            key={booking.id}
            className="bg-white rounded-card border border-[#d0ebe0] p-4 flex items-start justify-between gap-3"
          >
            <div className="min-w-0">
              <p className="font-medium text-g800 text-sm truncate">{booking.facility?.name}</p>
              {booking.slot && (
                <>
                  <div className="flex items-center gap-1.5 mt-1 text-xs text-g600">
                    <CalendarDays size={12} />
                    {formatDate(booking.slot.date)}
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5 text-xs text-g600">
                    <Clock size={12} />
                    {formatTimeRange(booking.slot.start_time, booking.slot.end_time)}
                  </div>
                </>
              )}
            </div>
            <Badge variant={booking.status as 'confirmed' | 'delayed' | 'cancelled' | 'completed'} withDot>
              {booking.status}
            </Badge>
          </div>
        ))}
      </div>
    </div>
  );
}

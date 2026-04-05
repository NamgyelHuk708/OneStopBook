'use client';

import { useState, useTransition } from 'react';
import { CalendarDays, Clock, X } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { BookingCardSkeleton } from '@/components/ui/Skeleton';
import { formatDate, formatTimeRange, formatCurrency } from '@/lib/utils/formatters';
import { cancelBooking } from '@/app/dashboard/actions';
import type { Booking, BookingStatus } from '@/lib/types/database';

interface BookingListProps {
  bookings: Booking[];
  loading: boolean;
  type: 'upcoming' | 'past';
  onRefresh: () => void;
}

function canCancel(booking: Booking): boolean {
  if (!booking.slot) return false;
  const slotStart = new Date(`${booking.slot.date}T${booking.slot.start_time}`);
  const hoursUntil = (slotStart.getTime() - Date.now()) / (1000 * 60 * 60);
  return hoursUntil > 2;
}

export function BookingList({ bookings, loading, type, onRefresh }: BookingListProps) {
  const [isPending, startTransition] = useTransition();
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  function handleCancel(bookingId: string) {
    setCancellingId(bookingId);
    setCancelError(null);
    startTransition(async () => {
      const result = await cancelBooking(bookingId);
      if (result?.error) setCancelError(result.error);
      else onRefresh();
      setCancellingId(null);
    });
  }

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => <BookingCardSkeleton key={i} />)}
      </div>
    );
  }

  if (bookings.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-g800 font-medium mb-1">No bookings found</p>
        <p className="text-sm text-g600">
          {type === 'upcoming' ? 'You have no upcoming bookings.' : 'No past bookings yet.'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {cancelError && (
        <div className="px-4 py-3 rounded-input bg-danger-bg border border-danger text-danger text-sm">
          {cancelError}
        </div>
      )}
      {bookings.map(booking => (
        <div
          key={booking.id}
          className="bg-white rounded-card border border-[#d0ebe0] p-5"
        >
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="min-w-0">
              <p className="font-medium text-g800 truncate">{booking.facility?.name}</p>
              <p className="text-xs text-g600 mt-0.5 font-mono">{booking.booking_ref}</p>
            </div>
            <Badge
              variant={booking.status as BookingStatus}
              withDot
              className="flex-shrink-0"
            >
              {booking.status}
            </Badge>
          </div>

          {booking.slot && (
            <div className="flex flex-wrap gap-3 text-xs text-g600 mb-4">
              <span className="flex items-center gap-1.5">
                <CalendarDays size={12} />
                {formatDate(booking.slot.date)}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock size={12} />
                {formatTimeRange(booking.slot.start_time, booking.slot.end_time)}
              </span>
              <span className="text-g400 font-medium">{formatCurrency(booking.total_amount)}</span>
            </div>
          )}

          {type === 'upcoming' && booking.status === 'confirmed' && canCancel(booking) && (
            <Button
              variant="danger"
              size="sm"
              onClick={() => handleCancel(booking.id)}
              disabled={isPending && cancellingId === booking.id}
            >
              <X size={13} />
              {isPending && cancellingId === booking.id ? 'Cancelling…' : 'Cancel booking'}
            </Button>
          )}
        </div>
      ))}
    </div>
  );
}

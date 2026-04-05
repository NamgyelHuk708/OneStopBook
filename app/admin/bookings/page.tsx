'use client';

import { useState, useEffect, useTransition } from 'react';
import { BookingsTable } from '@/components/admin/BookingsTable';
import { getAllBookings, updateBookingStatus } from './actions';
import type { Booking, BookingStatus } from '@/lib/types/database';

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterDate, setFilterDate] = useState('');   // empty = no date filter
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setLoading(true);
    setFetchError(null);
    getAllBookings(
      filterStatus === 'all' ? undefined : filterStatus,
      filterDate || undefined
    ).then(({ bookings, error }) => {
      if (error) setFetchError(error);
      setBookings(bookings);
      setLoading(false);
    });
  }, [filterStatus, filterDate]);

  function handleStatusChange(bookingId: string, status: BookingStatus) {
    startTransition(async () => {
      const { error } = await updateBookingStatus(bookingId, status);
      if (!error) {
        setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status } : b));
      }
    });
  }

  const hasFilters = filterDate !== '' || filterStatus !== 'all';

  return (
    <div className="p-6 sm:p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-medium text-g800 tracking-heading">All bookings</h1>
        {!loading && (
          <span className="text-sm text-g600">{bookings.length} booking{bookings.length !== 1 ? 's' : ''}</span>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <input
          type="date"
          value={filterDate}
          onChange={e => setFilterDate(e.target.value)}
          className="px-4 py-2 rounded-input border border-[#c0ddd0] bg-white text-g800 text-sm focus:outline-none focus:border-g400"
        />
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className="px-4 py-2 rounded-input border border-[#c0ddd0] bg-white text-g800 text-sm focus:outline-none focus:border-g400"
        >
          <option value="all">All statuses</option>
          <option value="confirmed">Confirmed</option>
          <option value="cancelled">Cancelled</option>
          <option value="delayed">Delayed</option>
          <option value="completed">Completed</option>
        </select>
        {hasFilters && (
          <button
            onClick={() => { setFilterDate(''); setFilterStatus('all'); }}
            className="px-4 py-2 rounded-input border border-[#d0ebe0] text-sm text-g600 hover:border-g400 transition-colors"
          >
            Clear filters
          </button>
        )}
      </div>

      {fetchError && (
        <div className="mb-4 px-4 py-3 rounded-input bg-danger-bg border border-danger text-danger text-sm">
          Error loading bookings: {fetchError}
        </div>
      )}

      <BookingsTable
        bookings={bookings}
        loading={loading || isPending}
        onStatusChange={handleStatusChange}
      />
    </div>
  );
}

'use client';

import { Badge } from '@/components/ui/Badge';
import { TableRowSkeleton } from '@/components/ui/Skeleton';
import { formatDate, formatTimeRange, formatCurrency } from '@/lib/utils/formatters';
import type { Booking, BookingStatus } from '@/lib/types/database';

interface BookingsTableProps {
  bookings: Booking[];
  loading?: boolean;
  onStatusChange?: (bookingId: string, status: BookingStatus) => void;
  showFilters?: boolean;
}

export function BookingsTable({ bookings, loading, onStatusChange }: BookingsTableProps) {
  return (
    <div className="bg-white rounded-card border border-[#d0ebe0] overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#d0ebe0] bg-g50">
              <th className="px-4 py-3 text-left text-xs font-medium text-g600 uppercase tracking-label">Ref</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-g600 uppercase tracking-label">User</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-g600 uppercase tracking-label">Facility</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-g600 uppercase tracking-label">Date & Time</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-g600 uppercase tracking-label">Amount</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-g600 uppercase tracking-label">Status</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-g600 uppercase tracking-label">Payment</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#d0ebe0]">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => <TableRowSkeleton key={i} cols={7} />)
            ) : bookings.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-g600 text-sm">
                  No bookings found.
                </td>
              </tr>
            ) : (
              bookings.map(booking => (
                <tr key={booking.id} className="hover:bg-g50 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-g600">{booking.booking_ref}</td>
                  <td className="px-4 py-3 text-g800">
                    {booking.profile?.full_name ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-g800">{booking.facility?.name}</td>
                  <td className="px-4 py-3 text-g600 text-xs">
                    {booking.slot ? (
                      <>
                        <div>{formatDate(booking.slot.date)}</div>
                        <div>{formatTimeRange(booking.slot.start_time, booking.slot.end_time)}</div>
                      </>
                    ) : '—'}
                  </td>
                  <td className="px-4 py-3 text-g800">{formatCurrency(booking.total_amount)}</td>
                  <td className="px-4 py-3">
                    {onStatusChange ? (
                      <select
                        value={booking.status}
                        onChange={e => onStatusChange(booking.id, e.target.value as BookingStatus)}
                        className="text-xs rounded-[8px] border border-[#c0ddd0] bg-g50 px-2 py-1 text-g800 focus:outline-none focus:border-g400"
                      >
                        <option value="confirmed">confirmed</option>
                        <option value="cancelled">cancelled</option>
                        <option value="delayed">delayed</option>
                        <option value="completed">completed</option>
                      </select>
                    ) : (
                      <Badge variant={booking.status as BookingStatus} withDot>{booking.status}</Badge>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={booking.payment_status === 'paid' ? 'confirmed' : 'delayed'}>
                      {booking.payment_status}
                    </Badge>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

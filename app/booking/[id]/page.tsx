import { createClient } from '@/lib/supabase/server';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle2, Bell, CalendarDays, Clock, Home } from 'lucide-react';
import type { Booking, Notification } from '@/lib/types/database';
import { formatDate, formatTimeRange, formatCurrency } from '@/lib/utils/formatters';
import { format, parseISO } from 'date-fns';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function BookingConfirmationPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: booking } = await supabase
    .from('bookings')
    .select('*, facility:facilities(*), slot:time_slots(*)')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (!booking) notFound();

  const b = booking as Booking;

  const { data: notifications } = await supabase
    .from('notifications')
    .select('*')
    .eq('booking_id', id)
    .order('scheduled_for');

  const notifs = (notifications ?? []) as Notification[];

  return (
    <div className="min-h-screen bg-g50 px-4 py-12">
      <div className="max-w-md mx-auto">
        {/* Success icon */}
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-full bg-success-bg border border-g400/30 flex items-center justify-center">
            <CheckCircle2 size={32} className="text-g400" />
          </div>
        </div>

        <h1 className="text-2xl font-medium text-g800 tracking-heading text-center mb-2">
          Booking confirmed!
        </h1>
        <p className="text-center text-sm text-g600 mb-8">
          Your booking has been confirmed and payment received.
        </p>

        {/* Booking summary card */}
        <div className="bg-white rounded-card border border-[#d0ebe0] p-5 mb-5">
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-g600">Facility</span>
              <span className="text-g800 font-medium">{b.facility?.name}</span>
            </div>
            {b.slot && (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-g600 flex items-center gap-1.5"><CalendarDays size={13} /> Date</span>
                  <span className="text-g800">{formatDate(b.slot.date)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-g600 flex items-center gap-1.5"><Clock size={13} /> Time</span>
                  <span className="text-g800">{formatTimeRange(b.slot.start_time, b.slot.end_time)}</span>
                </div>
              </>
            )}
            <div className="border-t border-[#d0ebe0] pt-3 flex justify-between">
              <span className="font-medium text-g800">Amount paid</span>
              <span className="font-semibold text-g400">{formatCurrency(b.total_amount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-g600">Booking ref</span>
              <span className="font-mono text-xs bg-g50 px-2 py-0.5 rounded border border-[#d0ebe0] text-g800">
                {b.booking_ref}
              </span>
            </div>
          </div>
        </div>

        {/* Upcoming reminders */}
        {notifs.length > 0 && (
          <div className="bg-white rounded-card border border-[#d0ebe0] p-5 mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Bell size={14} className="text-g400" />
              <p className="text-sm font-medium text-g800">You&apos;ll be notified</p>
            </div>
            <div className="space-y-2">
              {notifs.map(n => (
                <div key={n.id} className="flex items-start gap-3 text-xs text-g600">
                  <span className="w-1.5 h-1.5 rounded-full bg-g400 flex-shrink-0 mt-1.5" />
                  <span>
                    <span className="font-medium text-g800">{n.title}</span>
                    {n.scheduled_for && (
                      <span> — {format(parseISO(n.scheduled_for), 'dd MMM, HH:mm')}</span>
                    )}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <Link
          href="/home"
          className="flex items-center justify-center gap-2 w-full py-3 rounded-pill bg-g400 text-g50 text-sm font-medium hover:bg-g600 transition-colors"
        >
          <Home size={16} />
          Back to home
        </Link>

        <Link
          href="/dashboard"
          className="flex items-center justify-center gap-2 w-full py-3 rounded-pill bg-g50 text-g800 text-sm font-medium border border-[#d0ebe0] hover:border-g400 transition-colors mt-3"
        >
          View my bookings
        </Link>
      </div>
    </div>
  );
}

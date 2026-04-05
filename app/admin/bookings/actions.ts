'use server';

import { createClient } from '@supabase/supabase-js';
import type { Database, Booking, BookingStatus } from '@/lib/types/database';

function getServiceClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function getAllBookings(filterStatus?: string, filterDate?: string) {
  const supabase = getServiceClient();

  // Step 1: fetch bookings with facility + slot (no profile join — no direct FK)
  let query = supabase
    .from('bookings')
    .select(`
      *,
      facility:facilities(name),
      slot:time_slots(date, start_time, end_time)
    `)
    .order('created_at', { ascending: false });

  if (filterStatus && filterStatus !== 'all') {
    query = query.eq('status', filterStatus as BookingStatus);
  }

  const { data, error } = await query;

  if (error) {
    console.error('getAllBookings error:', error.message);
    return { bookings: [], error: error.message };
  }

  let bookings = (data as Booking[]) ?? [];

  // Filter by date after fetch
  if (filterDate) {
    bookings = bookings.filter(b => b.slot?.date === filterDate);
  }

  if (bookings.length === 0) return { bookings: [], error: null };

  // Step 2: fetch profiles for all unique user_ids
  const userIds = Array.from(new Set(bookings.map(b => b.user_id)));
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name, avatar_url, phone, is_admin, created_at')
    .in('id', userIds);

  // Step 3: merge profile into each booking
  const profileMap = new Map((profiles ?? []).map(p => [p.id, p]));
  bookings = bookings.map(b => ({
    ...b,
    profile: profileMap.get(b.user_id) ?? undefined,
  }));

  return { bookings, error: null };
}

export async function updateBookingStatus(bookingId: string, status: BookingStatus) {
  const supabase = getServiceClient();
  const { error } = await supabase
    .from('bookings')
    .update({ status })
    .eq('id', bookingId);
  return { error: error?.message ?? null };
}

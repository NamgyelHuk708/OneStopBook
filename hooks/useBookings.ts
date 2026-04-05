'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Booking } from '@/lib/types/database';

export function useMyBookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const { data } = await supabase
      .from('bookings')
      .select('*, facility:facilities(*), slot:time_slots(*)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    setBookings((data as Booking[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  return { bookings, loading, refetch: fetch };
}

export function useUpcomingBookings() {
  const { bookings, loading } = useMyBookings();
  const today = new Date().toISOString().split('T')[0];

  const upcoming = bookings.filter(
    b => b.status === 'confirmed' && b.slot && b.slot.date >= today
  );

  return { bookings: upcoming, loading };
}

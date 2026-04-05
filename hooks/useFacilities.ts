'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Facility, FacilityCategory } from '@/lib/types/database';

export function useFacilities(category?: FacilityCategory | 'all') {
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    let query = supabase.from('facilities').select('*').order('created_at');
    if (category && category !== 'all') {
      query = query.eq('category', category);
    }
    const { data, error } = await query;
    if (error) setError(error.message);
    else setFacilities(data ?? []);
    setLoading(false);
  }, [category]);

  useEffect(() => { fetch(); }, [fetch]);

  return { facilities, loading, error, refetch: fetch };
}

export function useFacility(id: string) {
  const [facility, setFacility] = useState<Facility | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from('facilities')
      .select('*')
      .eq('id', id)
      .single()
      .then(({ data }) => {
        setFacility(data);
        setLoading(false);
      });
  }, [id]);

  // Realtime status updates
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`facility-${id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'facilities', filter: `id=eq.${id}` },
        (payload) => setFacility(payload.new as Facility)
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [id]);

  return { facility, loading };
}

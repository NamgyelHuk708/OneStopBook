'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Credit } from '@/lib/types/database';

export function useCredits() {
  const [credits, setCredits] = useState<Credit[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const { data } = await supabase
      .from('credits')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    setCredits((data as Credit[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const totalAvailable = credits
    .filter(c => !c.is_used)
    .reduce((sum, c) => sum + c.amount, 0);

  return { credits, loading, totalAvailable, refetch: fetch };
}

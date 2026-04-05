import { createClient } from '@/lib/supabase/server';
import { HomepageClient } from '@/components/HomepageClient';
import type { Alert, Facility } from '@/lib/types/database';

export const revalidate = 60;

export default async function HomePage() {
  const supabase = await createClient();

  const [facilitiesRes, alertRes] = await Promise.all([
    supabase.from('facilities').select('*').order('created_at'),
    supabase
      .from('alerts')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const facilities = (facilitiesRes.data ?? []) as Facility[];
  const activeAlert = (alertRes.data as Alert | null);

  return <HomepageClient facilities={facilities} activeAlert={activeAlert} />;
}

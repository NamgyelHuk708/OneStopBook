import { createClient } from '@/lib/supabase/server';
import { AlertsPageClient } from '@/components/admin/AlertsPageClient';
import type { Alert, Facility } from '@/lib/types/database';

export const revalidate = 0;

export default async function AdminAlertsPage() {
  const supabase = await createClient();

  const [alertsRes, facilitiesRes] = await Promise.all([
    supabase
      .from('alerts')
      .select('*, facility:facilities(name)')
      .eq('is_active', true)
      .order('created_at', { ascending: false }),
    supabase.from('facilities').select('*').order('name'),
  ]);

  const alerts = (alertsRes.data ?? []) as (Alert & { facility: { name: string } | null })[];
  const facilities = (facilitiesRes.data ?? []) as Facility[];

  return <AlertsPageClient alerts={alerts} facilities={facilities} />;
}

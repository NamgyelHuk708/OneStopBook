import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { FacilityDetailClient } from '@/components/facilities/FacilityDetailClient';
import type { Facility, Review, TimeSlot } from '@/lib/types/database';

interface Props {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ step?: string; slotId?: string }>;
}

export default async function FacilityDetailPage({ params, searchParams }: Props) {
  const { id } = await params;
  const { step, slotId } = await searchParams;
  const supabase = await createClient();

  const [facilityRes, reviewsRes, slotsRes] = await Promise.all([
    supabase.from('facilities').select('*').eq('id', id).single(),
    supabase
      .from('reviews')
      .select('*, profile:profiles(full_name, avatar_url)')
      .eq('facility_id', id)
      .order('created_at', { ascending: false }),
    supabase
      .from('time_slots')
      .select('*')
      .eq('facility_id', id)
      .gte('date', new Date().toISOString().split('T')[0])
      .order('date')
      .order('start_time'),
  ]);

  if (!facilityRes.data) notFound();

  // If payment step, also fetch the specific slot
  let paymentSlot: TimeSlot | null = null;
  if (step === 'payment' && slotId) {
    const { data } = await supabase
      .from('time_slots')
      .select('*')
      .eq('id', slotId)
      .single();
    paymentSlot = data as TimeSlot | null;
  }

  return (
    <FacilityDetailClient
      facility={facilityRes.data as Facility}
      reviews={(reviewsRes.data ?? []) as (Review & { profile: { full_name: string | null; avatar_url: string | null } | null })[]}
      slots={(slotsRes.data ?? []) as TimeSlot[]}
      initialStep={step === 'payment' ? 'payment' : 'detail'}
      initialSlotId={slotId}
      paymentSlot={paymentSlot}
    />
  );
}

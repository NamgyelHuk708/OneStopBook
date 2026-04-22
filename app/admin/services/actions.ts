'use server';

import { createServiceClient } from '@/lib/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { generateTimeSlots } from '@/lib/utils/generate-slots';
import type { Database, FacilityCategory, FacilityStatus } from '@/lib/types/database';

interface FacilityInput {
  id?: string;
  name: string;
  description: string;
  category: FacilityCategory;
  surface_type: string;
  capacity: number | null;
  price_per_hour: number;
  slot_duration_hours: number;
  status: FacilityStatus;
  rules: string[];
  images: string[];
}

export async function upsertFacility(input: FacilityInput) {
  const supabase = await createServiceClient();
  const isEdit = !!input.id;

  const payload = {
    name: input.name,
    description: input.description || null,
    category: input.category,
    surface_type: input.surface_type || null,
    capacity: input.capacity,
    price_per_hour: input.price_per_hour,
    slot_duration_hours: input.slot_duration_hours,
    status: input.status,
    rules: input.rules,
    images: input.images,
  };

  if (isEdit) {
    const { error } = await supabase.from('facilities').update(payload).eq('id', input.id!);
    if (error) return { error: error.message };
  } else {
    const { data: facility, error: insertError } = await supabase
      .from('facilities')
      .insert(payload)
      .select('id')
      .single();

    if (insertError || !facility) return { error: insertError?.message ?? 'Failed to create facility' };

    const timeSlots = generateTimeSlots(facility.id);
    const { error: slotsError } = await supabase.from('time_slots').insert(timeSlots);
    if (slotsError) return { error: `Facility created, but slots generation failed: ${slotsError.message}` };
  }

  revalidatePath('/admin/services');
  revalidatePath('/');
  redirect(`/admin/services?toast=${isEdit ? 'updated' : 'added'}`);
}

export async function regenerateAllSlots() {
  const supabase = await createServiceClient();

  const { data: facilities, error } = await supabase
    .from('facilities')
    .select('id');

  if (error || !facilities) return { error: error?.message ?? 'Failed to fetch facilities' };

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split('T')[0];

  let totalCreated = 0;

  for (const facility of facilities) {
    // Check if facility already has future slots
    const { data: existing } = await supabase
      .from('time_slots')
      .select('id')
      .eq('facility_id', facility.id)
      .gte('date', todayStr)
      .limit(1);

    if (existing && existing.length > 0) continue;

    // No future slots — generate 14 days from today
    const slots = generateTimeSlots(facility.id, today);
    const { error: insertError } = await supabase.from('time_slots').insert(slots);
    if (!insertError) totalCreated += slots.length;
  }

  revalidatePath('/admin/services');
  revalidatePath('/');
  return { success: true, totalCreated };
}

export async function deleteFacility(id: string) {
  const supabase = await createServiceClient();

  // Find all bookings for this facility to clean up dependents first
  const { data: bookings } = await supabase
    .from('bookings')
    .select('id')
    .eq('facility_id', id);

  const bookingIds = bookings?.map(b => b.id) ?? [];

  if (bookingIds.length > 0) {
    await supabase.from('notifications').delete().in('booking_id', bookingIds);
    await supabase.from('credits').delete().in('booking_id', bookingIds);
    await supabase.from('reviews').delete().in('booking_id', bookingIds);
    await supabase.from('bookings').delete().in('id', bookingIds);
  }

  // Delete reviews, alerts linked directly to the facility
  await supabase.from('reviews').delete().eq('facility_id', id);
  await supabase.from('alerts').delete().eq('facility_id', id);

  // Delete the facility — time_slots cascade automatically
  const { error } = await supabase.from('facilities').delete().eq('id', id);
  if (error) return { error: error.message };

  revalidatePath('/admin/services');
  revalidatePath('/');
}

// Use a direct service-role client (no cookies needed) for storage uploads
export async function uploadFacilityImage(formData: FormData): Promise<{ url?: string; error?: string }> {
  const supabase = createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const file = formData.get('file') as File;
  if (!file) return { error: 'No file provided' };

  const ext = file.name.split('.').pop();
  const path = `facilities/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const { error } = await supabase.storage
    .from('facility-images')
    .upload(path, buffer, {
      contentType: file.type,
      upsert: true,
    });

  if (error) return { error: error.message };

  const { data: { publicUrl } } = supabase.storage
    .from('facility-images')
    .getPublicUrl(path);

  return { url: publicUrl };
}

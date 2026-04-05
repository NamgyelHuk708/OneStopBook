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

  if (input.id) {
    const { error } = await supabase.from('facilities').update(payload).eq('id', input.id);
    if (error) return { error: error.message };
  } else {
    // Insert new facility
    const { data: facility, error: insertError } = await supabase
      .from('facilities')
      .insert(payload)
      .select('id')
      .single();
    
    if (insertError || !facility) return { error: insertError?.message ?? 'Failed to create facility' };

    // Auto-generate time slots for new facility using utility function
    const timeSlots = generateTimeSlots(facility.id);

    const { error: slotsError } = await supabase
      .from('time_slots')
      .insert(timeSlots);

    if (slotsError) return { error: `Facility created, but slots generation failed: ${slotsError.message}` };
  }

  revalidatePath('/admin/services');
  revalidatePath('/');
  redirect('/admin/services');
}

export async function deleteFacility(id: string) {
  const supabase = await createServiceClient();
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

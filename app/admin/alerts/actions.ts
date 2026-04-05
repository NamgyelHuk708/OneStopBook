'use server';

import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type { AlertType, FacilityStatus, BookingStatus } from '@/lib/types/database';

interface PostAlertInput {
  facilityId: string;
  alertType: AlertType;
  title: string;
  message: string;
}

export async function postAlert(input: PostAlertInput) {
  const supabase = await createClient();
  const serviceSupabase = await createServiceClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  // 1. Insert alert record
  const { error: alertError } = await serviceSupabase
    .from('alerts')
    .insert({
      facility_id: input.facilityId,
      title: input.title,
      message: input.message,
      alert_type: input.alertType,
      is_active: true,
      created_by: user.id,
    })
    .select()
    .single();

  if (alertError) return { error: alertError.message };

  // 2. Determine new facility status
  const newFacilityStatus: FacilityStatus =
    input.alertType === 'emergency' || input.alertType === 'maintenance'
      ? 'closed'
      : 'delayed';

  // 3. Update facility status
  await serviceSupabase
    .from('facilities')
    .update({ status: newFacilityStatus })
    .eq('id', input.facilityId);

  // 4. Cascade: find all affected confirmed bookings
  const today = new Date().toISOString().split('T')[0];
  const { data: affectedBookings } = await serviceSupabase
    .from('bookings')
    .select('id, user_id, booking_ref, slot:time_slots(date)')
    .eq('facility_id', input.facilityId)
    .eq('status', 'confirmed')
    .gte('slot.date', today);

  if (affectedBookings && affectedBookings.length > 0) {
    const newBookingStatus: BookingStatus =
      newFacilityStatus === 'closed' ? 'cancelled' : 'delayed';

    const bookingIds = affectedBookings.map(b => b.id);

    // 5. Update all affected bookings
    await serviceSupabase
      .from('bookings')
      .update({ status: newBookingStatus })
      .in('id', bookingIds);

    // 6. If full closure, also mark slots as unavailable
    if (newFacilityStatus === 'closed') {
      await serviceSupabase
        .from('time_slots')
        .update({ is_available: false })
        .eq('facility_id', input.facilityId)
        .gte('date', today);
    }

    // 7. Insert disruption notifications for each affected user
    const notifications = affectedBookings.map(b => ({
      user_id: b.user_id as string,
      booking_id: b.id as string,
      title: `Facility alert: ${input.title}`,
      message: `Your booking has been ${newBookingStatus} due to: ${input.message}`,
      type: 'disruption' as const,
      is_read: false,
      scheduled_for: new Date().toISOString(),
    }));

    await serviceSupabase.from('notifications').insert(notifications);
  }

  revalidatePath('/admin');
  revalidatePath('/admin/alerts');
  revalidatePath('/');
  return { success: true, affectedCount: affectedBookings?.length ?? 0 };
}

export async function deactivateAlert(alertId: string, facilityId: string) {
  const serviceSupabase = await createServiceClient();

  await serviceSupabase
    .from('alerts')
    .update({ is_active: false })
    .eq('id', alertId);

  // Check if any other active alerts remain for this facility
  const { data: remainingAlerts } = await serviceSupabase
    .from('alerts')
    .select('id')
    .eq('facility_id', facilityId)
    .eq('is_active', true);

  if (!remainingAlerts || remainingAlerts.length === 0) {
    await serviceSupabase
      .from('facilities')
      .update({ status: 'open' })
      .eq('id', facilityId);
  }

  revalidatePath('/admin/alerts');
  revalidatePath('/');
  return { success: true };
}

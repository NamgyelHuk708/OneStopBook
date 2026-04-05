'use server';

import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function updateProfile(data: {
  full_name: string;
  phone: string;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  const full_name = data.full_name.trim();
  if (!full_name) return { error: 'Full name is required' };

  const serviceSupabase = await createServiceClient();
  const { error } = await serviceSupabase
    .from('profiles')
    .update({ full_name, phone: data.phone.trim() || null })
    .eq('id', user.id);

  if (error) return { error: error.message };

  revalidatePath('/dashboard');
  return { success: true };
}

export async function cancelBooking(bookingId: string) {
  const supabase = await createClient();
  const serviceSupabase = await createServiceClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  // Verify ownership and get booking details
  const { data: booking } = await supabase
    .from('bookings')
    .select('*, slot:time_slots(*)')
    .eq('id', bookingId)
    .eq('user_id', user.id)
    .single();

  if (!booking) return { error: 'Booking not found' };
  if (booking.status !== 'confirmed') return { error: 'Only confirmed bookings can be cancelled' };

  // Check 2-hour rule
  const slotStart = new Date(`${booking.slot.date}T${booking.slot.start_time}`);
  const now = new Date();
  const hoursUntil = (slotStart.getTime() - now.getTime()) / (1000 * 60 * 60);
  if (hoursUntil < 2) {
    return { error: 'Cannot cancel within 2 hours of the booking time' };
  }

  // Cancel booking
  await serviceSupabase
    .from('bookings')
    .update({ status: 'cancelled' })
    .eq('id', bookingId);

  // Re-mark slot as available
  await serviceSupabase
    .from('time_slots')
    .update({ is_available: true })
    .eq('id', booking.slot_id);

  // Issue credit
  await serviceSupabase.from('credits').insert({
    user_id: user.id,
    amount: booking.total_amount,
    reason: `Cancellation credit for booking ${booking.booking_ref}`,
    booking_id: bookingId,
    is_used: false,
  });

  // Insert credit notification
  await serviceSupabase.from('notifications').insert({
    user_id: user.id,
    booking_id: bookingId,
    title: 'Booking cancelled',
    message: `Your booking has been cancelled. ${booking.total_amount} Nu has been credited to your account.`,
    type: 'credit',
    is_read: false,
    scheduled_for: new Date().toISOString(),
  });

  revalidatePath('/dashboard');
  return { success: true };
}

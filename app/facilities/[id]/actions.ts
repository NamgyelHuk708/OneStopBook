'use server';

import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/server';
import { generateBookingRef } from '@/lib/utils/booking-ref';
import { redirect } from 'next/navigation';

interface CreateBookingInput {
  facilityId: string;
  slotId: string;
  totalAmount: number;
  paymentMethod: string;
  useCredit: boolean;
  creditAmount: number;
}

export async function createBooking(input: CreateBookingInput) {
  const supabase = await createClient();
  const serviceSupabase = await createServiceClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'You must be signed in to book.' };

  // Check facility is open before allowing booking
  const { data: facility } = await serviceSupabase
    .from('facilities')
    .select('status')
    .eq('id', input.facilityId)
    .single();

  if (!facility) return { error: 'Facility not found.' };
  if (facility.status === 'delayed') return { error: 'This facility is currently under maintenance and not accepting bookings.' };
  if (facility.status === 'closed') return { error: 'This facility is closed and not accepting bookings.' };

  // Fetch slot details (needed for notifications later)
  const { data: slot } = await serviceSupabase
    .from('time_slots')
    .select('*')
    .eq('id', input.slotId)
    .single();

  if (!slot) {
    return { error: 'Slot not found.' };
  }

  // Atomically claim the slot — returns false if another user just took it
  const { data: reserved, error: reserveError } = await serviceSupabase
    .rpc('reserve_slot', { p_slot_id: input.slotId });

  if (reserveError || !reserved) {
    return { error: 'This slot was just booked by someone else. Please select another time.' };
  }

  const bookingRef = generateBookingRef();

  // 2. Calculate final amount after credits
  const finalAmount = Math.max(0, input.totalAmount - (input.useCredit ? input.creditAmount : 0));

  // 3. Create booking
  const { data: booking, error: bookingError } = await serviceSupabase
    .from('bookings')
    .insert({
      user_id: user.id,
      facility_id: input.facilityId,
      slot_id: input.slotId,
      status: 'confirmed',
      total_amount: finalAmount,
      payment_status: 'paid',
      payment_method: input.paymentMethod,
      booking_ref: bookingRef,
    })
    .select()
    .single();

  if (bookingError || !booking) {
    // Rollback: release the slot so another user can book it
    await serviceSupabase
      .from('time_slots')
      .update({ is_available: true })
      .eq('id', input.slotId);
    return { error: 'Failed to create booking. Please try again.' };
  }

  // 4. Mark credit as used if applicable
  if (input.useCredit && input.creditAmount > 0) {
    const { data: credits } = await serviceSupabase
      .from('credits')
      .select('id, amount')
      .eq('user_id', user.id)
      .eq('is_used', false)
      .order('created_at');

    let remaining = input.creditAmount;
    for (const credit of credits ?? []) {
      if (remaining <= 0) break;
      await serviceSupabase
        .from('credits')
        .update({ is_used: true })
        .eq('id', credit.id);
      remaining -= credit.amount;
    }
  }

  // 5. Insert 3 notifications
  const slotDateTime = new Date(`${slot.date}T${slot.start_time}`);
  const dayBefore = new Date(slotDateTime.getTime() - 24 * 60 * 60 * 1000);
  const fiveHoursBefore = new Date(slotDateTime.getTime() - 5 * 60 * 60 * 1000);

  await serviceSupabase.from('notifications').insert([
    {
      user_id: user.id,
      booking_id: booking.id,
      title: 'Booking confirmed!',
      message: `Your booking (${bookingRef}) has been confirmed.`,
      type: 'confirmation',
      is_read: false,
      scheduled_for: new Date().toISOString(),
    },
    {
      user_id: user.id,
      booking_id: booking.id,
      title: 'Reminder: booking tomorrow',
      message: `Don't forget your booking tomorrow at ${slot.start_time.slice(0, 5)}.`,
      type: 'reminder_day',
      is_read: false,
      scheduled_for: dayBefore.toISOString(),
    },
    {
      user_id: user.id,
      booking_id: booking.id,
      title: 'Reminder: booking in 5 hours',
      message: `Your booking starts in 5 hours at ${slot.start_time.slice(0, 5)}.`,
      type: 'reminder_5hr',
      is_read: false,
      scheduled_for: fiveHoursBefore.toISOString(),
    },
  ]);

  redirect(`/booking/${booking.id}`);
}

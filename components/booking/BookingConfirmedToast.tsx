'use client';

import { useEffect } from 'react';
import { toast } from 'sonner';

export function BookingConfirmedToast({ bookingRef }: { bookingRef: string }) {
  useEffect(() => {
    toast.success(`Booking confirmed! Ref: ${bookingRef}`, {
      duration: 5000,
    });
  }, []);

  return null;
}

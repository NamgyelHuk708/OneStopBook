import { format } from 'date-fns';

/**
 * Generates a unique booking reference: FR-YYYYMMDD-XXX
 * e.g. FR-20260405-A7K
 */
export function generateBookingRef(): string {
  const datePart = format(new Date(), 'yyyyMMdd');
  const randomPart = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `FR-${datePart}-${randomPart}`;
}

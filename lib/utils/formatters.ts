import { format, parseISO } from 'date-fns';

export function formatCurrency(amount: number): string {
  return `Nu ${amount.toLocaleString('en-IN', { minimumFractionDigits: 0 })}`;
}

export function formatDate(dateStr: string): string {
  return format(parseISO(dateStr), 'EEE, dd MMM yyyy');
}

export function formatTime(timeStr: string): string {
  // timeStr is "HH:MM:SS" — strip seconds
  const [h, m] = timeStr.split(':');
  const hour = parseInt(h, 10);
  const suffix = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 === 0 ? 12 : hour % 12;
  return `${displayHour}:${m} ${suffix}`;
}

export function formatTimeRange(start: string, end: string): string {
  return `${formatTime(start)} – ${formatTime(end)}`;
}

export function formatDateShort(dateStr: string): string {
  return format(parseISO(dateStr), 'dd MMM');
}

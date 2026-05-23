'use server';

import { createClient as createServiceClient } from '@supabase/supabase-js';
import type { Database, BookingStatus } from '@/lib/types/database';
import {
  formatShortDate,
  formatTimeRange,
  getDayName,
  getPeakTimeBlock,
  mode,
} from '@/lib/utils/csv-export';

// Raw joined shapes returned by Supabase selects in this file
interface RawBooking {
  id: string;
  user_id: string;
  status: BookingStatus;
  total_amount: number;
  payment_status: string;
  payment_method: string | null;
  booking_ref: string;
  created_at: string;
  facility: { id: string; name: string } | null;
  slot: { date: string; start_time: string; end_time: string } | null;
}

interface RawUsageBooking {
  status: BookingStatus;
  facility: { id: string; name: string; slot_duration_hours: number } | null;
  slot: { date: string; start_time: string; end_time: string } | null;
}

interface RawUserBooking {
  user_id: string;
  status: BookingStatus;
  slot: { date: string } | null;
}

interface RawStatBooking {
  status: BookingStatus;
  facility: { name: string } | null;
  slot: { date: string } | null;
}

function getClient() {
  return createServiceClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// ── Shared status label ───────────────────────────────────────────────────────

function statusLabel(status: BookingStatus): string {
  switch (status) {
    case 'confirmed':  return 'Upcoming';
    case 'completed':  return 'Completed';
    case 'cancelled':  return 'Cancelled';
    case 'delayed':    return 'Delayed';
    default:           return status;
  }
}

// ── Export 1: Booking Report ──────────────────────────────────────────────────

export interface BookingReportFilters {
  fromDate: string;
  toDate: string;
  facilityId?: string;
  status?: string;
}

export type BookingRow = Record<string, string | number | null | undefined>;

export async function getBookingReportData(
  filters: BookingReportFilters
): Promise<{ rows: BookingRow[]; error: string | null }> {
  const supabase = getClient();

  const { data, error } = await supabase
    .from('bookings')
    .select(`
      id, user_id, status, total_amount, payment_status, payment_method, booking_ref, created_at,
      facility:facilities(id, name),
      slot:time_slots(date, start_time, end_time)
    `)
    .order('created_at', { ascending: false });

  if (error) return { rows: [], error: error.message };

  let bookings = (data ?? []) as unknown as RawBooking[];

  // Filter by slot date range (client-side — consistent with existing pattern)
  bookings = bookings.filter(b => {
    const d = b.slot?.date;
    if (!d) return false;
    return d >= filters.fromDate && d <= filters.toDate;
  });

  if (filters.facilityId) {
    bookings = bookings.filter(b => b.facility?.id === filters.facilityId);
  }

  if (filters.status && filters.status !== 'all') {
    bookings = bookings.filter(b => b.status === filters.status);
  }

  // Sort: date ASC, then start_time ASC
  bookings.sort((a, b) => {
    const dateCompare = (a.slot?.date ?? '').localeCompare(b.slot?.date ?? '');
    if (dateCompare !== 0) return dateCompare;
    return (a.slot?.start_time ?? '').localeCompare(b.slot?.start_time ?? '');
  });

  if (bookings.length === 0) return { rows: [], error: null };

  // Fetch profiles
  const userIds = [...new Set(bookings.map(b => b.user_id))];
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name, phone')
    .in('id', userIds);
  const profileMap = new Map((profiles ?? []).map(p => [p.id, p]));

  const rows: BookingRow[] = bookings.map((b) => {
    const profile = profileMap.get(b.user_id);
    return {
      'Date':           b.slot?.date ? formatShortDate(b.slot.date) : '',
      'Facility':       b.facility?.name ?? '',
      'Time':           b.slot ? formatTimeRange(b.slot.start_time, b.slot.end_time) : '',
      'Booked By':      profile?.full_name ?? 'Unknown',
      'Phone':          profile?.phone ?? '',
      'Status':         statusLabel(b.status),
      'Amount (Nu.)':   b.total_amount ?? '',
      'Payment':        b.payment_status ?? '',
      'Payment Method': b.payment_method ?? '',
      'Booking Ref':    b.booking_ref ?? '',
      'Booked On':      b.created_at ? formatShortDate(b.created_at.split('T')[0]) : '',
    };
  });

  return { rows, error: null };
}

// ── Export 2: Facility Usage Summary ─────────────────────────────────────────

export type UsageRow = Record<string, string | number | null | undefined>;

function actionNeeded(utilPct: number): string {
  if (utilPct > 90) return '⚠️ Over capacity';
  if (utilPct < 30) return '⚠️ Underutilized';
  if (utilPct >= 50) return 'Good';
  return 'Monitor';
}

export async function getFacilityUsageData(
  fromDate: string,
  toDate: string
): Promise<{ rows: UsageRow[]; error: string | null }> {
  const supabase = getClient();

  const { data, error } = await supabase
    .from('bookings')
    .select(`
      status, total_amount,
      facility:facilities(id, name, slot_duration_hours),
      slot:time_slots(date, start_time, end_time)
    `);

  if (error) return { rows: [], error: error.message };

  // Filter to date range, exclude cancelled
  const bookings = ((data ?? []) as unknown as RawUsageBooking[]).filter(b => {
    const d = b.slot?.date;
    if (!d) return false;
    return d >= fromDate && d <= toDate && b.status !== 'cancelled';
  });

  // Count operating days in range (Mon–Sat, 6 days/week)
  const operatingDaysInRange = (() => {
    let count = 0;
    const cursor = new Date(fromDate);
    const end = new Date(toDate);
    while (cursor <= end) {
      const dow = cursor.getDay(); // 0=Sun
      if (dow !== 0) count++;     // exclude Sunday
      cursor.setDate(cursor.getDate() + 1);
    }
    return count;
  })();
  const availableHoursPerFacility = operatingDaysInRange * 12; // 8 AM–8 PM

  // Group by facility
  const facilityMap = new Map<string, {
    name: string;
    slotDuration: number;
    bookingCount: number;
    totalHours: number;
    dates: string[];
    startTimes: string[];
  }>();

  for (const b of bookings) {
    const fid = b.facility?.id;
    if (!fid) continue;
    if (!facilityMap.has(fid)) {
      facilityMap.set(fid, {
        name: b.facility?.name ?? '',
        slotDuration: b.facility?.slot_duration_hours ?? 1,
        bookingCount: 0,
        totalHours: 0,
        dates: [],
        startTimes: [],
      });
    }
    const entry = facilityMap.get(fid)!;
    entry.bookingCount += 1;
    entry.totalHours += entry.slotDuration;
    if (b.slot?.date) entry.dates.push(b.slot.date);
    if (b.slot?.start_time) entry.startTimes.push(b.slot.start_time);
  }

  const rows: UsageRow[] = [];
  for (const [, entry] of facilityMap) {
    const utilPct = availableHoursPerFacility > 0
      ? Math.round((entry.totalHours / availableHoursPerFacility) * 100)
      : 0;
    const peakDayStr = entry.dates.length > 0
      ? (mode(entry.dates.map(getDayName)) ?? '—')
      : '—';
    const peakTimeStr = entry.startTimes.length > 0
      ? (mode(entry.startTimes.map(getPeakTimeBlock)) ?? '—')
      : '—';
    rows.push({
      'Facility':        entry.name,
      'Total Bookings':  entry.bookingCount,
      'Hours Used':      `${entry.totalHours} hrs`,
      'Utilization %':   `${utilPct}%`,
      'Peak Day':        peakDayStr,
      'Peak Time':       peakTimeStr,
      'Action Needed':   actionNeeded(utilPct),
    });
  }

  // Sort by utilization DESC (problems first)
  rows.sort((a, b) => {
    const au = parseInt(String(a['Utilization %'] ?? '0'));
    const bu = parseInt(String(b['Utilization %'] ?? '0'));
    return bu - au;
  });

  return { rows, error: null };
}

// ── Export 3: Problem Users (Cancellation Accountability) ────────────────────

export type UserRow = Record<string, string | number | null | undefined>;

function userAction(totalBookings: number, cancellations: number, rate: number): string {
  if (totalBookings > 20 && cancellations === 0) return 'Top user - reward?';
  if (rate > 50) return '🔴 Restrict bookings';
  if (rate > 30) return '⚠️ Warning needed';
  if (rate < 10) return 'Good standing';
  return 'Monitor';
}

export async function getProblemUsersData(
  fromDate: string,
  toDate: string
): Promise<{ rows: UserRow[]; error: string | null }> {
  const supabase = getClient();

  const { data, error } = await supabase
    .from('bookings')
    .select('user_id, status, slot:time_slots(date)');

  if (error) return { rows: [], error: error.message };

  // Filter to date range
  const bookings = ((data ?? []) as unknown as RawUserBooking[]).filter(b => {
    const d = b.slot?.date;
    if (!d) return false;
    return d >= fromDate && d <= toDate;
  });

  // Group by user
  const userMap = new Map<string, { total: number; cancelled: number }>();
  for (const b of bookings) {
    if (!userMap.has(b.user_id)) userMap.set(b.user_id, { total: 0, cancelled: 0 });
    const u = userMap.get(b.user_id)!;
    u.total += 1;
    if (b.status === 'cancelled') u.cancelled += 1;
  }

  // Filter out users with fewer than 3 bookings
  const eligibleIds = [...userMap.entries()]
    .filter(([, u]) => u.total >= 3)
    .map(([id]) => id);

  if (eligibleIds.length === 0) return { rows: [], error: null };

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name, phone')
    .in('id', eligibleIds);
  const profileMap = new Map((profiles ?? []).map(p => [p.id, p]));

  const rows: UserRow[] = eligibleIds.map(uid => {
    const u = userMap.get(uid)!;
    const profile = profileMap.get(uid);
    const rate = Math.round((u.cancelled / u.total) * 100);
    return {
      'Name':                profile?.full_name ?? 'Unknown',
      'Phone':               profile?.phone ?? '',
      'Total Bookings':      u.total,
      'Cancellations':       u.cancelled,
      'Cancellation Rate':   `${rate}%`,
      'Action':              userAction(u.total, u.cancelled, rate),
    };
  });

  // Sort by cancellation rate DESC
  rows.sort((a, b) => {
    const ar = parseInt(String(a['Cancellation Rate'] ?? '0'));
    const br = parseInt(String(b['Cancellation Rate'] ?? '0'));
    return br - ar;
  });

  return { rows, error: null };
}

// ── Summary stats (for the stats card) ───────────────────────────────────────

export interface SummaryStats {
  total: number;
  completed: number;
  cancelled: number;
  upcoming: number;
  delayed: number;
  topFacility: string;
}

export async function getSummaryStats(
  fromDate: string,
  toDate: string
): Promise<{ stats: SummaryStats | null; error: string | null }> {
  const supabase = getClient();

  const { data, error } = await supabase
    .from('bookings')
    .select(`status, facility:facilities(name), slot:time_slots(date)`);

  if (error) return { stats: null, error: error.message };

  const bookings = ((data ?? []) as unknown as RawStatBooking[]).filter(b => {
    const d = b.slot?.date;
    return d && d >= fromDate && d <= toDate;
  });

  const facilityCount = new Map<string, number>();
  let completed = 0, cancelled = 0, upcoming = 0, delayed = 0;

  for (const b of bookings) {
    if (b.status === 'completed') completed++;
    if (b.status === 'cancelled') cancelled++;
    if (b.status === 'confirmed') upcoming++;
    if (b.status === 'delayed') delayed++;
    const fname = b.facility?.name;
    if (fname) facilityCount.set(fname, (facilityCount.get(fname) ?? 0) + 1);
  }

  const topFacility = facilityCount.size > 0
    ? [...facilityCount.entries()].sort((a, b) => b[1] - a[1])[0][0]
    : '—';

  return {
    stats: { total: bookings.length, completed, cancelled, upcoming, delayed, topFacility },
    error: null,
  };
}

// ── Facilities list (for filter dropdown) ─────────────────────────────────────

export async function getFacilitiesList(): Promise<{ id: string; name: string }[]> {
  const supabase = getClient();
  const { data } = await supabase.from('facilities').select('id, name').order('name');
  return (data ?? []) as { id: string; name: string }[];
}

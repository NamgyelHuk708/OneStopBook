// ── CSV field escaping ────────────────────────────────────────────────────────

function escapeField(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function convertToCSV(data: Record<string, string | number | null | undefined>[]): string {
  if (data.length === 0) return '';
  const headers = Object.keys(data[0]);
  const rows = [
    headers.join(','),
    ...data.map(row => headers.map(h => escapeField(row[h])).join(',')),
  ];
  // BOM prefix so Excel opens UTF-8 correctly without garbling names
  return '﻿' + rows.join('\r\n');
}

export function downloadCSV(data: Record<string, string | number | null | undefined>[], filename: string): void {
  if (data.length === 0) return;
  const csv = convertToCSV(data);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// ── Date / time formatters ────────────────────────────────────────────────────

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const DAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

export function formatShortDate(dateStr: string): string {
  // "2026-05-20" → "May 20"
  const [, month, day] = dateStr.split('-').map(Number);
  return `${MONTHS[month - 1]} ${day}`;
}

export function formatMonthYear(dateStr: string): string {
  // "2026-05-20" → "May-2026"
  const [year, month] = dateStr.split('-').map(Number);
  return `${MONTHS[month - 1]}-${year}`;
}

export function formatTimeRange(startTime: string, endTime: string): string {
  // "16:00:00", "18:00:00" → "4:00-6:00 PM"
  const [sh, sm] = startTime.split(':').map(Number);
  const [eh, em] = endTime.split(':').map(Number);

  const toAmPm = (h: number, m: number) => {
    const period = h >= 12 ? 'PM' : 'AM';
    const h12 = h > 12 ? h - 12 : h === 0 ? 12 : h;
    const minStr = m === 0 ? '00' : m.toString().padStart(2, '0');
    return { display: `${h12}:${minStr}`, period };
  };

  const start = toAmPm(sh, sm);
  const end = toAmPm(eh, em);

  if (start.period === end.period) {
    return `${start.display}-${end.display} ${end.period}`;
  }
  return `${start.display} ${start.period}-${end.display} ${end.period}`;
}

export function formatShortTime(timeStr: string): string {
  // "16:05:00" → "4:05 PM"
  const [h, m] = timeStr.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const h12 = h > 12 ? h - 12 : h === 0 ? 12 : h;
  const minStr = m === 0 ? '00' : m.toString().padStart(2, '0');
  return `${h12}:${minStr} ${period}`;
}

export function getDayName(dateStr: string): string {
  // "2026-05-20" → "Wednesday"
  const [year, month, day] = dateStr.split('-').map(Number);
  return DAYS[new Date(year, month - 1, day).getDay()];
}

export function getPeakTimeBlock(startTime: string): string {
  // Groups into 2-hour blocks: "16:00:00" → "4-6 PM"
  const [h] = startTime.split(':').map(Number);
  const blockStart = Math.floor(h / 2) * 2;
  const blockEnd = blockStart + 2;
  const period = blockEnd > 12 ? 'PM' : 'AM';
  const s12 = blockStart > 12 ? blockStart - 12 : blockStart === 0 ? 12 : blockStart;
  const e12 = blockEnd > 12 ? blockEnd - 12 : blockEnd;
  return `${s12}-${e12} ${period}`;
}

export function mode<T>(arr: T[]): T | null {
  if (arr.length === 0) return null;
  const freq = new Map<T, number>();
  for (const item of arr) freq.set(item, (freq.get(item) ?? 0) + 1);
  return [...freq.entries()].sort((a, b) => b[1] - a[1])[0][0];
}

// ── Filename helpers ──────────────────────────────────────────────────────────

export function bookingReportFilename(fromDate: string, toDate: string): string {
  const from = formatMonthYear(fromDate);
  const to = formatMonthYear(toDate);
  const range = from === to ? from : `${from}_to_${to}`;
  return `Bookings_CST_${range}.csv`;
}

export function facilityUsageFilename(fromDate: string): string {
  return `Facility-Usage_${formatMonthYear(fromDate)}.csv`;
}

export function problemUsersFilename(): string {
  const today = new Date().toISOString().split('T')[0];
  return `Problem-Users_${today}.csv`;
}

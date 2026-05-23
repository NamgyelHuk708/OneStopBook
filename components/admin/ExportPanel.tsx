'use client';

import { useState, useEffect, useCallback } from 'react';
import { Download, Eye, X, FileText, BarChart2, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { downloadCSV, bookingReportFilename, facilityUsageFilename, problemUsersFilename } from '@/lib/utils/csv-export';
import {
  getBookingReportData,
  getFacilityUsageData,
  getProblemUsersData,
  getSummaryStats,
  getFacilitiesList,
  type SummaryStats,
} from '@/app/admin/export/actions';

// ── Types ─────────────────────────────────────────────────────────────────────

type ReportType = 'bookings' | 'usage' | 'users';
type ExportRow = Record<string, string | number | null | undefined>;

// ── Date helpers ──────────────────────────────────────────────────────────────

function todayISO() {
  return new Date().toISOString().split('T')[0];
}

function daysAgoISO(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split('T')[0];
}

function thisMonthRange(): [string, string] {
  const now = new Date();
  const from = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
  const to = todayISO();
  return [from, to];
}

function lastMonthRange(): [string, string] {
  const now = new Date();
  const firstOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastOfLastMonth = new Date(firstOfThisMonth.getTime() - 86400000);
  const firstOfLastMonth = new Date(lastOfLastMonth.getFullYear(), lastOfLastMonth.getMonth(), 1);
  const fmt = (d: Date) => d.toISOString().split('T')[0];
  return [fmt(firstOfLastMonth), fmt(lastOfLastMonth)];
}

// ── Sub-components ────────────────────────────────────────────────────────────

function SummaryCard({ stats, loading }: { stats: SummaryStats | null; loading: boolean }) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-card border border-[#d0ebe0] p-4 animate-pulse">
            <div className="h-3 w-16 bg-g50 rounded mb-2" />
            <div className="h-7 w-10 bg-g100/30 rounded" />
          </div>
        ))}
      </div>
    );
  }
  if (!stats) return null;

  const items = [
    { label: 'Total Bookings', value: stats.total, color: 'text-g800' },
    { label: 'Completed', value: stats.completed, color: 'text-g400' },
    { label: 'Cancelled', value: stats.cancelled, color: 'text-danger' },
    { label: 'Upcoming', value: stats.upcoming, color: 'text-warning-text' },
  ];

  return (
    <div className="mb-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
        {items.map(item => (
          <div key={item.label} className="bg-white rounded-card border border-[#d0ebe0] p-4">
            <p className="text-xs text-g600 mb-1">{item.label}</p>
            <p className={cn('text-2xl font-semibold tracking-heading', item.color)}>{item.value}</p>
          </div>
        ))}
      </div>
      {stats.topFacility !== '—' && (
        <p className="text-xs text-g600">
          Most booked: <span className="font-medium text-g800">{stats.topFacility}</span>
        </p>
      )}
    </div>
  );
}

function PreviewModal({
  rows,
  onClose,
}: {
  rows: ExportRow[];
  onClose: () => void;
}) {
  const preview = rows.slice(0, 10);
  const headers = preview.length > 0 ? Object.keys(preview[0]) : [];

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Data preview"
    >
      <div className="absolute inset-0 bg-g900/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-card shadow-xl w-full max-w-5xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#d0ebe0]">
          <div>
            <h2 className="text-base font-medium text-g800">Preview</h2>
            <p className="text-xs text-g600 mt-0.5">
              Showing {preview.length} of {rows.length} rows
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-[8px] text-g600 hover:bg-g50 transition-colors"
            aria-label="Close preview"
          >
            <X size={18} />
          </button>
        </div>

        {/* Table */}
        <div className="overflow-auto flex-1 px-1">
          {preview.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-g600">
              <FileText size={32} className="mb-3 opacity-40" />
              <p className="text-sm">No data for selected filters</p>
            </div>
          ) : (
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-g50 z-10">
                <tr>
                  {headers.map(h => (
                    <th
                      key={h}
                      className="px-3 py-2.5 text-left font-medium text-g600 uppercase tracking-label whitespace-nowrap border-b border-[#d0ebe0]"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#d0ebe0]">
                {preview.map((row, ri) => (
                  <tr key={ri} className="hover:bg-g50 transition-colors">
                    {headers.map(h => (
                      <td key={h} className="px-3 py-2 text-g800 whitespace-nowrap">
                        {row[h] ?? ''}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer */}
        {rows.length > 10 && (
          <div className="px-5 py-3 border-t border-[#d0ebe0] text-xs text-g600">
            {rows.length - 10} more rows will be included in the CSV export.
          </div>
        )}
      </div>
    </div>
  );
}

function Toast({ message, type }: { message: string; type: 'success' | 'error' }) {
  return (
    <div
      className={cn(
        'fixed bottom-20 lg:bottom-6 left-1/2 -translate-x-1/2 z-50',
        'flex items-center gap-2 px-4 py-3 rounded-pill shadow-lg text-sm font-medium',
        'animate-in fade-in slide-in-from-bottom-2 duration-200',
        type === 'success'
          ? 'bg-g800 text-g50'
          : 'bg-danger text-white'
      )}
    >
      {type === 'success'
        ? <CheckCircle size={15} />
        : <AlertTriangle size={15} />}
      {message}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

const REPORT_TYPES: { id: ReportType; label: string; description: string; icon: React.ElementType }[] = [
  {
    id: 'bookings',
    label: 'Booking Report',
    description: 'Detailed log of all bookings — dates, users, status, payments.',
    icon: FileText,
  },
  {
    id: 'usage',
    label: 'Facility Usage',
    description: 'Monthly utilization summary per facility with peak times.',
    icon: BarChart2,
  },
  {
    id: 'users',
    label: 'Cancellation Report',
    description: 'Users with high cancellation rates for accountability tracking.',
    icon: AlertTriangle,
  },
];

export function ExportPanel() {
  const [reportType, setReportType] = useState<ReportType>('bookings');
  const [fromDate, setFromDate] = useState(() => thisMonthRange()[0]);
  const [toDate, setToDate] = useState(() => thisMonthRange()[1]);
  const [filterFacility, setFilterFacility] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  const [facilities, setFacilities] = useState<{ id: string; name: string }[]>([]);
  const [stats, setStats] = useState<SummaryStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  const [exporting, setExporting] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [previewRows, setPreviewRows] = useState<ExportRow[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Load facilities for dropdown
  useEffect(() => {
    getFacilitiesList().then(setFacilities);
  }, []);

  // Load summary stats whenever date range changes
  const loadStats = useCallback(async () => {
    if (!fromDate || !toDate) return;
    setStatsLoading(true);
    const { stats: s } = await getSummaryStats(fromDate, toDate);
    setStats(s);
    setStatsLoading(false);
  }, [fromDate, toDate]);

  useEffect(() => { loadStats(); }, [loadStats]);

  function showToast(message: string, type: 'success' | 'error') {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  }

  async function fetchData(): Promise<ExportRow[]> {
    if (reportType === 'bookings') {
      const { rows, error } = await getBookingReportData({
        fromDate,
        toDate,
        facilityId: filterFacility !== 'all' ? filterFacility : undefined,
        status: filterStatus !== 'all' ? filterStatus : undefined,
      });
      if (error) throw new Error(error);
      return rows;
    }
    if (reportType === 'usage') {
      const { rows, error } = await getFacilityUsageData(fromDate, toDate);
      if (error) throw new Error(error);
      return rows;
    }
    const { rows, error } = await getProblemUsersData(fromDate, toDate);
    if (error) throw new Error(error);
    return rows;
  }

  function getFilename(): string {
    if (reportType === 'bookings') return bookingReportFilename(fromDate, toDate);
    if (reportType === 'usage') return facilityUsageFilename(fromDate);
    return problemUsersFilename();
  }

  async function handleExport() {
    if (!fromDate || !toDate) {
      showToast('Please select a date range.', 'error');
      return;
    }
    setExporting(true);
    try {
      const rows = await fetchData();
      if (rows.length === 0) {
        showToast('No data found for the selected filters.', 'error');
        return;
      }
      if (rows.length > 1000) {
        // Proceed but warn — still download
      }
      downloadCSV(rows, getFilename());
      showToast(`Downloaded ${rows.length} rows successfully.`, 'success');
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Export failed. Please try again.', 'error');
    } finally {
      setExporting(false);
    }
  }

  async function handlePreview() {
    if (!fromDate || !toDate) {
      showToast('Please select a date range.', 'error');
      return;
    }
    setPreviewing(true);
    try {
      const rows = await fetchData();
      setPreviewRows(rows);
      setShowPreview(true);
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Preview failed.', 'error');
    } finally {
      setPreviewing(false);
    }
  }

  function setQuickRange(type: 'last7' | 'thisMonth' | 'lastMonth') {
    if (type === 'last7') { setFromDate(daysAgoISO(7)); setToDate(todayISO()); }
    if (type === 'thisMonth') { const [f, t] = thisMonthRange(); setFromDate(f); setToDate(t); }
    if (type === 'lastMonth') { const [f, t] = lastMonthRange(); setFromDate(f); setToDate(t); }
  }

  return (
    <>
      {/* Summary stats */}
      <SummaryCard stats={stats} loading={statsLoading} />

      <div className="bg-white rounded-card border border-[#d0ebe0] overflow-hidden">

        {/* ── Report type selector ─────────────────────────────────────── */}
        <div className="p-5 border-b border-[#d0ebe0]">
          <p className="text-xs font-medium text-g600 uppercase tracking-label mb-3">Report Type</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {REPORT_TYPES.map(({ id, label, description, icon: Icon }) => (
              <label
                key={id}
                className={cn(
                  'flex items-start gap-3 p-3.5 rounded-[10px] border cursor-pointer transition-all',
                  reportType === id
                    ? 'border-g400 bg-g400/5 ring-1 ring-g400/20'
                    : 'border-[#d0ebe0] hover:border-g200 hover:bg-g50'
                )}
              >
                <input
                  type="radio"
                  name="reportType"
                  value={id}
                  checked={reportType === id}
                  onChange={() => setReportType(id)}
                  className="mt-0.5 accent-g400 flex-shrink-0"
                />
                <div>
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <Icon size={13} className={reportType === id ? 'text-g400' : 'text-g600'} />
                    <span className={cn('text-sm font-medium', reportType === id ? 'text-g800' : 'text-g800')}>
                      {label}
                    </span>
                  </div>
                  <p className="text-xs text-g600 leading-snug">{description}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* ── Date range ───────────────────────────────────────────────── */}
        <div className="p-5 border-b border-[#d0ebe0]">
          <p className="text-xs font-medium text-g600 uppercase tracking-label mb-3">Date Range</p>

          {/* Quick selects */}
          <div className="flex flex-wrap gap-2 mb-3">
            {[
              { label: 'Last 7 Days', type: 'last7' as const },
              { label: 'This Month', type: 'thisMonth' as const },
              { label: 'Last Month', type: 'lastMonth' as const },
            ].map(({ label, type }) => (
              <button
                key={type}
                onClick={() => setQuickRange(type)}
                className="px-3 py-1.5 text-xs rounded-pill border border-[#d0ebe0] text-g600 hover:border-g400 hover:text-g800 transition-colors"
              >
                {label}
              </button>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <label className="block text-xs text-g600 mb-1" htmlFor="fromDate">From</label>
              <input
                id="fromDate"
                type="date"
                value={fromDate}
                max={toDate}
                onChange={e => setFromDate(e.target.value)}
                className="w-full px-3 py-2 rounded-input border border-[#c0ddd0] bg-white text-g800 text-sm focus:outline-none focus:border-g400"
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs text-g600 mb-1" htmlFor="toDate">To</label>
              <input
                id="toDate"
                type="date"
                value={toDate}
                min={fromDate}
                max={todayISO()}
                onChange={e => setToDate(e.target.value)}
                className="w-full px-3 py-2 rounded-input border border-[#c0ddd0] bg-white text-g800 text-sm focus:outline-none focus:border-g400"
              />
            </div>
          </div>
        </div>

        {/* ── Filters (Booking Report only) ────────────────────────────── */}
        {reportType === 'bookings' && (
          <div className="p-5 border-b border-[#d0ebe0]">
            <p className="text-xs font-medium text-g600 uppercase tracking-label mb-3">
              Optional Filters
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <label className="block text-xs text-g600 mb-1" htmlFor="filterFacility">Facility</label>
                <select
                  id="filterFacility"
                  value={filterFacility}
                  onChange={e => setFilterFacility(e.target.value)}
                  className="w-full px-3 py-2 rounded-input border border-[#c0ddd0] bg-white text-g800 text-sm focus:outline-none focus:border-g400"
                >
                  <option value="all">All Facilities</option>
                  {facilities.map(f => (
                    <option key={f.id} value={f.id}>{f.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex-1">
                <label className="block text-xs text-g600 mb-1" htmlFor="filterStatus">Status</label>
                <select
                  id="filterStatus"
                  value={filterStatus}
                  onChange={e => setFilterStatus(e.target.value)}
                  className="w-full px-3 py-2 rounded-input border border-[#c0ddd0] bg-white text-g800 text-sm focus:outline-none focus:border-g400"
                >
                  <option value="all">All Statuses</option>
                  <option value="confirmed">Upcoming</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="delayed">Delayed</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* ── What's included note ─────────────────────────────────────── */}
        <div className="px-5 py-3 bg-g50 border-b border-[#d0ebe0]">
          <p className="text-xs text-g600">
            {reportType === 'bookings' && 'Exports: Date, Facility, Time, Booked By, Phone, Status, Amount, Payment, Ref, Booked On'}
            {reportType === 'usage' && 'Exports: Facility, Total Bookings, Hours Used, Utilization %, Peak Day, Peak Time, Action Needed'}
            {reportType === 'users' && 'Only includes users with 3+ bookings in the selected range. Exports: Name, Phone, Total Bookings, Cancellations, Rate, Action.'}
          </p>
        </div>

        {/* ── Action buttons ───────────────────────────────────────────── */}
        <div className="p-5 flex flex-col sm:flex-row gap-3">
          <button
            onClick={handlePreview}
            disabled={previewing || exporting}
            className={cn(
              'flex items-center justify-center gap-2 px-5 py-2.5 rounded-pill border text-sm font-medium transition-colors',
              'border-[#c0ddd0] text-g800 hover:border-g400 hover:bg-g50',
              (previewing || exporting) && 'opacity-50 cursor-not-allowed'
            )}
          >
            {previewing
              ? <Loader2 size={15} className="animate-spin" />
              : <Eye size={15} />}
            {previewing ? 'Loading…' : 'Preview'}
          </button>

          <button
            onClick={handleExport}
            disabled={exporting || previewing}
            className={cn(
              'flex items-center justify-center gap-2 px-5 py-2.5 rounded-pill text-sm font-medium transition-colors',
              'bg-g400 text-g50 hover:bg-g600',
              (exporting || previewing) && 'opacity-50 cursor-not-allowed'
            )}
          >
            {exporting
              ? <Loader2 size={15} className="animate-spin" />
              : <Download size={15} />}
            {exporting ? 'Exporting…' : 'Export CSV'}
          </button>
        </div>
      </div>

      {/* ── Preview modal ────────────────────────────────────────────────── */}
      {showPreview && (
        <PreviewModal rows={previewRows} onClose={() => setShowPreview(false)} />
      )}

      {/* ── Toast notification ───────────────────────────────────────────── */}
      {toast && <Toast message={toast.message} type={toast.type} />}
    </>
  );
}

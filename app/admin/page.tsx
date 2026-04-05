import { createClient } from '@supabase/supabase-js';
import { StatsGrid } from '@/components/admin/StatsGrid';
import { BookingsTable } from '@/components/admin/BookingsTable';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import type { Database, Booking } from '@/lib/types/database';

export const revalidate = 30;

function getServiceClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export default async function AdminDashboardPage() {
  const supabase = getServiceClient();
  const today = new Date().toISOString().split('T')[0];

  const [todayBookingsRes, allUsersRes, facilitiesRes, recentBookingsRes] = await Promise.all([
    supabase
      .from('bookings')
      .select('total_amount')
      .eq('status', 'confirmed')
      .gte('created_at', `${today}T00:00:00`),
    supabase.from('profiles').select('id', { count: 'exact', head: true }),
    supabase.from('facilities').select('status'),
    // No profile join — fetch separately below
    supabase
      .from('bookings')
      .select('*, facility:facilities(name), slot:time_slots(date, start_time, end_time)')
      .order('created_at', { ascending: false })
      .limit(10),
  ]);

  const todayBookings = todayBookingsRes.data ?? [];
  const bookingsToday = todayBookings.length;
  const revenueToday = todayBookings.reduce((s, b) => s + (b.total_amount ?? 0), 0);
  const activeUsers = allUsersRes.count ?? 0;
  const openFacilities = (facilitiesRes.data ?? []).filter(f => f.status === 'open').length;

  // Merge profiles into recent bookings
  let recentBookings = (recentBookingsRes.data ?? []) as Booking[];
  if (recentBookings.length > 0) {
    const userIds = Array.from(new Set(recentBookings.map(b => b.user_id)));
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_url, phone, is_admin, created_at')
      .in('id', userIds);
    const profileMap = new Map((profiles ?? []).map(p => [p.id, p]));
    recentBookings = recentBookings.map(b => ({
      ...b,
      profile: profileMap.get(b.user_id) ?? undefined,
    }));
  }

  return (
    <div className="p-6 sm:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-medium text-g800 tracking-heading">Dashboard</h1>
          <p className="text-sm text-g600 mt-0.5">
            {new Date().toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <Link
          href="/admin/services/new"
          className="flex items-center gap-2 px-5 py-2.5 rounded-pill bg-g400 text-g50 text-sm font-medium hover:bg-g600 transition-colors"
        >
          <Plus size={15} />
          Add service
        </Link>
      </div>

      {/* Stats */}
      <StatsGrid
        bookingsToday={bookingsToday}
        revenueToday={revenueToday}
        activeUsers={activeUsers}
        openFacilities={openFacilities}
      />

      {/* Recent bookings */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-medium text-g800">Recent bookings</h2>
          <Link href="/admin/bookings" className="text-sm text-g400 hover:text-g600 font-medium">
            View all →
          </Link>
        </div>
        <BookingsTable bookings={recentBookings} />
      </div>

      <div className="mt-6 flex gap-3">
        <Link
          href="/admin/alerts"
          className="px-5 py-2.5 rounded-pill bg-warning-bg text-warning-text border border-warning/20 text-sm font-medium hover:bg-[#f5e2bc] transition-colors"
        >
          Post alert
        </Link>
      </div>
    </div>
  );
}

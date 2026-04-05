import { CalendarDays, DollarSign, Users, Building2 } from 'lucide-react';
import { formatCurrency } from '@/lib/utils/formatters';

interface StatsGridProps {
  bookingsToday: number;
  revenueToday: number;
  activeUsers: number;
  openFacilities: number;
}

export function StatsGrid({ bookingsToday, revenueToday, activeUsers, openFacilities }: StatsGridProps) {
  const stats = [
    { label: 'Bookings today', value: String(bookingsToday), icon: CalendarDays, color: 'text-g400' },
    { label: 'Revenue today', value: formatCurrency(revenueToday), icon: DollarSign, color: 'text-g400' },
    { label: 'Active users', value: String(activeUsers), icon: Users, color: 'text-g400' },
    { label: 'Open facilities', value: String(openFacilities), icon: Building2, color: 'text-g400' },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map(({ label, value, icon: Icon, color }) => (
        <div key={label} className="bg-white rounded-card border border-[#d0ebe0] p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-g600 uppercase tracking-label">{label}</span>
            <Icon size={16} className={color} />
          </div>
          <p className="text-2xl font-semibold text-g800">{value}</p>
        </div>
      ))}
    </div>
  );
}

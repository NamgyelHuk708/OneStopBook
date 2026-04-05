import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { deleteFacility } from './actions';
import { formatCurrency } from '@/lib/utils/formatters';
import type { Facility, FacilityStatus } from '@/lib/types/database';

export const revalidate = 0;

async function DeleteButton({ id }: { id: string }) {
  async function action() {
    'use server';
    await deleteFacility(id);
  }
  return (
    <form action={action}>
      <button
        type="submit"
        className="p-1.5 rounded-[8px] text-g600 hover:text-danger hover:bg-danger-bg transition-colors"
        title="Delete"
      >
        <Trash2 size={14} />
      </button>
    </form>
  );
}

export default async function AdminServicesPage() {
  const supabase = await createClient();
  const { data } = await supabase.from('facilities').select('*').order('created_at');
  const facilities = (data ?? []) as Facility[];

  const statusVariant: Record<FacilityStatus, 'open' | 'delayed' | 'closed'> = {
    open: 'open',
    delayed: 'delayed',
    closed: 'closed',
  };

  return (
    <div className="p-6 sm:p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-medium text-g800 tracking-heading">Services</h1>
        <Link
          href="/admin/services/new"
          className="flex items-center gap-2 px-5 py-2.5 rounded-pill bg-g400 text-g50 text-sm font-medium hover:bg-g600 transition-colors"
        >
          <Plus size={15} />
          Add service
        </Link>
      </div>

      <div className="bg-white rounded-card border border-[#d0ebe0] overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#d0ebe0] bg-g50">
              <th className="px-4 py-3 text-left text-xs font-medium text-g600 uppercase tracking-label">Name</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-g600 uppercase tracking-label">Category</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-g600 uppercase tracking-label">Price/hr</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-g600 uppercase tracking-label">Status</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-g600 uppercase tracking-label">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#d0ebe0]">
            {facilities.map(f => (
              <tr key={f.id} className="hover:bg-g50 transition-colors">
                <td className="px-4 py-3 font-medium text-g800">{f.name}</td>
                <td className="px-4 py-3">
                  <Badge variant="default" className="capitalize">{f.category}</Badge>
                </td>
                <td className="px-4 py-3 text-g800">{formatCurrency(f.price_per_hour)}</td>
                <td className="px-4 py-3">
                  <Badge variant={statusVariant[f.status]} withDot>{f.status}</Badge>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <Link
                      href={`/admin/services/${f.id}/edit`}
                      className="p-1.5 rounded-[8px] text-g600 hover:text-g400 hover:bg-g100/30 transition-colors"
                      title="Edit"
                    >
                      <Pencil size={14} />
                    </Link>
                    <DeleteButton id={f.id} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

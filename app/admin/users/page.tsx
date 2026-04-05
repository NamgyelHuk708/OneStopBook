import { createClient } from '@/lib/supabase/server';
import { format, parseISO } from 'date-fns';
import { Badge } from '@/components/ui/Badge';
import type { Profile } from '@/lib/types/database';

export const revalidate = 30;

export default async function AdminUsersPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });

  const profiles = (data ?? []) as Profile[];

  return (
    <div className="p-6 sm:p-8">
      <h1 className="text-2xl font-medium text-g800 tracking-heading mb-6">
        Users ({profiles.length})
      </h1>

      <div className="bg-white rounded-card border border-[#d0ebe0] overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#d0ebe0] bg-g50">
              <th className="px-4 py-3 text-left text-xs font-medium text-g600 uppercase tracking-label">Name</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-g600 uppercase tracking-label">Phone</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-g600 uppercase tracking-label">Role</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-g600 uppercase tracking-label">Joined</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#d0ebe0]">
            {profiles.map(p => (
              <tr key={p.id} className="hover:bg-g50 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full bg-g400/20 text-g400 text-xs font-medium flex items-center justify-center flex-shrink-0">
                      {(p.full_name ?? '?').slice(0, 2).toUpperCase()}
                    </div>
                    <span className="text-g800">{p.full_name ?? 'Anonymous'}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-g600">{p.phone ?? '—'}</td>
                <td className="px-4 py-3">
                  <Badge variant={p.is_admin ? 'confirmed' : 'default'}>
                    {p.is_admin ? 'Admin' : 'User'}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-g600 text-xs">
                  {format(parseISO(p.created_at), 'dd MMM yyyy')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

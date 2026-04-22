import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { AdminSidebar } from '@/components/layout/AdminSidebar';
import { Toaster } from 'sonner';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login?redirectTo=/admin');

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single();

  if (!profile?.is_admin) redirect('/');

  return (
    <div className="flex min-h-screen bg-g50">
      <AdminSidebar />
      {/* pt-14 on mobile = space below the fixed top bar; pb-16 = space above fixed bottom nav */}
      <main className="flex-1 min-w-0 overflow-auto pt-14 pb-16 lg:pt-0 lg:pb-0">
        {children}
      </main>
      <Toaster position="bottom-right" richColors />
    </div>
  );
}

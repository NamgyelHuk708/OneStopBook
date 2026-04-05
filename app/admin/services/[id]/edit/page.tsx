import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { ServiceForm } from '@/components/admin/ServiceForm';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import type { Facility } from '@/lib/types/database';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditServicePage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase.from('facilities').select('*').eq('id', id).single();
  if (!data) notFound();

  return (
    <div className="p-6 sm:p-8">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/services" className="text-g600 hover:text-g800 transition-colors">
          <ChevronLeft size={20} />
        </Link>
        <h1 className="text-2xl font-medium text-g800 tracking-heading">Edit service</h1>
      </div>
      <ServiceForm facility={data as Facility} />
    </div>
  );
}

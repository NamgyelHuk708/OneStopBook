import { ServiceForm } from '@/components/admin/ServiceForm';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';

export default function NewServicePage() {
  return (
    <div className="p-6 sm:p-8">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/services" className="text-g600 hover:text-g800 transition-colors">
          <ChevronLeft size={20} />
        </Link>
        <h1 className="text-2xl font-medium text-g800 tracking-heading">Add new service</h1>
      </div>
      <ServiceForm />
    </div>
  );
}

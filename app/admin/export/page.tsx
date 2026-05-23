import { ExportPanel } from '@/components/admin/ExportPanel';

export const metadata = { title: 'Export Reports — Admin' };

export default function ExportPage() {
  return (
    <div className="p-6 sm:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-medium text-g800 tracking-heading">Export Reports</h1>
        <p className="text-sm text-g600 mt-1">Download CSV reports for scheduling, accountability, and monthly reviews.</p>
      </div>
      <ExportPanel />
    </div>
  );
}

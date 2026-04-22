'use client';

import { useTransition } from 'react';
import { Trash2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { deleteFacility, regenerateAllSlots } from '@/app/admin/services/actions';

export function DeleteButton({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteFacility(id);
      if (result?.error) {
        toast.error(`Delete failed: ${result.error}`);
      } else {
        toast.success('Service deleted');
      }
    });
  }

  return (
    <button
      onClick={handleDelete}
      disabled={isPending}
      className="p-1.5 rounded-[8px] text-g600 hover:text-danger hover:bg-danger-bg transition-colors disabled:opacity-40"
      title="Delete"
    >
      <Trash2 size={14} />
    </button>
  );
}

export function RegenerateSlotsButton() {
  const [isPending, startTransition] = useTransition();

  function handleRegenerate() {
    startTransition(async () => {
      const result = await regenerateAllSlots();
      if (result?.error) {
        toast.error(`Failed to regenerate slots: ${result.error}`);
      } else if (result?.totalCreated === 0) {
        toast.success('All services already have up-to-date slots');
      } else {
        toast.success(`Regenerated ${result.totalCreated} time slots`);
      }
    });
  }

  return (
    <button
      onClick={handleRegenerate}
      disabled={isPending}
      className="flex items-center gap-2 px-5 py-2.5 rounded-pill border border-g400 text-g600 text-sm font-medium hover:bg-g100/30 transition-colors disabled:opacity-40"
      title="Generate missing time slots for facilities with no upcoming dates"
    >
      <RefreshCw size={15} className={isPending ? 'animate-spin' : ''} />
      {isPending ? 'Regenerating…' : 'Regenerate Slots'}
    </button>
  );
}

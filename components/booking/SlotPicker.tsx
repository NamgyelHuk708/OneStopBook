'use client';

import { cn } from '@/lib/utils/cn';
import { formatTime } from '@/lib/utils/formatters';
import type { TimeSlot } from '@/lib/types/database';

interface SlotPickerProps {
  slots: TimeSlot[];
  selectedSlotId: string | null;
  onSelectSlot: (slot: TimeSlot) => void;
}

export function SlotPicker({ slots, selectedSlotId, onSelectSlot }: SlotPickerProps) {
  if (slots.length === 0) {
    return (
      <p className="text-sm text-g600 py-3">No time slots available for this date.</p>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {slots.map(slot => {
        const isSelected = slot.id === selectedSlotId;
        const isUnavailable = !slot.is_available;

        return (
          <button
            key={slot.id}
            disabled={isUnavailable}
            onClick={() => onSelectSlot(slot)}
            className={cn(
              'px-4 py-2 rounded-pill text-xs font-medium border transition-all',
              isSelected && 'bg-g400 text-g50 border-g400',
              !isSelected && !isUnavailable && 'bg-white text-g800 border-[#d0ebe0] hover:border-g400',
              isUnavailable && 'bg-g50 text-g100 border-[#e0ede8] line-through cursor-not-allowed'
            )}
          >
            {formatTime(slot.start_time)}
          </button>
        );
      })}
    </div>
  );
}

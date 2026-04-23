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
    return <p className="text-sm text-g600 py-3">No time slots available for this date.</p>;
  }

  const availableCount = slots.filter(s => s.is_available).length;
  const total = slots.length;

  return (
    <div>
      {/* Availability summary */}
      <div className="flex items-center gap-2 mb-3">
        <span className={cn(
          'text-xs font-medium px-2 py-0.5 rounded-pill border',
          availableCount === 0
            ? 'bg-danger-bg text-danger border-danger/20'
            : availableCount <= 3
            ? 'bg-warning-bg text-warning-text border-warning/20'
            : 'bg-success-bg text-g400 border-g400/20'
        )}>
          {availableCount === 0
            ? 'Fully booked'
            : availableCount === total
            ? `${total} slots available`
            : `${availableCount} of ${total} slots left`}
        </span>
      </div>

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
                'px-3 py-2 rounded-pill text-xs font-medium border transition-all flex flex-col items-center gap-0.5',
                isSelected && 'bg-g400 text-g50 border-g400',
                !isSelected && !isUnavailable && 'bg-white text-g800 border-[#d0ebe0] hover:border-g400',
                isUnavailable && 'bg-g50 text-g200 border-[#e0ede8] cursor-not-allowed'
              )}
            >
              <span>{formatTime(slot.start_time)}</span>
              {isUnavailable && (
                <span className="text-[9px] text-danger/70 font-medium tracking-wide">Booked</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

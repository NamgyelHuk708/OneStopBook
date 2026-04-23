'use client';

import { useState } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isBefore, startOfDay, isSameDay } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface CalendarPickerProps {
  availableDates: Set<string>;   // dates with at least 1 available slot
  partialDates: Set<string>;     // dates with some slots booked (available but not all free)
  selectedDate: string | null;
  onSelectDate: (date: string) => void;
}

export function CalendarPicker({ availableDates, partialDates, selectedDate, onSelectDate }: CalendarPickerProps) {
  const [viewDate, setViewDate] = useState(new Date());
  const today = startOfDay(new Date());

  const days = eachDayOfInterval({ start: startOfMonth(viewDate), end: endOfMonth(viewDate) });
  const startPadding = (getDay(days[0]) + 6) % 7;

  const prevMonth = () => setViewDate(d => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  const nextMonth = () => setViewDate(d => new Date(d.getFullYear(), d.getMonth() + 1, 1));

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={prevMonth} className="p-1.5 rounded-full hover:bg-g100/30 text-g600 transition-colors">
          <ChevronLeft size={16} />
        </button>
        <span className="text-sm font-medium text-g800">
          {format(viewDate, 'MMMM yyyy')}
        </span>
        <button onClick={nextMonth} className="p-1.5 rounded-full hover:bg-g100/30 text-g600 transition-colors">
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Day labels */}
      <div className="grid grid-cols-7 mb-2">
        {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map(d => (
          <div key={d} className="text-center text-[10px] font-medium text-g600 py-1">{d}</div>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7 gap-y-1">
        {Array.from({ length: startPadding }).map((_, i) => <div key={`pad-${i}`} />)}
        {days.map(day => {
          const dateStr = format(day, 'yyyy-MM-dd');
          const isPast = isBefore(day, today);
          const isAvailable = availableDates.has(dateStr);
          const isPartial = partialDates.has(dateStr);
          const isSelected = selectedDate === dateStr;
          const isToday = isSameDay(day, today);

          return (
            <div key={dateStr} className="flex flex-col items-center gap-0.5">
              <button
                disabled={isPast || !isAvailable}
                onClick={() => onSelectDate(dateStr)}
                className={cn(
                  'w-8 h-8 rounded-full text-xs font-medium transition-all',
                  isSelected && 'bg-g400 text-g50',
                  !isSelected && isAvailable && !isPast && 'bg-white border border-[#d0ebe0] text-g800 hover:border-g400',
                  !isSelected && isToday && isAvailable && 'border-g400/60',
                  isPast && 'text-g100 line-through cursor-not-allowed',
                  !isAvailable && !isPast && 'text-g100 cursor-not-allowed'
                )}
              >
                {format(day, 'd')}
              </button>

              {/* Availability dot */}
              {!isPast && isAvailable && (
                <span className={cn(
                  'w-1 h-1 rounded-full',
                  isSelected ? 'bg-g50' : isPartial ? 'bg-[#BA7517]' : 'bg-g400'
                )} />
              )}
              {/* Placeholder to keep row height consistent when no dot */}
              {(isPast || !isAvailable) && <span className="w-1 h-1" />}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-4 pt-3 border-t border-[#e8f5ee]">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-g400" />
          <span className="text-[10px] text-g600">Available</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#BA7517]" />
          <span className="text-[10px] text-g600">Filling up</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-g100" />
          <span className="text-[10px] text-g600">Fully booked</span>
        </div>
      </div>
    </div>
  );
}

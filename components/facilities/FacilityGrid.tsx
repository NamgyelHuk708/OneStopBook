'use client';

import { useState } from 'react';
import { FacilityCard } from './FacilityCard';
import { FacilityCardSkeleton } from '@/components/ui/Skeleton';
import { cn } from '@/lib/utils/cn';
import type { Facility, FacilityCategory } from '@/lib/types/database';

type FilterCategory = FacilityCategory | 'all';

interface FacilityGridProps {
  facilities: Facility[];
  loading: boolean;
}

const filters: { label: string; value: FilterCategory }[] = [
  { label: 'All', value: 'all' },
  { label: 'Outdoor', value: 'outdoor' },
  { label: 'Indoor', value: 'indoor' },
  { label: 'Services', value: 'service' },
];

export function FacilityGrid({ facilities, loading }: FacilityGridProps) {
  const [activeFilter, setActiveFilter] = useState<FilterCategory>('all');

  const filtered =
    activeFilter === 'all'
      ? facilities
      : facilities.filter(f => f.category === activeFilter);

  return (
    <div>
      {/* Filter pills */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1 scrollbar-hide">
        {filters.map(f => (
          <button
            key={f.value}
            onClick={() => setActiveFilter(f.value)}
            className={cn(
              'flex-shrink-0 px-4 py-1.5 rounded-pill text-sm font-medium border transition-all',
              activeFilter === f.value
                ? 'bg-g400 text-g50 border-g400'
                : 'bg-white text-g600 border-[#d0ebe0] hover:border-g400 hover:text-g400'
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <FacilityCardSkeleton key={i} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center text-g600">
          <p className="text-lg font-medium text-g800 mb-1">No facilities found</p>
          <p className="text-sm">Try a different filter or check back later.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map(facility => (
            <FacilityCard key={facility.id} facility={facility} />
          ))}
        </div>
      )}
    </div>
  );
}

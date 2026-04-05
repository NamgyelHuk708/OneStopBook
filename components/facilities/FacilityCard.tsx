'use client';

import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { formatCurrency } from '@/lib/utils/formatters';
import type { Facility, FacilityStatus } from '@/lib/types/database';

interface FacilityCardProps {
  facility: Facility;
}

const statusVariant: Record<FacilityStatus, 'open' | 'delayed' | 'closed'> = {
  open: 'open',
  delayed: 'delayed',
  closed: 'closed',
};

// Geometric illustration colors per category
const illustrationBg: Record<string, string> = {
  outdoor: 'bg-g100/30',
  indoor: 'bg-g200/20',
  service: 'bg-g50',
};

const illustrationEmoji: Record<string, string> = {
  outdoor: '⚽',
  indoor: '🏸',
  service: '🧺',
};

export function FacilityCard({ facility }: FacilityCardProps) {
  const router = useRouter();

  return (
    <Card
      hover
      onClick={() => router.push(`/facilities/${facility.id}`)}
      className="overflow-hidden"
    >
      {/* Illustration area */}
      <div className={`relative h-44 flex items-center justify-center ${illustrationBg[facility.category] ?? 'bg-g50'}`}>
        {/* Geometric circle decorations */}
        <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-g100/20 border border-g100/30" />
        <div className="absolute -bottom-4 -left-4 w-16 h-16 rounded-full bg-g200/15 border border-g100/20" />
        <div className="absolute top-4 left-4 w-8 h-8 rounded-full bg-g400/10" />

        {facility.images?.[0] ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={facility.images[0]}
            alt={facility.name}
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <span className="text-5xl relative z-10" role="img" aria-label={facility.category}>
            {illustrationEmoji[facility.category] ?? '🏟'}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="p-5">
        <div className="flex items-start justify-between gap-2 mb-3">
          <Badge variant="default" className="text-[10px]">
            {facility.category}
          </Badge>
          <Badge variant={statusVariant[facility.status]} withDot className="text-[10px]">
            {facility.status}
          </Badge>
        </div>

        <h3 className="text-base font-medium text-g800 mb-1 leading-snug">{facility.name}</h3>
        {facility.description && (
          <p className="text-xs text-g600 line-clamp-2 mb-3 leading-relaxed">
            {facility.description}
          </p>
        )}

        <div className="flex items-center justify-between mt-auto">
          <span className="text-g400 font-semibold text-sm">
            {formatCurrency(facility.price_per_hour)}
          </span>
          <span className="text-xs text-g600">per hour</span>
        </div>
      </div>
    </Card>
  );
}

'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Star, Users, MapPin, Layers, ChevronRight } from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { CalendarPicker } from '@/components/booking/CalendarPicker';
import { SlotPicker } from '@/components/booking/SlotPicker';
import { PaymentForm } from '@/components/payment/PaymentForm';
import { formatCurrency, formatTimeRange, formatDate } from '@/lib/utils/formatters';
import { useFacility } from '@/hooks/useFacilities';
import { useAuth } from '@/hooks/useAuth';
import type { Facility, Review, TimeSlot } from '@/lib/types/database';

interface Props {
  facility: Facility;
  reviews: (Review & { profile: { full_name: string | null; avatar_url: string | null } | null })[];
  slots: TimeSlot[];
  initialStep?: 'detail' | 'payment';
  initialSlotId?: string;
  paymentSlot?: TimeSlot | null;
}

const statusVariant = {
  open: 'open' as const,
  delayed: 'delayed' as const,
  closed: 'closed' as const,
};

function StarRating({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star
          key={i}
          size={13}
          className={i <= Math.round(value) ? 'text-g400 fill-g400' : 'text-g100'}
        />
      ))}
    </div>
  );
}

export function FacilityDetailClient({
  facility: initialFacility,
  reviews,
  slots,
  initialStep = 'detail',
  initialSlotId,
  paymentSlot,
}: Props) {
  // Use Realtime hook to get live status updates
  const { facility } = useFacility(initialFacility.id);
  const current = facility ?? initialFacility;

  const [step, setStep] = useState<'detail' | 'payment'>(initialStep);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(
    initialSlotId ? (slots.find(s => s.id === initialSlotId) ?? paymentSlot ?? null) : null
  );

  const { user } = useAuth();
  const router = useRouter();

  const availableDates = useMemo(() => {
    const set = new Set<string>();
    slots.filter(s => s.is_available).forEach(s => set.add(s.date));
    return set;
  }, [slots]);

  const dateSlotsRaw = useMemo(
    () => (selectedDate ? slots.filter(s => s.date === selectedDate) : []),
    [slots, selectedDate]
  );

  const avgRating = reviews.length
    ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
    : 0;

  function handleProceed() {
    if (!selectedSlot) return;
    if (!user) {
      router.push(`/login?redirectTo=/facilities/${current.id}`);
      return;
    }
    setStep('payment');
    router.replace(`/facilities/${current.id}?step=payment&slotId=${selectedSlot.id}`, { scroll: false });
  }

  function handleBack() {
    setStep('detail');
    router.replace(`/facilities/${current.id}`, { scroll: false });
  }

  function handleSelectDate(date: string) {
    setSelectedDate(date);
    setSelectedSlot(null);
  }

  // ── Payment step ─────────────────────���────────────────────────────────────
  if (step === 'payment' && selectedSlot) {
    return (
      <>
        <Navbar backHref={`/facilities/${current.id}`} />
        <main className="max-w-lg mx-auto px-4 sm:px-6 py-8 pb-20">
          <h1 className="text-2xl font-medium text-g800 tracking-heading mb-6">Complete payment</h1>
          <PaymentForm
            facility={current}
            slot={selectedSlot}
            onBack={handleBack}
          />
        </main>
      </>
    );
  }

  // ── Detail step ───────────────────────────────────────────────────────────
  return (
    <>
      <Navbar backHref="/" />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 pb-36">
        {/* Hero */}
        <div className="relative h-56 sm:h-72 rounded-card overflow-hidden mt-4 bg-g100/20">
          {current.images?.[0] ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={current.images[0]} alt={current.name} className="w-full h-full object-cover" />
          ) : (
            <>
              <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full bg-g100/30 border border-g100/20" />
              <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full bg-g200/20 border border-g100/10" />
              <div className="absolute inset-0 flex items-center justify-center text-7xl">
                {current.category === 'outdoor' ? '⚽' : current.category === 'indoor' ? '🏸' : '🧺'}
              </div>
            </>
          )}
        </div>

        {/* Header */}
        <div className="flex items-start justify-between gap-4 mt-5">
          <div>
            <h1 className="text-2xl font-medium text-g800 tracking-heading">{current.name}</h1>
            {reviews.length > 0 && (
              <div className="flex items-center gap-2 mt-1.5">
                <StarRating value={avgRating} />
                <span className="text-xs text-g600">
                  {avgRating.toFixed(1)} ({reviews.length} review{reviews.length !== 1 ? 's' : ''})
                </span>
              </div>
            )}
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-xl font-semibold text-g400">{formatCurrency(current.price_per_hour)}</p>
            <p className="text-xs text-g600">per hour</p>
          </div>
        </div>

        <div className="mt-3">
          <Badge variant={statusVariant[current.status]} withDot>{current.status}</Badge>
        </div>

        {current.description && (
          <p className="mt-3 text-sm text-g600 leading-relaxed">{current.description}</p>
        )}

        {/* Info grid */}
        <div className="grid grid-cols-2 gap-3 mt-5">
          {current.capacity && (
            <div className="bg-white rounded-card border border-[#d0ebe0] p-4 flex items-center gap-3">
              <Users size={16} className="text-g400" />
              <div>
                <p className="text-[10px] text-g600 uppercase tracking-label font-medium">Capacity</p>
                <p className="text-sm font-medium text-g800">{current.capacity} players</p>
              </div>
            </div>
          )}
          {current.surface_type && (
            <div className="bg-white rounded-card border border-[#d0ebe0] p-4 flex items-center gap-3">
              <Layers size={16} className="text-g400" />
              <div>
                <p className="text-[10px] text-g600 uppercase tracking-label font-medium">Surface</p>
                <p className="text-sm font-medium text-g800">{current.surface_type}</p>
              </div>
            </div>
          )}
          <div className="bg-white rounded-card border border-[#d0ebe0] p-4 flex items-center gap-3">
            <MapPin size={16} className="text-g400" />
            <div>
              <p className="text-[10px] text-g600 uppercase tracking-label font-medium">Location</p>
              <p className="text-sm font-medium text-g800">OneStopBook Sports Complex</p>
            </div>
          </div>
          <div className="bg-white rounded-card border border-[#d0ebe0] p-4 flex items-center gap-3">
            <div className={`w-[7px] h-[7px] rounded-full flex-shrink-0 ${
              current.status === 'open' ? 'bg-g400' : current.status === 'delayed' ? 'bg-[#BA7517]' : 'bg-[#E24B4A]'
            }`} />
            <div>
              <p className="text-[10px] text-g600 uppercase tracking-label font-medium">Status</p>
              <p className="text-sm font-medium text-g800 capitalize">{current.status}</p>
            </div>
          </div>
        </div>

        {/* Rules */}
        {current.rules && current.rules.length > 0 && (
          <div className="mt-6">
            <h2 className="text-base font-medium text-g800 mb-3">Rules & policies</h2>
            <ul className="space-y-2">
              {current.rules.map((rule, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm text-g600">
                  <span className="w-1.5 h-1.5 rounded-full bg-g400 flex-shrink-0 mt-1.5" />
                  {rule}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Calendar */}
        <div className="mt-8">
          <h2 className="text-base font-medium text-g800 mb-4">Select a date</h2>
          <div className="bg-white rounded-card border border-[#d0ebe0] p-5">
            <CalendarPicker
              availableDates={availableDates}
              selectedDate={selectedDate}
              onSelectDate={handleSelectDate}
            />
          </div>
        </div>

        {/* Time slots */}
        {selectedDate && (
          <div className="mt-5">
            <h2 className="text-base font-medium text-g800 mb-3">
              Available slots — {formatDate(selectedDate)}
            </h2>
            <div className="bg-white rounded-card border border-[#d0ebe0] p-5">
              <SlotPicker
                slots={dateSlotsRaw}
                selectedSlotId={selectedSlot?.id ?? null}
                onSelectSlot={setSelectedSlot}
              />
            </div>
          </div>
        )}

        {/* Reviews */}
        {reviews.length > 0 && (
          <div className="mt-8">
            <h2 className="text-base font-medium text-g800 mb-4">Reviews</h2>
            <div className="space-y-3">
              {reviews.map(review => {
                const name = review.profile?.full_name ?? 'Anonymous';
                const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
                return (
                  <div key={review.id} className="bg-white rounded-card border border-[#d0ebe0] p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-8 h-8 rounded-full bg-g400/20 text-g400 text-xs font-medium flex items-center justify-center">
                        {initials}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-g800">{name}</p>
                        <StarRating value={review.rating} />
                      </div>
                    </div>
                    {review.comment && (
                      <p className="text-sm text-g600 leading-relaxed">{review.comment}</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>

      {/* Sticky bottom bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-[#d0ebe0] px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-4">
          <div>
            {selectedSlot ? (
              <>
                <p className="text-xs text-g600">{selectedDate && formatDate(selectedDate)}</p>
                <p className="text-sm font-medium text-g800">
                  {formatTimeRange(selectedSlot.start_time, selectedSlot.end_time)}
                  {' · '}
                  <span className="text-g400">{formatCurrency(current.price_per_hour)}</span>
                </p>
              </>
            ) : (
              <p className="text-sm text-g600">Select a date and time to book</p>
            )}
          </div>
          <Button
            onClick={handleProceed}
            disabled={!selectedSlot || current.status === 'closed'}
            size="md"
          >
            Proceed to payment
            <ChevronRight size={15} />
          </Button>
        </div>
      </div>
    </>
  );
}

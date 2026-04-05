'use client';

import { useState, useTransition } from 'react';
import { CreditCard, Smartphone, Shield, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { formatCurrency, formatDate, formatTimeRange } from '@/lib/utils/formatters';
import { createBooking } from '@/app/facilities/[id]/actions';
import { useCredits } from '@/hooks/useCredits';
import type { Facility, TimeSlot } from '@/lib/types/database';

interface PaymentFormProps {
  facility: Facility;
  slot: TimeSlot;
  onBack: () => void;
}

type PaymentMethod = 'card' | 'mobile';

const BOOKING_FEE = 20;

export function PaymentForm({ facility, slot, onBack }: PaymentFormProps) {
  const [method, setMethod] = useState<PaymentMethod>('card');
  const [useCredit, setUseCredit] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const { totalAvailable } = useCredits();

  // Card fields
  const [cardName, setCardName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const hireFee = facility.price_per_hour;
  const subtotal = hireFee + BOOKING_FEE;
  const creditDeduction = useCredit ? Math.min(totalAvailable, subtotal) : 0;
  const total = Math.max(0, subtotal - creditDeduction);

  function formatCardNumber(val: string) {
    return val.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();
  }

  function formatExpiry(val: string) {
    const digits = val.replace(/\D/g, '').slice(0, 4);
    if (digits.length >= 3) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
    return digits;
  }

  function validate(): boolean {
    const errors: Record<string, string> = {};
    if (method === 'card') {
      if (!cardName.trim()) errors.cardName = 'Name is required';
      const digits = cardNumber.replace(/\s/g, '');
      if (digits.length !== 16) errors.cardNumber = 'Card number must be 16 digits';
      if (!/^\d{2}\/\d{2}$/.test(expiry)) errors.expiry = 'Use MM/YY format';
      if (!/^\d{3}$/.test(cvv)) errors.cvv = 'CVV must be 3 digits';
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  function handleSubmit() {
    if (!validate()) return;
    setError(null);
    startTransition(async () => {
      const result = await createBooking({
        facilityId: facility.id,
        slotId: slot.id,
        totalAmount: subtotal,
        paymentMethod: method === 'card' ? 'card' : 'mobile_pay',
        useCredit,
        creditAmount: creditDeduction,
      });
      if (result?.error) setError(result.error);
    });
  }

  return (
    <div className="max-w-lg mx-auto">
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm text-g600 hover:text-g800 mb-6 transition-colors"
      >
        <ChevronLeft size={16} /> Back to details
      </button>

      {/* Booking summary */}
      <div className="bg-white rounded-card border border-[#d0ebe0] p-5 mb-5">
        <h3 className="text-sm font-medium text-g800 mb-4">Booking summary</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-g600">Facility</span>
            <span className="text-g800 font-medium">{facility.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-g600">Date</span>
            <span className="text-g800">{formatDate(slot.date)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-g600">Time</span>
            <span className="text-g800">{formatTimeRange(slot.start_time, slot.end_time)}</span>
          </div>
          <div className="border-t border-[#d0ebe0] my-3" />
          <div className="flex justify-between">
            <span className="text-g600">Hire fee</span>
            <span className="text-g800">{formatCurrency(hireFee)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-g600">Booking fee</span>
            <span className="text-g800">{formatCurrency(BOOKING_FEE)}</span>
          </div>
          {creditDeduction > 0 && (
            <div className="flex justify-between text-g400">
              <span>Credit applied</span>
              <span>-{formatCurrency(creditDeduction)}</span>
            </div>
          )}
          <div className="border-t border-[#d0ebe0] mt-3 pt-3 flex justify-between">
            <span className="font-medium text-g800">Total</span>
            <span className="font-semibold text-g400 text-base">{formatCurrency(total)}</span>
          </div>
        </div>
      </div>

      {/* Credits toggle */}
      {totalAvailable > 0 && (
        <div className="bg-success-bg rounded-card border border-g400/20 p-4 mb-5 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-g800">Use credits</p>
            <p className="text-xs text-g600">You have {formatCurrency(totalAvailable)} available</p>
          </div>
          <button
            onClick={() => setUseCredit(v => !v)}
            className={`w-10 h-5 rounded-full transition-all relative ${useCredit ? 'bg-g400' : 'bg-g100'}`}
          >
            <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${useCredit ? 'left-5' : 'left-0.5'}`} />
          </button>
        </div>
      )}

      {/* Payment method */}
      <div className="mb-5">
        <p className="text-xs font-medium text-g800 mb-2 tracking-label uppercase">Payment method</p>
        <div className="flex gap-3">
          {(['card', 'mobile'] as PaymentMethod[]).map(m => (
            <button
              key={m}
              onClick={() => setMethod(m)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-card border text-sm font-medium transition-all ${
                method === m
                  ? 'bg-g400/10 border-g400 text-g400'
                  : 'bg-white border-[#d0ebe0] text-g600 hover:border-g400'
              }`}
            >
              {m === 'card' ? <CreditCard size={16} /> : <Smartphone size={16} />}
              {m === 'card' ? 'Card' : 'Mobile Pay'}
            </button>
          ))}
        </div>
      </div>

      {/* Card form */}
      {method === 'card' && (
        <div className="space-y-4 mb-6">
          <Input
            label="Cardholder name"
            placeholder="As on card"
            value={cardName}
            onChange={e => setCardName(e.target.value)}
            error={fieldErrors.cardName}
          />
          <Input
            label="Card number"
            placeholder="1234 5678 9012 3456"
            value={cardNumber}
            onChange={e => setCardNumber(formatCardNumber(e.target.value))}
            error={fieldErrors.cardNumber}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Expiry"
              placeholder="MM/YY"
              value={expiry}
              onChange={e => setExpiry(formatExpiry(e.target.value))}
              error={fieldErrors.expiry}
            />
            <Input
              label="CVV"
              placeholder="123"
              maxLength={3}
              value={cvv}
              onChange={e => setCvv(e.target.value.replace(/\D/g, '').slice(0, 3))}
              error={fieldErrors.cvv}
            />
          </div>
        </div>
      )}

      {method === 'mobile' && (
        <div className="space-y-4 mb-6">
          <div className="bg-g50 rounded-card border border-[#d0ebe0] p-4">
            <p className="text-sm text-g600 text-center">
              You will receive a payment prompt on your registered mobile number.
            </p>
            <div className="flex gap-3 mt-4 justify-center">
              {['mBoB', 'BNB'].map(provider => (
                <button
                  key={provider}
                  className="px-6 py-2 rounded-pill border border-[#d0ebe0] text-sm font-medium text-g800 bg-white hover:border-g400 transition-all"
                >
                  {provider}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-4 px-4 py-3 rounded-input bg-danger-bg border border-danger text-danger text-sm">
          {error}
        </div>
      )}

      <Button
        onClick={handleSubmit}
        disabled={isPending}
        size="lg"
        className="w-full"
      >
        {isPending ? 'Processing…' : `Pay ${formatCurrency(total)} & confirm booking`}
      </Button>

      <div className="flex items-center justify-center gap-2 mt-4 text-xs text-g600">
        <Shield size={12} />
        Your payment is secure and encrypted
      </div>
    </div>
  );
}

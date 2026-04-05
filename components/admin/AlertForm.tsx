'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { postAlert } from '@/app/admin/alerts/actions';
import type { Facility, AlertType } from '@/lib/types/database';

interface AlertFormProps {
  facilities: Facility[];
  onSuccess?: (affectedCount: number) => void;
}

const alertTypes: { value: AlertType; label: string }[] = [
  { value: 'weather', label: 'Weather' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'emergency', label: 'Emergency' },
  { value: 'operational', label: 'Operational' },
];

export function AlertForm({ facilities, onSuccess }: AlertFormProps) {
  const [facilityId, setFacilityId] = useState(facilities[0]?.id ?? '');
  const [alertType, setAlertType] = useState<AlertType>('operational');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit() {
    if (!title.trim() || !message.trim()) {
      setError('Title and message are required');
      return;
    }
    if (!facilityId) {
      setError('Select a facility');
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await postAlert({ facilityId, alertType, title, message });
      if (result?.error) {
        setError(result.error);
      } else if (result?.success) {
        setTitle('');
        setMessage('');
        onSuccess?.(result.affectedCount ?? 0);
      }
    });
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="px-4 py-3 rounded-input bg-danger-bg border border-danger text-danger text-sm">
          {error}
        </div>
      )}

      <div>
        <label className="block text-xs font-medium text-g800 mb-1.5 tracking-label uppercase">Facility</label>
        <select
          value={facilityId}
          onChange={e => setFacilityId(e.target.value)}
          className="w-full px-4 py-2.5 rounded-input border border-[#c0ddd0] bg-g50 text-g900 text-sm focus:outline-none focus:border-g400"
        >
          {facilities.map(f => (
            <option key={f.id} value={f.id}>{f.name}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-xs font-medium text-g800 mb-1.5 tracking-label uppercase">Alert type</label>
        <div className="flex flex-wrap gap-2">
          {alertTypes.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setAlertType(value)}
              className={`px-4 py-1.5 rounded-pill text-xs font-medium border transition-all ${
                alertType === value
                  ? 'bg-warning-bg text-warning-text border-warning/30'
                  : 'bg-white text-g600 border-[#d0ebe0] hover:border-g400'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <Input
        label="Title"
        value={title}
        onChange={e => setTitle(e.target.value)}
        placeholder="Court closure due to maintenance"
      />

      <div>
        <label className="block text-xs font-medium text-g800 mb-1.5 tracking-label uppercase">Message</label>
        <textarea
          value={message}
          onChange={e => setMessage(e.target.value)}
          rows={3}
          placeholder="Provide details about the alert…"
          className="w-full px-4 py-2.5 rounded-input border border-[#c0ddd0] bg-g50 text-g900 text-sm focus:outline-none focus:border-g400 resize-none"
        />
      </div>

      <div className="text-xs text-g600 bg-g50 rounded-input p-3 border border-[#d0ebe0]">
        <strong>Cascade effect:</strong> {alertType === 'emergency' || alertType === 'maintenance'
          ? 'All confirmed bookings will be cancelled and users notified. Facility will be marked closed.'
          : 'All confirmed bookings will be marked delayed and users notified. Facility will be marked delayed.'}
      </div>

      <Button onClick={handleSubmit} disabled={isPending}>
        {isPending ? 'Posting…' : 'Post alert'}
      </Button>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import type { Alert } from '@/lib/types/database';

interface AlertBarProps {
  alert: Alert | null;
}

const DISMISSED_KEY = 'frost_dismissed_alerts';

export function AlertBar({ alert }: AlertBarProps) {
  const [dismissed, setDismissed] = useState(true); // start hidden to avoid flash

  useEffect(() => {
    if (!alert) return;
    const dismissedList: string[] = JSON.parse(localStorage.getItem(DISMISSED_KEY) ?? '[]');
    if (!dismissedList.includes(alert.id)) {
      setDismissed(false);
    }
  }, [alert]);

  if (!alert || dismissed) return null;

  function dismiss() {
    if (!alert) return;
    const dismissedList: string[] = JSON.parse(localStorage.getItem(DISMISSED_KEY) ?? '[]');
    dismissedList.push(alert.id);
    localStorage.setItem(DISMISSED_KEY, JSON.stringify(dismissedList));
    setDismissed(true);
  }

  const typeLabel: Record<string, string> = {
    weather: 'Weather',
    maintenance: 'Maintenance',
    emergency: 'Emergency',
    operational: 'Operations',
  };

  return (
    <div className="bg-warning-bg border-b border-warning/20 px-4 py-2.5">
      <div className="max-w-6xl mx-auto flex items-start sm:items-center justify-between gap-3">
        <div className="flex items-start sm:items-center gap-2.5 min-w-0">
          <AlertTriangle size={15} className="text-warning flex-shrink-0 mt-0.5 sm:mt-0" />
          <span className="text-xs text-warning-text">
            <span className="font-medium">{typeLabel[alert.alert_type] ?? 'Alert'}:</span>{' '}
            {alert.title} — {alert.message}
          </span>
        </div>
        <button
          onClick={dismiss}
          className="p-1 rounded-full text-warning hover:bg-warning/10 flex-shrink-0 transition-colors"
          aria-label="Dismiss alert"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}

'use client';

import { useState, useTransition } from 'react';
import { AlertTriangle, ToggleLeft } from 'lucide-react';
import { AlertForm } from './AlertForm';
import { deactivateAlert } from '@/app/admin/alerts/actions';
import { Badge } from '@/components/ui/Badge';
import { format, parseISO } from 'date-fns';
import type { Alert, Facility } from '@/lib/types/database';

interface Props {
  alerts: (Alert & { facility: { name: string } | null })[];
  facilities: Facility[];
}

const alertTypeBadge: Record<string, 'delayed' | 'closed' | 'default'> = {
  weather: 'delayed',
  maintenance: 'closed',
  emergency: 'closed',
  operational: 'delayed',
};

export function AlertsPageClient({ alerts: initialAlerts, facilities }: Props) {
  const [alerts, setAlerts] = useState(initialAlerts);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleAlertPosted(affectedCount: number) {
    setSuccessMsg(`Alert posted. ${affectedCount} booking(s) affected and users notified.`);
    setTimeout(() => setSuccessMsg(null), 5000);
  }

  function handleDeactivate(alertId: string, facilityId: string) {
    startTransition(async () => {
      await deactivateAlert(alertId, facilityId);
      setAlerts(prev => prev.filter(a => a.id !== alertId));
    });
  }

  return (
    <div className="p-6 sm:p-8">
      <h1 className="text-2xl font-medium text-g800 tracking-heading mb-6">Alerts</h1>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Post alert form */}
        <div>
          <h2 className="text-base font-medium text-g800 mb-4">Post new alert</h2>
          {successMsg && (
            <div className="mb-4 px-4 py-3 rounded-input bg-success-bg border border-g400/20 text-success text-sm">
              {successMsg}
            </div>
          )}
          <div className="bg-white rounded-card border border-[#d0ebe0] p-5">
            <AlertForm facilities={facilities} onSuccess={handleAlertPosted} />
          </div>
        </div>

        {/* Active alerts */}
        <div>
          <h2 className="text-base font-medium text-g800 mb-4">
            Active alerts ({alerts.length})
          </h2>
          {alerts.length === 0 ? (
            <div className="bg-white rounded-card border border-[#d0ebe0] p-8 text-center text-g600 text-sm">
              No active alerts. Everything is running smoothly.
            </div>
          ) : (
            <div className="space-y-3">
              {alerts.map(alert => (
                <div key={alert.id} className="bg-white rounded-card border border-[#d0ebe0] p-4">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <AlertTriangle size={14} className="text-warning flex-shrink-0" />
                      <p className="text-sm font-medium text-g800 truncate">{alert.title}</p>
                    </div>
                    <Badge variant={alertTypeBadge[alert.alert_type] ?? 'default'} className="flex-shrink-0 text-[10px]">
                      {alert.alert_type}
                    </Badge>
                  </div>
                  <p className="text-xs text-g600 mb-2">{alert.message}</p>
                  <div className="flex items-center justify-between text-[10px] text-g600">
                    <span>{alert.facility?.name} · {format(parseISO(alert.created_at), 'dd MMM, HH:mm')}</span>
                    <button
                      onClick={() => handleDeactivate(alert.id, alert.facility_id)}
                      disabled={isPending}
                      className="flex items-center gap-1 text-g400 hover:text-g600 font-medium transition-colors"
                    >
                      <ToggleLeft size={12} />
                      Deactivate
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

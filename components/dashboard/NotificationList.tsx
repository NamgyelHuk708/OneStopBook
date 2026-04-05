'use client';

import { BellOff } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { useNotifications } from '@/hooks/useNotifications';
import { format, parseISO } from 'date-fns';
import type { NotificationType } from '@/lib/types/database';

const typeIcon: Record<NotificationType, string> = {
  confirmation: '✅',
  reminder_day: '📅',
  reminder_5hr: '⏰',
  disruption: '⚠️',
  reschedule: '🔄',
  credit: '💳',
};

export function NotificationList() {
  const { notifications, loading, markRead } = useNotifications();

  if (loading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-16 skeleton rounded-card" />
        ))}
      </div>
    );
  }

  if (notifications.length === 0) {
    return (
      <div className="py-12 text-center">
        <BellOff size={32} className="mx-auto text-g100 mb-3" />
        <p className="text-g800 font-medium mb-1">No notifications</p>
        <p className="text-sm text-g600">You&apos;re all caught up.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {notifications.map(n => (
        <div
          key={n.id}
          onClick={() => { if (!n.is_read) markRead(n.id); }}
          className={cn(
            'rounded-card border px-4 py-3.5 flex items-start gap-3 cursor-pointer transition-all',
            n.is_read
              ? 'bg-white border-[#d0ebe0]'
              : 'bg-g50 border-g100 hover:border-g400'
          )}
        >
          <span className="text-base flex-shrink-0 mt-0.5">{typeIcon[n.type]}</span>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <p className={cn('text-sm', n.is_read ? 'text-g600' : 'font-medium text-g800')}>
                {n.title}
              </p>
              {!n.is_read && (
                <span className="w-2 h-2 rounded-full bg-g400 flex-shrink-0 mt-1" />
              )}
            </div>
            <p className="text-xs text-g600 mt-0.5 leading-relaxed">{n.message}</p>
            <p className="text-[10px] text-g100 mt-1">
              {format(parseISO(n.created_at), 'dd MMM, HH:mm')}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

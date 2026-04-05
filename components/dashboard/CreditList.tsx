'use client';

import { Wallet } from 'lucide-react';
import { useCredits } from '@/hooks/useCredits';
import { formatCurrency } from '@/lib/utils/formatters';
import { format, parseISO } from 'date-fns';

export function CreditList() {
  const { credits, loading, totalAvailable } = useCredits();

  if (loading) {
    return (
      <div className="space-y-2">
        <div className="h-20 skeleton rounded-card mb-4" />
        {[1, 2, 3].map(i => <div key={i} className="h-14 skeleton rounded-card" />)}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Balance card */}
      <div className="bg-g400 rounded-card p-5 text-g50">
        <div className="flex items-center gap-2 mb-1">
          <Wallet size={16} />
          <span className="text-xs font-medium opacity-80 uppercase tracking-label">Available balance</span>
        </div>
        <p className="text-3xl font-semibold">{formatCurrency(totalAvailable)}</p>
        <p className="text-xs opacity-70 mt-1">Credits are applied automatically at checkout</p>
      </div>

      {credits.length === 0 ? (
        <div className="py-8 text-center text-g600 text-sm">No credits yet.</div>
      ) : (
        <div className="space-y-2">
          {credits.map(credit => (
            <div
              key={credit.id}
              className="bg-white rounded-card border border-[#d0ebe0] px-4 py-3 flex items-center justify-between"
            >
              <div>
                <p className="text-sm font-medium text-g800">{credit.reason ?? 'Credit issued'}</p>
                <p className="text-xs text-g600">{format(parseISO(credit.created_at), 'dd MMM yyyy')}</p>
              </div>
              <div className="text-right">
                <p className={`text-sm font-semibold ${credit.is_used ? 'text-g100 line-through' : 'text-g400'}`}>
                  {formatCurrency(credit.amount)}
                </p>
                {credit.is_used && <p className="text-[10px] text-g100">used</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

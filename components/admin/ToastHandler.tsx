'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';

const messages: Record<string, { message: string; type: 'success' | 'error' }> = {
  added:   { message: 'Service created successfully', type: 'success' },
  updated: { message: 'Service updated successfully', type: 'success' },
};

export function ToastHandler() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const param = searchParams.get('toast');

  useEffect(() => {
    if (!param) return;
    const entry = messages[param];
    if (entry) {
      entry.type === 'success' ? toast.success(entry.message) : toast.error(entry.message);
    }
    // Remove the query param from the URL without re-rendering
    const next = new URLSearchParams(searchParams.toString());
    next.delete('toast');
    const clean = next.toString() ? `?${next}` : window.location.pathname;
    router.replace(clean);
  }, [param]);

  return null;
}

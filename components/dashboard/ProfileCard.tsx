'use client';

import { useState, useTransition } from 'react';
import { User, Mail, Phone, Edit2, Check, X } from 'lucide-react';
import { updateProfile } from '@/app/dashboard/actions';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils/cn';

export function ProfileCard() {
  const { user, profile, loading } = useAuth();
  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  function startEdit() {
    setFullName(profile?.full_name ?? '');
    setPhone(profile?.phone ?? '');
    setError(null);
    setSuccess(false);
    setEditing(true);
  }

  function cancelEdit() {
    setEditing(false);
    setError(null);
  }

  function handleSave() {
    setError(null);
    setSuccess(false);
    startTransition(async () => {
      const result = await updateProfile({ full_name: fullName, phone });
      if (result?.error) {
        setError(result.error);
      } else {
        setSuccess(true);
        setEditing(false);
        // Refresh the page to reload useAuth profile data
        window.location.reload();
      }
    });
  }

  const initials = profile?.full_name
    ? profile.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : user?.email?.slice(0, 2).toUpperCase() ?? '?';

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-20 bg-g50 rounded-card animate-pulse" />
        <div className="h-12 bg-g50 rounded-card animate-pulse" />
        <div className="h-12 bg-g50 rounded-card animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Avatar + name row */}
      <div className="bg-white rounded-card border border-[#d0ebe0] p-5 flex items-center gap-4">
        <div className="w-14 h-14 rounded-full bg-g400 text-g50 text-lg font-medium flex items-center justify-center flex-shrink-0">
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-base font-medium text-g800 truncate">
            {profile?.full_name ?? 'No name set'}
          </p>
          <p className="text-xs text-g600 truncate mt-0.5">{user?.email}</p>
        </div>
        {!editing && (
          <button
            type="button"
            onClick={startEdit}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] text-xs font-medium text-g400 border border-g400/30 hover:bg-g400/5 transition-colors flex-shrink-0"
          >
            <Edit2 size={13} />
            Edit
          </button>
        )}
      </div>

      {/* Edit form */}
      {editing ? (
        <div className="bg-white rounded-card border border-[#d0ebe0] p-5 space-y-4">
          <h2 className="text-sm font-medium text-g800">Edit profile</h2>

          <div>
            <label className="block text-xs font-medium text-g800 mb-1.5 tracking-label uppercase">
              Full name
            </label>
            <input
              type="text"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              placeholder="Your name"
              className="w-full px-4 py-2.5 rounded-input border-input bg-g50 text-g900 text-sm placeholder:text-g200 focus:outline-none focus:border-g400 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-g800 mb-1.5 tracking-label uppercase">
              Phone number
            </label>
            <input
              type="tel"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="+975 17 000 000"
              className="w-full px-4 py-2.5 rounded-input border-input bg-g50 text-g900 text-sm placeholder:text-g200 focus:outline-none focus:border-g400 transition-colors"
            />
          </div>

          {error && (
            <div className="px-4 py-3 rounded-input bg-danger-bg border border-danger-DEFAULT text-danger-DEFAULT text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={handleSave}
              disabled={isPending}
              className={cn(
                'flex items-center gap-1.5 px-4 py-2 rounded-pill text-sm font-medium transition-colors',
                'bg-g400 text-g50 hover:bg-g600 disabled:opacity-60'
              )}
            >
              <Check size={14} />
              {isPending ? 'Saving…' : 'Save changes'}
            </button>
            <button
              type="button"
              onClick={cancelEdit}
              disabled={isPending}
              className="flex items-center gap-1.5 px-4 py-2 rounded-pill text-sm font-medium text-g600 border border-[#d0ebe0] hover:bg-g50 transition-colors"
            >
              <X size={14} />
              Cancel
            </button>
          </div>
        </div>
      ) : (
        /* Read-only info cards */
        <div className="space-y-3">
          <div className="bg-white rounded-card border border-[#d0ebe0] p-4 flex items-center gap-3">
            <User size={15} className="text-g400 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-[10px] text-g600 uppercase tracking-label font-medium">Full name</p>
              <p className="text-sm text-g800 mt-0.5">{profile?.full_name ?? '—'}</p>
            </div>
          </div>

          <div className="bg-white rounded-card border border-[#d0ebe0] p-4 flex items-center gap-3">
            <Mail size={15} className="text-g400 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-[10px] text-g600 uppercase tracking-label font-medium">Email</p>
              <p className="text-sm text-g800 mt-0.5 truncate">{user?.email}</p>
            </div>
          </div>

          <div className="bg-white rounded-card border border-[#d0ebe0] p-4 flex items-center gap-3">
            <Phone size={15} className="text-g400 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-[10px] text-g600 uppercase tracking-label font-medium">Phone</p>
              <p className="text-sm text-g800 mt-0.5">{profile?.phone ?? '—'}</p>
            </div>
          </div>
        </div>
      )}

      {success && !editing && (
        <div className="px-4 py-3 rounded-input bg-g400/10 border border-g400/20 text-g600 text-sm">
          Profile updated successfully.
        </div>
      )}
    </div>
  );
}

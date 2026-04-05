'use client';

import { useState, useTransition } from 'react';
import { signIn, signUp } from './actions';

type Tab = 'signin' | 'signup';

export default function LoginPage() {
  const [tab, setTab] = useState<Tab>('signin');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = tab === 'signin'
        ? await signIn(formData)
        : await signUp(formData);
      if (result?.error) setError(result.error);
    });
  }

  return (
    <div className="min-h-screen bg-g50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <span className="text-3xl font-semibold tracking-heading text-g900">
            onestop<span className="text-g400">book</span>
          </span>
          <p className="mt-2 text-g600 text-sm">
            {tab === 'signin' ? 'Welcome back' : 'Create your account'}
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-card border-card p-8">
          {/* Tab toggle */}
          <div className="flex rounded-input border border-[#c0ddd0] p-1 mb-6 bg-g50">
            <button
              onClick={() => { setTab('signin'); setError(null); }}
              className={`flex-1 py-2 text-sm font-medium rounded-[8px] transition-all ${
                tab === 'signin'
                  ? 'bg-g400 text-g50'
                  : 'text-g600 hover:text-g800'
              }`}
            >
              Sign in
            </button>
            <button
              onClick={() => { setTab('signup'); setError(null); }}
              className={`flex-1 py-2 text-sm font-medium rounded-[8px] transition-all ${
                tab === 'signup'
                  ? 'bg-g400 text-g50'
                  : 'text-g600 hover:text-g800'
              }`}
            >
              Sign up
            </button>
          </div>

          {/* Form */}
          <form action={handleSubmit} className="space-y-4">
            {tab === 'signup' && (
              <div>
                <label className="block text-xs font-medium text-g800 mb-1.5 tracking-label uppercase">
                  Full name
                </label>
                <input
                  name="full_name"
                  type="text"
                  required
                  placeholder="Tenzin Wangchuk"
                  className="w-full px-4 py-2.5 rounded-input border-input bg-g50 text-g900 text-sm placeholder:text-g200 focus:outline-none focus:border-g400 transition-colors"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-g800 mb-1.5 tracking-label uppercase">
                Email
              </label>
              <input
                name="email"
                type="email"
                required
                placeholder="you@example.com"
                className="w-full px-4 py-2.5 rounded-input border-input bg-g50 text-g900 text-sm placeholder:text-g200 focus:outline-none focus:border-g400 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-g800 mb-1.5 tracking-label uppercase">
                Password
              </label>
              <input
                name="password"
                type="password"
                required
                minLength={6}
                placeholder="••••••••"
                className="w-full px-4 py-2.5 rounded-input border-input bg-g50 text-g900 text-sm placeholder:text-g200 focus:outline-none focus:border-g400 transition-colors"
              />
            </div>

            {error && (
              <div className="px-4 py-3 rounded-input bg-danger-bg border border-danger-DEFAULT text-danger-DEFAULT text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isPending}
              className="w-full mt-2 py-3 rounded-pill bg-g400 text-g50 text-sm font-medium hover:bg-g600 disabled:opacity-60 transition-colors"
            >
              {isPending
                ? 'Please wait…'
                : tab === 'signin'
                ? 'Sign in'
                : 'Create account'}
            </button>
          </form>
        </div>

        <p className="text-center mt-6 text-xs text-g600">
          By continuing you agree to OneStopBook&apos;s terms of service.
        </p>
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';

export function AuthForm({ mode, demo }: { mode: 'login' | 'signup'; demo: boolean }) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const title = mode === 'login' ? 'Log in' : 'Create your account';

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      );
      const result =
        mode === 'login'
          ? await supabase.auth.signInWithPassword({ email, password })
          : await supabase.auth.signUp({ email, password, options: { data: { name } } });
      if (result.error) {
        setError(result.error.message);
      } else {
        router.push(mode === 'signup' ? '/onboarding' : '/dashboard');
        router.refresh();
      }
    } catch {
      setError('Authentication is unavailable right now.');
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mx-auto mt-20 w-full max-w-sm px-4">
      <Link href="/" className="flex items-center justify-center gap-2 font-semibold">
        <span className="flex h-6 w-6 items-center justify-center rounded bg-brand text-xs font-bold text-white">JS</span>
        JobSignal
      </Link>
      <h1 className="mt-6 text-center text-xl font-bold tracking-tight">{title}</h1>

      {demo ? (
        <div className="mt-6 rounded-xl border border-line bg-surface p-5 text-center">
          <p className="text-sm text-ink-2">
            This deployment is running in <strong>demo mode</strong> — no Supabase is configured, so
            accounts are disabled and a demo identity with seeded data is active.
          </p>
          <Link
            href={mode === 'signup' ? '/onboarding' : '/dashboard'}
            className="mt-4 inline-block rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-strong"
          >
            Continue in demo mode
          </Link>
        </div>
      ) : (
        <form onSubmit={submit} className="mt-6 rounded-xl border border-line bg-surface p-5">
          {mode === 'signup' && (
            <label className="block text-sm">
              <span className="text-xs font-medium text-ink-2">Name</span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="mt-1 w-full rounded-md border border-line px-3 py-1.5 text-sm outline-none focus:border-brand"
              />
            </label>
          )}
          <label className="mt-3 block text-sm">
            <span className="text-xs font-medium text-ink-2">Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1 w-full rounded-md border border-line px-3 py-1.5 text-sm outline-none focus:border-brand"
            />
          </label>
          <label className="mt-3 block text-sm">
            <span className="text-xs font-medium text-ink-2">Password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              className="mt-1 w-full rounded-md border border-line px-3 py-1.5 text-sm outline-none focus:border-brand"
            />
          </label>
          {error && <p className="mt-3 text-sm text-bad">{error}</p>}
          <button
            type="submit"
            disabled={pending}
            className="mt-4 w-full rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-strong disabled:opacity-50"
          >
            {pending ? 'Working…' : title}
          </button>
        </form>
      )}

      <p className="mt-4 text-center text-sm text-ink-3">
        {mode === 'login' ? (
          <>
            No account?{' '}
            <Link href="/signup" className="font-medium text-brand hover:underline">
              Sign up
            </Link>
          </>
        ) : (
          <>
            Already registered?{' '}
            <Link href="/login" className="font-medium text-brand hover:underline">
              Log in
            </Link>
          </>
        )}
      </p>
    </div>
  );
}

'use client';

import { useState, useTransition } from 'react';
import { updateProfile, uploadResumeText } from '@/app/actions';
import type { RemotePreference, UserProfile } from '@/lib/types';

const inputCls =
  'mt-1 w-full rounded-md border border-line bg-surface px-3 py-1.5 text-sm outline-none focus:border-brand';

export function ProfileForm({ profile }: { profile: UserProfile | null }) {
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({
    current_title: profile?.current_title ?? '',
    desired_titles: (profile?.desired_titles ?? []).join(', '),
    seniority: profile?.seniority ?? '',
    preferred_locations: (profile?.preferred_locations ?? []).join(', '),
    remote_preference: (profile?.remote_preference ?? 'flexible') as RemotePreference,
    salary_min: profile?.salary_min?.toString() ?? '',
    industries: (profile?.industries ?? []).join(', '),
    skills: (profile?.skills ?? []).join(', '),
    years_experience: profile?.years_experience?.toString() ?? '',
    linkedin_url: profile?.linkedin_url ?? '',
    portfolio_url: profile?.portfolio_url ?? '',
  });

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setSaved(false);
    setForm((f) => ({ ...f, [key]: e.target.value }));
  };
  const list = (s: string) => s.split(',').map((x) => x.trim()).filter(Boolean);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        startTransition(async () => {
          await updateProfile({
            current_title: form.current_title || null,
            desired_titles: list(form.desired_titles),
            seniority: form.seniority || null,
            preferred_locations: list(form.preferred_locations),
            remote_preference: form.remote_preference,
            salary_min: form.salary_min ? Number(form.salary_min) : null,
            industries: list(form.industries),
            skills: list(form.skills),
            years_experience: form.years_experience ? Number(form.years_experience) : null,
            linkedin_url: form.linkedin_url || null,
            portfolio_url: form.portfolio_url || null,
          });
          setSaved(true);
        });
      }}
      className="rounded-xl border border-line bg-surface p-5"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="text-xs font-medium text-ink-2">Current title</span>
          <input className={inputCls} value={form.current_title} onChange={set('current_title')} />
        </label>
        <label className="block text-sm">
          <span className="text-xs font-medium text-ink-2">Seniority</span>
          <select className={inputCls} value={form.seniority} onChange={set('seniority')}>
            <option value="">—</option>
            {['associate', 'mid', 'senior', 'lead', 'manager', 'director', 'vice president'].map((s) => (
              <option key={s} value={s} className="capitalize">
                {s}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm sm:col-span-2">
          <span className="text-xs font-medium text-ink-2">Target titles (comma-separated)</span>
          <input className={inputCls} value={form.desired_titles} onChange={set('desired_titles')} />
        </label>
        <label className="block text-sm sm:col-span-2">
          <span className="text-xs font-medium text-ink-2">Skills (comma-separated)</span>
          <input className={inputCls} value={form.skills} onChange={set('skills')} />
        </label>
        <label className="block text-sm">
          <span className="text-xs font-medium text-ink-2">Preferred locations</span>
          <input className={inputCls} value={form.preferred_locations} onChange={set('preferred_locations')} />
        </label>
        <label className="block text-sm">
          <span className="text-xs font-medium text-ink-2">Work style</span>
          <select className={inputCls} value={form.remote_preference} onChange={set('remote_preference')}>
            {(['remote', 'hybrid', 'onsite', 'flexible'] as const).map((r) => (
              <option key={r} value={r} className="capitalize">
                {r}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          <span className="text-xs font-medium text-ink-2">Minimum salary (USD)</span>
          <input className={inputCls} type="number" value={form.salary_min} onChange={set('salary_min')} />
        </label>
        <label className="block text-sm">
          <span className="text-xs font-medium text-ink-2">Years of experience</span>
          <input className={inputCls} type="number" value={form.years_experience} onChange={set('years_experience')} />
        </label>
        <label className="block text-sm">
          <span className="text-xs font-medium text-ink-2">Industries</span>
          <input className={inputCls} value={form.industries} onChange={set('industries')} />
        </label>
        <label className="block text-sm">
          <span className="text-xs font-medium text-ink-2">LinkedIn URL (optional)</span>
          <input className={inputCls} value={form.linkedin_url} onChange={set('linkedin_url')} />
        </label>
      </div>
      <div className="mt-4 flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-brand px-4 py-1.5 text-sm font-medium text-white hover:bg-brand-strong disabled:opacity-50"
        >
          {pending ? 'Saving…' : 'Save profile'}
        </button>
        {saved && <span className="text-sm text-good">Saved — match scores recomputed.</span>}
      </div>
    </form>
  );
}

export function ResumeUpload({ hasResume }: { hasResume: boolean }) {
  const [pending, startTransition] = useTransition();
  const [text, setText] = useState('');
  const [result, setResult] = useState<string[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="rounded-xl border border-line bg-surface p-5">
      <h2 className="font-semibold">Resume</h2>
      <p className="mt-1 text-xs text-ink-3">
        Paste your resume text (or upload a .txt file). It is parsed into structured skills and kept
        private to your account — never shared, never sold.
      </p>
      {hasResume && !result && (
        <p className="mt-2 text-sm text-good">A resume is on file and feeding your match scores.</p>
      )}
      <input
        type="file"
        accept=".txt,.md,text/plain"
        className="mt-3 block text-sm text-ink-2"
        onChange={async (e) => {
          const file = e.target.files?.[0];
          if (file) setText(await file.text());
        }}
      />
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={6}
        placeholder="Paste resume text here…"
        className="mt-3 w-full rounded-md border border-line bg-surface p-3 text-sm outline-none focus:border-brand"
      />
      <div className="mt-3 flex items-center gap-3">
        <button
          onClick={() =>
            startTransition(async () => {
              setError(null);
              try {
                const res = await uploadResumeText(text);
                setResult(res.skills);
              } catch (err) {
                setError(err instanceof Error ? err.message : 'Upload failed');
              }
            })
          }
          disabled={pending || text.trim().length < 50}
          className="rounded-md border border-line bg-surface px-4 py-1.5 text-sm font-medium text-ink-2 hover:border-line-strong disabled:opacity-50"
        >
          {pending ? 'Parsing…' : 'Parse resume'}
        </button>
        {error && <span className="text-sm text-bad">{error}</span>}
      </div>
      {result && (
        <p className="mt-3 text-sm text-ink-2">
          <span className="font-medium text-good">Extracted skills:</span> {result.join(', ') || 'none detected'}
        </p>
      )}
    </div>
  );
}

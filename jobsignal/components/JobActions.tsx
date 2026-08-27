'use client';

import { useState, useTransition } from 'react';
import {
  generateOutreachAction,
  setApplicationStatus,
  submitFeedback,
  verifyJobNow,
} from '@/app/actions';
import type { ApplicationStatus, Contact } from '@/lib/types';
import type { OutreachTone } from '@/lib/ai/tasks';

export function VerifyButton({ jobId }: { jobId: string }) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  return (
    <div>
      <button
        onClick={() =>
          startTransition(async () => {
            const result = await verifyJobNow(jobId);
            setMessage(result.message);
          })
        }
        disabled={pending}
        className="rounded-md border border-line bg-surface px-4 py-1.5 text-sm font-medium text-ink-2 hover:border-line-strong disabled:opacity-50"
      >
        {pending ? 'Verifying…' : 'Verify Job'}
      </button>
      {message && <p className="mt-1.5 text-xs text-ink-3">{message}</p>}
    </div>
  );
}

const STATUSES: ApplicationStatus[] = ['saved', 'contacted', 'applied', 'interview', 'followup', 'rejected', 'offer'];

export function SaveMenu({ jobId, current }: { jobId: string; current: ApplicationStatus | null }) {
  const [pending, startTransition] = useTransition();
  const [status, setStatus] = useState<ApplicationStatus | ''>(current ?? '');
  return (
    <select
      value={status}
      disabled={pending}
      onChange={(e) => {
        const next = e.target.value as ApplicationStatus;
        setStatus(next);
        startTransition(() => setApplicationStatus(jobId, next));
      }}
      className="rounded-md border border-line bg-surface px-3 py-1.5 text-sm font-medium text-ink-2 outline-none hover:border-line-strong"
    >
      <option value="" disabled>
        Save / track…
      </option>
      {STATUSES.map((s) => (
        <option key={s} value={s} className="capitalize">
          {s === 'followup' ? 'follow-up' : s}
        </option>
      ))}
    </select>
  );
}

const FEEDBACK: Array<[string, string]> = [
  ['applied', 'I applied'],
  ['recruiter_responded', 'Recruiter responded'],
  ['interview_scheduled', 'Interview scheduled'],
  ['already_filled', 'Job already filled'],
  ['position_frozen', 'Company said position frozen'],
  ['rejected', 'Application rejected'],
  ['link_broken', 'Job link broken'],
  ['posting_disappeared', 'Posting disappeared'],
];

export function FeedbackMenu({ jobId }: { jobId: string }) {
  const [pending, startTransition] = useTransition();
  const [sent, setSent] = useState(false);
  if (sent)
    return <p className="text-xs text-good">Thanks — your report feeds future confidence scoring.</p>;
  return (
    <select
      defaultValue=""
      disabled={pending}
      onChange={(e) => {
        const kind = e.target.value;
        if (!kind) return;
        startTransition(async () => {
          await submitFeedback(jobId, kind);
          setSent(true);
        });
      }}
      className="rounded-md border border-line bg-surface px-3 py-1.5 text-xs text-ink-2 outline-none hover:border-line-strong"
    >
      <option value="" disabled>
        Report what happened…
      </option>
      {FEEDBACK.map(([value, label]) => (
        <option key={value} value={value}>
          {label}
        </option>
      ))}
    </select>
  );
}

const TONES: OutreachTone[] = ['direct', 'conversational', 'executive', 'recruiter', 'networking'];

export function OutreachPanel({ jobId, contacts }: { jobId: string; contacts: Contact[] }) {
  const [pending, startTransition] = useTransition();
  const [contactId, setContactId] = useState(contacts[0]?.id ?? '');
  const [tone, setTone] = useState<OutreachTone>('direct');
  const [draft, setDraft] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (contacts.length === 0) return null;

  return (
    <div className="mt-4 rounded-lg border border-line bg-canvas p-4">
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={contactId}
          onChange={(e) => setContactId(e.target.value)}
          className="rounded-md border border-line bg-surface px-3 py-1.5 text-sm outline-none"
        >
          {contacts.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} — {c.title}
            </option>
          ))}
        </select>
        <select
          value={tone}
          onChange={(e) => setTone(e.target.value as OutreachTone)}
          className="rounded-md border border-line bg-surface px-3 py-1.5 text-sm capitalize outline-none"
        >
          {TONES.map((t) => (
            <option key={t} value={t} className="capitalize">
              {t}
            </option>
          ))}
        </select>
        <button
          onClick={() =>
            startTransition(async () => {
              setError(null);
              const result = await generateOutreachAction(jobId, contactId, tone);
              if (result.ok) setDraft(result.message);
              else setError(result.message);
            })
          }
          disabled={pending || !contactId}
          className="rounded-md bg-brand px-4 py-1.5 text-sm font-medium text-white hover:bg-brand-strong disabled:opacity-50"
        >
          {pending ? 'Drafting…' : 'Generate Outreach'}
        </button>
      </div>
      {error && <p className="mt-2 text-xs text-bad">{error}</p>}
      {draft && (
        <blockquote className="mt-3 whitespace-pre-wrap rounded-md border border-line bg-surface p-4 text-sm leading-relaxed">
          {draft}
        </blockquote>
      )}
    </div>
  );
}

import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { AppShell } from '@/components/AppShell';
import { ConfidenceBadge, MatchBadge, StatusPill, VerifiedBadge } from '@/components/ui/badges';
import { FeedbackMenu, OutreachPanel, SaveMenu, VerifyButton } from '@/components/JobActions';
import { getCurrentUser } from '@/lib/auth';
import { getStore } from '@/lib/db';
import { analyzeGhostSignals } from '@/lib/ghost/detect';
import { matchJob } from '@/lib/match/engine';
import { explainScore } from '@/lib/ai/tasks';
import { BASELINE_SCORE } from '@/lib/config/scoring';
import { daysAgo, formatSalary, relativeTime } from '@/lib/utils';

export const dynamic = 'force-dynamic';

const EVENT_LABELS: Record<string, string> = {
  first_seen: 'First seen',
  verified: 'Verified',
  description_changed: 'Job description updated',
  reposted: 'Reposted',
  removed: 'Removed from source',
  reappeared: 'Reappeared',
  salary_changed: 'Salary changed',
  closed: 'Closed',
  score_changed: 'Score changed',
};

export default async function JobIntelligencePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  const { id } = await params;

  const store = getStore();
  const bundle = await store.getJob(id);
  if (!bundle) notFound();

  const { job, company, score, verifications, events, contacts } = bundle;
  const [profile, application] = await Promise.all([
    store.getProfile(user.id),
    store.getApplication(user.id, job.id),
  ]);
  const match = profile ? matchJob(profile, job) : null;
  const ghost = analyzeGhostSignals(job, events);
  const salary = formatSalary(job.salary_min, job.salary_max);
  const explanation = score ? await explainScore(job, score, company.name) : null;

  const positives = score?.signals.filter((s) => s.points > 0) ?? [];
  const negatives = score?.signals.filter((s) => s.points < 0) ?? [];

  // Best application source: employer ATS/career page beats aggregators.
  const applyUrl = job.application_url ?? job.source_url;

  return (
    <AppShell active="/jobs" demo={user.isDemo}>
      <Link href="/jobs" className="text-sm text-ink-3 hover:text-ink-2">
        ← Back to search
      </Link>

      <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{job.title}</h1>
          <p className="mt-1 text-ink-2">
            <Link href={`/companies/${company.id}`} className="font-medium hover:text-brand">
              {company.name}
            </Link>
            {job.location && <span className="text-ink-3"> · {job.location}</span>}
            {salary && <span className="num text-ink-3"> · {salary}</span>}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <StatusPill status={job.status} />
            <VerifiedBadge verifiedAt={job.last_verified_at} />
            <span className="num text-xs text-ink-3">
              originally detected {ghost.trueAgeDays} day{ghost.trueAgeDays === 1 ? '' : 's'} ago
            </span>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {score && <ConfidenceBadge score={score.overall_score} size="lg" />}
          {match && <MatchBadge score={match.score} size="lg" />}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {applyUrl && (
          <a
            href={applyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-md bg-brand px-4 py-1.5 text-sm font-medium text-white hover:bg-brand-strong"
          >
            Apply Direct{job.source === 'greenhouse' || job.source === 'lever' ? ' (employer ATS)' : ''}
          </a>
        )}
        <VerifyButton jobId={job.id} />
        <SaveMenu jobId={job.id} current={application?.status ?? null} />
        <div className="ml-auto">
          <FeedbackMenu jobId={job.id} />
        </div>
      </div>

      {ghost.ageDiscrepancy && (
        <div className="mt-4 rounded-lg border border-warn-line bg-warn-soft p-3 text-sm text-warn">
          Source claims this was posted {ghost.claimedAgeDays} day
          {ghost.claimedAgeDays === 1 ? '' : 's'} ago — JobSignal first detected it{' '}
          <strong className="num">{ghost.trueAgeDays} days ago</strong>. Reposting never resets our
          record.
        </div>
      )}

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <section className="rounded-xl border border-line bg-surface p-5">
          <h2 className="font-semibold">Why We Think This Job {positives.length >= negatives.length ? 'Is Active' : 'May Not Be Active'}</h2>
          {positives.length === 0 ? (
            <p className="mt-2 text-sm text-ink-3">No positive verification signals on record yet.</p>
          ) : (
            <ul className="mt-3 space-y-2 text-sm">
              {positives.map((s) => (
                <li key={s.key} className="flex gap-2 text-ink-2">
                  <span className="text-good">✓</span> {s.label}
                </li>
              ))}
            </ul>
          )}
          <h3 className="mt-5 font-semibold">Potential Concerns</h3>
          {negatives.length === 0 && ghost.flags.length === 0 ? (
            <p className="mt-2 text-sm text-ink-3">No negative signals detected.</p>
          ) : (
            <ul className="mt-3 space-y-2 text-sm">
              {negatives.map((s) => (
                <li key={s.key} className="flex gap-2 text-ink-2">
                  <span className="text-warn">⚠</span> {s.label}
                </li>
              ))}
              {ghost.flags.map((f) => (
                <li key={f} className="flex gap-2 text-ink-2">
                  <span className="text-warn">⚠</span> {f}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-xl border border-line bg-surface p-5">
          <h2 className="font-semibold">
            Why {score?.overall_score ?? '—'}?
            <span className="ml-2 text-xs font-normal text-ink-3">every score is explainable</span>
          </h2>
          {score ? (
            <div className="mt-3">
              <table className="w-full text-sm">
                <tbody>
                  <tr className="border-b border-line text-ink-3">
                    <td className="py-1.5">Baseline</td>
                    <td className="num py-1.5 text-right">{BASELINE_SCORE}</td>
                  </tr>
                  {score.signals.map((s) => (
                    <tr key={s.key} className="border-b border-line last:border-0">
                      <td className="py-1.5 pr-3 text-ink-2">{s.label}</td>
                      <td
                        className={`num py-1.5 text-right font-medium ${s.points > 0 ? 'text-good' : 'text-bad'}`}
                      >
                        {s.points > 0 ? '+' : ''}
                        {s.points}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-line-strong font-semibold">
                    <td className="py-2">Final</td>
                    <td className="num py-2 text-right">{score.overall_score} / 100</td>
                  </tr>
                </tfoot>
              </table>
              {explanation && (
                <p className="mt-3 rounded-md bg-canvas p-3 text-sm leading-relaxed text-ink-2">
                  {explanation}
                </p>
              )}
            </div>
          ) : (
            <p className="mt-2 text-sm text-ink-3">Not yet scored.</p>
          )}
        </section>

        {match && (
          <section className="rounded-xl border border-line bg-surface p-5">
            <h2 className="font-semibold">
              Candidate Match — <span className="num">{match.score}%</span>
            </h2>
            <p className="mt-1 text-xs text-ink-3">
              Match measures fit only. Job Confidence measures the listing. A 94% match at a 29%
              confidence job is still a questionable job.
            </p>
            <h3 className="mt-4 text-sm font-semibold text-good">Strong Matches</h3>
            <ul className="mt-1.5 space-y-1 text-sm text-ink-2">
              {match.strong_matches.length === 0 ? (
                <li className="text-ink-3">None identified.</li>
              ) : (
                match.strong_matches.map((m) => <li key={m}>• {m}</li>)
              )}
            </ul>
            <h3 className="mt-4 text-sm font-semibold text-warn">Missing or Weak</h3>
            <ul className="mt-1.5 space-y-1 text-sm text-ink-2">
              {match.weak_or_missing.length === 0 ? (
                <li className="text-ink-3">No notable gaps identified.</li>
              ) : (
                match.weak_or_missing.map((m) => <li key={m}>• {m}</li>)
              )}
            </ul>
          </section>
        )}

        <section className="rounded-xl border border-line bg-surface p-5">
          <h2 className="font-semibold">Job History</h2>
          <p className="mt-1 text-xs text-ink-3">
            JobSignal remembers what happened before — reposting never erases it.
          </p>
          <ol className="mt-3 space-y-0">
            {events.map((e) => (
              <li key={e.id} className="relative border-l border-line pb-3 pl-4 last:pb-0">
                <span
                  className={`absolute -left-[3.5px] top-1.5 h-1.5 w-1.5 rounded-full ${
                    e.kind === 'removed' || e.kind === 'closed'
                      ? 'bg-bad'
                      : e.kind === 'reposted' || e.kind === 'reappeared'
                        ? 'bg-warn'
                        : 'bg-good'
                  }`}
                />
                <div className="text-sm font-medium">{EVENT_LABELS[e.kind] ?? e.kind}</div>
                <div className="text-xs text-ink-3">
                  {new Date(e.occurred_at).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                  })}{' '}
                  · {relativeTime(e.occurred_at)}
                  {e.detail ? ` — ${e.detail}` : ''}
                </div>
              </li>
            ))}
          </ol>
          {verifications.length > 0 && (
            <p className="num mt-3 border-t border-line pt-3 text-xs text-ink-3">
              {verifications.length} verification event{verifications.length === 1 ? '' : 's'} on
              record · latest {relativeTime(verifications[0].checked_at)}
            </p>
          )}
        </section>
      </div>

      <section className="mt-4 rounded-xl border border-line bg-surface p-5">
        <h2 className="font-semibold">People Worth Contacting</h2>
        <p className="mt-1 text-xs text-ink-3">
          Publicly listed professional roles only — reach the team instead of the queue.
        </p>
        {contacts.length === 0 ? (
          <p className="mt-3 text-sm text-ink-3">No public stakeholders identified yet for {company.name}.</p>
        ) : (
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {contacts.map((c) => (
              <div key={c.id} className="rounded-lg border border-line bg-canvas p-4">
                <div className="font-medium">{c.name}</div>
                <div className="text-sm text-ink-2">{c.title}</div>
                <div className="mt-1 text-xs font-medium capitalize text-brand">
                  {c.relationship_type.replace(/_/g, ' ')}
                </div>
                {c.reason && <p className="mt-1 text-xs text-ink-3">“{c.reason}”</p>}
              </div>
            ))}
          </div>
        )}
        <OutreachPanel jobId={job.id} contacts={contacts} />
      </section>

      <section className="mt-4 rounded-xl border border-line bg-surface p-5">
        <h2 className="font-semibold">Description</h2>
        <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-ink-2">{job.description}</p>
        <p className="num mt-4 border-t border-line pt-3 text-xs text-ink-3">
          source: {job.source} · first seen {daysAgo(job.first_seen_at)}d ago · last seen{' '}
          {daysAgo(job.last_seen_at)}d ago
          {job.repost_count > 0 ? ` · reposted ×${job.repost_count}` : ''}
        </p>
      </section>
    </AppShell>
  );
}

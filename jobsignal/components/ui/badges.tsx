import { confidenceLabel } from '@/lib/config/scoring';
import { relativeTime } from '@/lib/utils';

/** Colored 0–100 Job Confidence pill. Color encodes the band, always. */
export function ConfidenceBadge({ score, size = 'md' }: { score: number; size?: 'md' | 'lg' }) {
  const band = confidenceLabel(score);
  const tone =
    band.tone === 'positive'
      ? 'bg-good-soft text-good border-good-line'
      : band.tone === 'caution'
        ? 'bg-warn-soft text-warn border-warn-line'
        : 'bg-bad-soft text-bad border-bad-line';
  if (size === 'lg') {
    return (
      <div className={`inline-flex items-center gap-3 rounded-lg border px-4 py-2.5 ${tone}`}>
        <span className="num text-3xl font-semibold">{score}</span>
        <div className="leading-tight">
          <div className="text-[11px] font-medium uppercase tracking-wide opacity-70">Job Confidence</div>
          <div className="text-sm font-semibold">{band.label}</div>
        </div>
      </div>
    );
  }
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-semibold ${tone}`}
      title={`Job Confidence: ${score}/100 — ${band.label}`}
    >
      <span className="num text-sm">{score}</span>
      <span className="hidden sm:inline">{band.label}</span>
    </span>
  );
}

export function MatchBadge({ score, size = 'md' }: { score: number; size?: 'md' | 'lg' }) {
  const label = score >= 80 ? 'Strong Match' : score >= 60 ? 'Good Match' : score >= 40 ? 'Partial Match' : 'Weak Match';
  const tone =
    score >= 80
      ? 'bg-brand-soft text-brand border-brand/20'
      : score >= 60
        ? 'bg-surface-2 text-ink-2 border-line'
        : 'bg-surface-2 text-ink-3 border-line';
  if (size === 'lg') {
    return (
      <div className={`inline-flex items-center gap-3 rounded-lg border px-4 py-2.5 ${tone}`}>
        <span className="num text-3xl font-semibold">{score}%</span>
        <div className="leading-tight">
          <div className="text-[11px] font-medium uppercase tracking-wide opacity-70">Candidate Match</div>
          <div className="text-sm font-semibold">{label}</div>
        </div>
      </div>
    );
  }
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-semibold ${tone}`}
      title={`Candidate Match: ${score}% — ${label}`}
    >
      <span className="num text-sm">{score}%</span>
      <span className="hidden sm:inline">match</span>
    </span>
  );
}

/** "Verified 43 minutes ago" chip — only shown when actually verified. */
export function VerifiedBadge({ verifiedAt, freshHours = 72 }: { verifiedAt: string | null; freshHours?: number }) {
  if (!verifiedAt) {
    return (
      <span className="inline-flex items-center rounded-md border border-line bg-surface-2 px-2 py-0.5 text-xs text-ink-3">
        Not yet verified
      </span>
    );
  }
  const hours = (Date.now() - new Date(verifiedAt).getTime()) / 3_600_000;
  const fresh = hours <= freshHours;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium ${
        fresh ? 'border-good-line bg-good-soft text-good' : 'border-line bg-surface-2 text-ink-2'
      }`}
    >
      {fresh && (
        <svg viewBox="0 0 12 12" className="h-3 w-3 fill-current" aria-hidden>
          <path d="M6 0a6 6 0 100 12A6 6 0 006 0zm2.7 4.9L5.6 8a.75.75 0 01-1.1 0L3.3 6.8a.75.75 0 111.1-1L5 6.4l2.6-2.5a.75.75 0 011.1 1z" />
        </svg>
      )}
      Verified {relativeTime(verifiedAt)}
    </span>
  );
}

export function StatusPill({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    active: { label: 'Active', cls: 'bg-good-soft text-good border-good-line' },
    stale: { label: 'Stale', cls: 'bg-warn-soft text-warn border-warn-line' },
    closed: { label: 'Closed', cls: 'bg-surface-2 text-ink-3 border-line' },
    ghost_suspect: { label: 'Ghost suspect', cls: 'bg-bad-soft text-bad border-bad-line' },
    unknown: { label: 'Unknown', cls: 'bg-surface-2 text-ink-3 border-line' },
  };
  const item = map[status] ?? map.unknown;
  return (
    <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${item.cls}`}>
      {item.label}
    </span>
  );
}

import Link from 'next/link';
import { ConfidenceBadge, MatchBadge } from '@/components/ui/badges';

const STEPS = [
  ['Discover', 'Jobs are ingested from employer ATS feeds and career sites — not scraped from job boards.'],
  ['Verify', 'Every listing is re-checked against its employer source. History is recorded, never overwritten.'],
  ['Score', 'A deterministic engine turns the evidence into a 0–100 Job Confidence Score. AI explains it — it never invents it.'],
  ['Prioritize', 'Candidate Match is scored separately, so a great fit at a questionable job never hides.'],
  ['Reach out', 'Find likely hiring stakeholders and generate direct, specific outreach — instead of vanishing into an ATS queue.'],
] as const;

export default function LandingPage() {
  return (
    <div>
      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <span className="flex items-center gap-2 font-semibold tracking-tight">
            <span className="flex h-6 w-6 items-center justify-center rounded bg-brand text-xs font-bold text-white">JS</span>
            JobSignal
          </span>
          <nav className="flex items-center gap-3 text-sm">
            <Link href="/login" className="rounded-md px-3 py-1.5 text-ink-2 hover:text-ink">
              Log in
            </Link>
            <Link
              href="/signup"
              className="rounded-md bg-brand px-3 py-1.5 font-medium text-white hover:bg-brand-strong"
            >
              Sign up
            </Link>
          </nav>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-4 pb-16 pt-20 text-center">
        <h1 className="mx-auto max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl">
          Stop Applying to Jobs That Aren’t Hiring.
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-lg text-ink-2">
          JobSignal verifies job listings, detects stale and repeatedly reposted positions, and shows
          you which opportunities are actually worth your time.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <Link
            href="/jobs"
            className="rounded-lg bg-brand px-5 py-2.5 font-medium text-white hover:bg-brand-strong"
          >
            Find Verified Jobs
          </Link>
          <a
            href="#how-it-works"
            className="rounded-lg border border-line bg-surface px-5 py-2.5 font-medium text-ink-2 hover:border-line-strong"
          >
            See How It Works
          </a>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-20">
        <h2 className="text-center text-2xl font-semibold tracking-tight">
          Every Job Gets a Confidence Score
        </h2>
        <p className="mx-auto mt-2 max-w-xl text-center text-ink-2">
          Job Confidence measures the listing. Candidate Match measures you. They are never blended.
        </p>
        <div className="mx-auto mt-8 grid max-w-4xl gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-line bg-surface p-5 text-left">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-semibold">Director of Partnerships</h3>
                <p className="text-sm text-ink-2">Acme · Remote — United States</p>
              </div>
              <ConfidenceBadge score={94} />
            </div>
            <div className="mt-4 flex items-center gap-2">
              <MatchBadge score={89} />
              <span className="rounded-md border border-good-line bg-good-soft px-2 py-0.5 text-xs font-medium text-good">
                Verified today
              </span>
            </div>
            <ul className="mt-4 space-y-1 text-sm text-ink-2">
              <li>✓ Found on employer careers page</li>
              <li>✓ Application endpoint verified</li>
              <li>✓ First detected 4 days ago</li>
            </ul>
          </div>
          <div className="rounded-xl border border-line bg-surface p-5 text-left">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-semibold">VP Business Development</h3>
                <p className="text-sm text-ink-2">Example Corp · Hybrid</p>
              </div>
              <ConfidenceBadge score={27} />
            </div>
            <div className="mt-4 flex items-center gap-2">
              <span className="rounded-md border border-bad-line bg-bad-soft px-2 py-0.5 text-xs font-medium text-bad">
                Potential ghost job
              </span>
            </div>
            <ul className="mt-4 space-y-1 text-sm text-ink-2">
              <li>⚠ Repeatedly reposted</li>
              <li>⚠ First seen 147 days ago</li>
              <li>⚠ Missing from employer careers page</li>
            </ul>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="border-t border-line bg-surface py-20">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-center text-2xl font-semibold tracking-tight">
            Discover → Verify → Score → Prioritize → Reach Out
          </h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
            {STEPS.map(([title, body], i) => (
              <div key={title} className="rounded-xl border border-line bg-canvas p-4">
                <div className="num text-xs font-semibold text-brand">0{i + 1}</div>
                <h3 className="mt-1 font-semibold">{title}</h3>
                <p className="mt-1.5 text-sm text-ink-2">{body}</p>
              </div>
            ))}
          </div>
          <div className="mt-12 text-center">
            <Link
              href="/dashboard"
              className="rounded-lg bg-brand px-5 py-2.5 font-medium text-white hover:bg-brand-strong"
            >
              Open the Dashboard
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-line py-8 text-center text-sm text-ink-3">
        JobSignal — Know which jobs are worth applying to.
      </footer>
    </div>
  );
}

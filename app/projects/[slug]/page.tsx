import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { published, bySlug, tier1, type Project } from '@/lib/projects';
import CorrelationExplorer from '@/components/CorrelationExplorer';
import DeferredMount from '@/components/DeferredMount';
import RecoverySimulator from '@/components/RecoverySimulator';
import BayesianExplorer from '@/components/BayesianExplorer';
import ArchitectureDiagram from '@/components/ArchitectureDiagram';

export function generateStaticParams() {
  // `published` only — a draft entry must not get a route.
  return published.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const p = bySlug(slug);
  if (!p) return { title: 'Not found' };
  return {
    title: `${p.title} — Ryan Dacus`,
    description: p.problem.slice(0, 155),
  };
}

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const p = bySlug(slug);
  if (!p) notFound();

  const idx = tier1.findIndex((t) => t.slug === p.slug);
  const prev = idx > 0 ? tier1[idx - 1] : null;
  const next = idx >= 0 && idx < tier1.length - 1 ? tier1[idx + 1] : null;

  return (
    <main className="mx-auto max-w-4xl px-5 md:px-8">
      <nav className="pt-8">
        <Link
          href="/#work"
          className="num rounded-chip text-sm text-fg-3 transition-colors hover:text-fg-2"
        >
          ← All work
        </Link>
      </nav>

      <header className="relative overflow-x-clip pt-10 pb-14 md:pt-14">
        <div
          aria-hidden
          className="hero-glow pointer-events-none absolute -inset-x-24 -top-20 bottom-0"
        />
        <div className="relative flex flex-wrap items-center gap-3">
          <StatusBadge status={p.status} />
          <span className="eyebrow">{p.org}</span>
          <span className="eyebrow">{p.role}</span>
        </div>
        <h1
          className="relative mt-6 max-w-4xl text-balance text-4xl leading-[1.06] tracking-[-0.03em] md:text-5xl"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          {p.title}
        </h1>

        {(p.url || p.repo) && (
          <div className="relative mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm">
            {p.url && (
              <a href={p.url} className="num text-signal underline decoration-signal-dim underline-offset-4">
                {p.url.replace('https://', '')} ↗
              </a>
            )}
            {p.repo && (
              <a href={p.repo} className="num text-model underline decoration-model-dim underline-offset-4">
                source ↗
              </a>
            )}
          </div>
        )}
      </header>

      {p.metrics && (
        <dl className={`grid-lines mb-14 grid ${metricCols(p.metrics.length)}`}>
          {p.metrics.map((m) => (
            <div key={m.label} className="bg-surface px-5 py-5">
              <dd className="num text-xl text-signal md:text-2xl">{m.value}</dd>
              <dt className="mt-2 text-xs leading-snug text-fg-3">{m.label}</dt>
            </div>
          ))}
        </dl>
      )}

      <Section n="01" title="The problem" body={p.problem} />
      <Section n="02" title="What I built" body={p.built} />
      <Section n="03" title="What changed" body={p.changed} accent />

      {p.interactive === 'correlation' && (
        <section className="pb-16">
          <p className="eyebrow">Run it yourself</p>
          <h2 className="mt-4 text-2xl tracking-tight md:text-3xl" style={{ fontFamily: 'var(--font-display)' }}>
            The copula, in your browser
          </h2>
          <p className="mt-4 max-w-2xl leading-relaxed text-fg-2">
            A port of the same mechanism, on an anonymised pipeline. The deal names
            and values are synthetic; the behaviour is not.
          </p>
          <div className="stage mt-8">
            <div className="stage-frame">
              <DeferredMount minHeight={620}>
                <CorrelationExplorer />
              </DeferredMount>
            </div>
          </div>
        </section>
      )}

      {p.interactive === 'recovery' && (
        <section className="pb-16">
          <p className="eyebrow">Run it yourself</p>
          <h2 className="mt-4 text-2xl tracking-tight md:text-3xl" style={{ fontFamily: 'var(--font-display)' }}>
            The corrected model, in your browser
          </h2>
          <p className="mt-4 max-w-2xl leading-relaxed text-fg-2">
            The bottom-up recovery model from the same engine, on illustrative
            inputs. Drag them — especially selling price — and watch which ones
            the recovery rate actually answers to.
          </p>
          <div className="stage mt-8">
            <div className="stage-frame">
              <DeferredMount minHeight={700}>
                <RecoverySimulator />
              </DeferredMount>
            </div>
          </div>
        </section>
      )}

      {p.interactive === 'bayesian' && (
        <section className="pb-16">
          <p className="eyebrow">Run it yourself</p>
          <h2 className="mt-4 text-2xl tracking-tight md:text-3xl" style={{ fontFamily: 'var(--font-display)' }}>
            The inference layer, in your browser
          </h2>
          <p className="mt-4 max-w-2xl leading-relaxed text-fg-2">
            The dashboard&rsquo;s Beta-conjugate updating, on an illustrative
            partner. Feed it a small sample and watch it refuse to overreact.
          </p>
          <div className="stage mt-8">
            <div className="stage-frame">
              <DeferredMount minHeight={640}>
                <BayesianExplorer />
              </DeferredMount>
            </div>
          </div>
        </section>
      )}

      {p.diagram && (
        <section className="pb-16">
          <p className="eyebrow">Architecture</p>
          <h2 className="mt-4 text-2xl tracking-tight md:text-3xl" style={{ fontFamily: 'var(--font-display)' }}>
            How it runs
          </h2>
          <div className="stage mt-8">
            <div className="stage-frame">
              <ArchitectureDiagram />
            </div>
          </div>
        </section>
      )}

      <section className="pb-16">
        <p className="eyebrow">Stack</p>
        <div className="mt-5 flex flex-wrap gap-1.5">
          {p.stack.map((s) => (
            <span
              key={s}
              className="num rounded-chip border border-line bg-surface-2 px-2.5 py-1 text-[11px] text-fg-2"
            >
              {s}
            </span>
          ))}
        </div>
        {p.note && <p className="mt-6 text-sm text-fg-3">{p.note}</p>}
      </section>

      {(prev || next) && (
        <nav className="grid-lines grid md:grid-cols-2">
          {prev ? (
            <Link
              href={`/projects/${prev.slug}`}
              className="group bg-surface p-6 transition-colors hover:bg-surface-2"
            >
              <span className="eyebrow">Previous</span>
              <span className="mt-2 block text-lg text-fg-2 transition-colors group-hover:text-fg">
                {prev.title}
              </span>
            </Link>
          ) : (
            <span className="bg-surface" />
          )}
          {next && (
            <Link
              href={`/projects/${next.slug}`}
              className="group bg-surface p-6 transition-colors hover:bg-surface-2 md:text-right"
            >
              <span className="eyebrow">Next</span>
              <span className="mt-2 block text-lg text-fg-2 transition-colors group-hover:text-fg">
                {next.title}
              </span>
            </Link>
          )}
        </nav>
      )}

      <footer className="py-14">
        <Link href="/#work" className="num text-sm text-fg-3 transition-colors hover:text-fg-2">
          ← All work
        </Link>
      </footer>
    </main>
  );
}

/** Never open more hairline columns than there are metrics to fill them. */
function metricCols(n: number) {
  if (n <= 1) return '';
  if (n === 2) return 'sm:grid-cols-2';
  if (n === 3) return 'sm:grid-cols-2 lg:grid-cols-3';
  return 'sm:grid-cols-2 lg:grid-cols-4';
}

function Section({
  n,
  title,
  body,
  accent,
}: {
  n: string;
  title: string;
  body: string;
  accent?: boolean;
}) {
  return (
    <section className="fade-in pb-16">
      <div className="rule mb-8" />
      <div className="flex items-baseline gap-4">
        <span className="num text-xs text-signal">{n}</span>
        <h2
          className="text-balance text-2xl tracking-[-0.025em] md:text-3xl"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          {title}
        </h2>
      </div>
      <p
        className={`mt-5 max-w-3xl text-pretty text-lg leading-relaxed ${
          accent
            ? 'rounded-card border-l-2 border-signal-dim bg-surface py-4 pl-6 pr-5 text-fg'
            : 'text-fg-2'
        }`}
      >
        {body}
      </p>
    </section>
  );
}

function StatusBadge({ status }: { status: Project['status'] }) {
  const live = status === 'Live';
  return (
    <span
      className="num inline-flex items-center gap-1.5 rounded-chip border px-2 py-0.5 text-[10px] uppercase tracking-wider"
      style={{
        color: live ? 'var(--color-signal)' : 'var(--color-fg-2)',
        borderColor: live ? 'var(--color-signal-dim)' : 'var(--color-line-bright)',
        background: live
          ? 'color-mix(in srgb, var(--color-signal) 10%, transparent)'
          : 'var(--color-surface-2)',
      }}
    >
      {live && (
        <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ background: 'var(--color-signal)' }} />
      )}
      {status}
    </span>
  );
}

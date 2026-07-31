import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { projects, bySlug, tier1, type Project } from '@/lib/projects';
import CorrelationExplorer from '@/components/CorrelationExplorer';
import ArchitectureDiagram from '@/components/ArchitectureDiagram';

export function generateStaticParams() {
  return projects.map((p) => ({ slug: p.slug }));
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
      <nav className="pt-10">
        <Link href="/#work" className="num text-sm text-fg-3 transition-colors hover:text-fg-2">
          ← All work
        </Link>
      </nav>

      <header className="pt-10 pb-12 md:pt-14">
        <div className="flex flex-wrap items-center gap-3">
          <StatusBadge status={p.status} />
          <span className="eyebrow">{p.org}</span>
          <span className="eyebrow">{p.role}</span>
        </div>
        <h1
          className="mt-6 text-3xl leading-tight tracking-tight md:text-5xl"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          {p.title}
        </h1>

        {(p.url || p.repo) && (
          <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm">
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
        <dl className="mb-14 grid gap-px border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
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
          <div className="mt-8">
            <CorrelationExplorer />
          </div>
        </section>
      )}

      {p.diagram && (
        <section className="pb-16">
          <p className="eyebrow">Architecture</p>
          <h2 className="mt-4 text-2xl tracking-tight md:text-3xl" style={{ fontFamily: 'var(--font-display)' }}>
            How it runs
          </h2>
          <div className="mt-8">
            <ArchitectureDiagram />
          </div>
        </section>
      )}

      <section className="pb-16">
        <p className="eyebrow">Stack</p>
        <div className="mt-5 flex flex-wrap gap-1.5">
          {p.stack.map((s) => (
            <span key={s} className="num border border-line px-2.5 py-1 text-[11px] text-fg-2">
              {s}
            </span>
          ))}
        </div>
        {p.note && <p className="mt-6 text-sm text-fg-3">{p.note}</p>}
      </section>

      {(prev || next) && (
        <nav className="grid gap-px border-y border-line bg-line md:grid-cols-2">
          {prev ? (
            <Link href={`/projects/${prev.slug}`} className="group bg-surface p-6">
              <span className="eyebrow">Previous</span>
              <span className="mt-2 block text-lg text-fg-2 transition-colors group-hover:text-fg">
                {prev.title}
              </span>
            </Link>
          ) : (
            <span className="bg-surface" />
          )}
          {next && (
            <Link href={`/projects/${next.slug}`} className="group bg-surface p-6 md:text-right">
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
    <section className="pb-14">
      <div className="flex items-baseline gap-4">
        <span className="num text-xs text-signal">{n}</span>
        <h2 className="text-2xl tracking-tight md:text-3xl" style={{ fontFamily: 'var(--font-display)' }}>
          {title}
        </h2>
      </div>
      <p
        className={`mt-5 max-w-3xl text-lg leading-relaxed ${
          accent ? 'border-l-2 border-signal-dim pl-6 text-fg' : 'text-fg-2'
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
      className="num inline-flex items-center gap-1.5 border px-2 py-0.5 text-[10px] uppercase tracking-wider"
      style={{
        color: live ? 'var(--color-signal)' : 'var(--color-fg-2)',
        borderColor: live ? 'var(--color-signal-dim)' : 'var(--color-line-bright)',
      }}
    >
      {live && (
        <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ background: 'var(--color-signal)' }} />
      )}
      {status}
    </span>
  );
}

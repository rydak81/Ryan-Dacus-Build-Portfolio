'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { Status } from '@/lib/projects';

/**
 * Role Lens wrapper around the work sections.
 *
 * The default grid arrives server-rendered as `children` — zero client cost
 * and nothing to break. When a visitor pastes a job description, the API
 * returns slugs plus one relevance line each; everything else on the lens
 * cards renders from `data`, which is the same lib/projects.ts content
 * passed down by the server component. The model selects and orders. It
 * does not write project descriptions.
 */

export interface LensProject {
  slug: string;
  title: string;
  org: string;
  status: Status;
  problem: string;
  stack: string[];
}

interface Match {
  slug: string;
  line: string;
}

type LensState =
  | { kind: 'idle' }
  | { kind: 'loading' }
  | { kind: 'offline' }
  | { kind: 'empty' }
  | { kind: 'active'; matches: Match[] };

export default function RoleLens({
  data,
  children,
}: {
  data: LensProject[];
  children: React.ReactNode;
}) {
  const [jd, setJd] = useState('');
  const [state, setState] = useState<LensState>({ kind: 'idle' });

  const bySlug = new Map(data.map((p) => [p.slug, p]));

  async function run() {
    if (jd.trim().length < 40 || state.kind === 'loading') return;
    setState({ kind: 'loading' });
    try {
      const res = await fetch('/api/role-lens', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ jd }),
      });
      if (!res.ok) throw new Error();
      const json = await res.json();
      if (!json.available) {
        setState({ kind: 'offline' });
        return;
      }
      const matches = (json.matches as Match[]).filter((m) => bySlug.has(m.slug));
      setState(matches.length ? { kind: 'active', matches } : { kind: 'empty' });
    } catch {
      setState({ kind: 'offline' });
    }
  }

  return (
    <div id="work">
      <section className="pb-14">
        <div className="rule mb-8" />
        <p className="eyebrow">Role lens</p>
        <h2
          className="mt-4 max-w-3xl text-3xl tracking-tight md:text-4xl"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Reading this for a specific role?
        </h2>
        <p className="mt-5 max-w-2xl leading-relaxed text-fg-2">
          Paste the job description. Claude Haiku reads it against the same
          data file that renders this page and reorders the shelf for that
          role. The model selects and orders — every fact on screen still
          comes from the source file.
        </p>

        <div className="panel mt-6 max-w-2xl p-4">
          <label htmlFor="role-jd" className="eyebrow">
            Job description
          </label>
          <textarea
            id="role-jd"
            rows={5}
            value={jd}
            onChange={(e) => setJd(e.target.value)}
            placeholder="Paste the full posting, or just the responsibilities section…"
            className="well mt-3 w-full resize-y p-3 text-sm leading-relaxed text-fg placeholder:text-fg-3 focus:outline-none"
          />
          <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2">
            <button
              type="button"
              onClick={run}
              disabled={state.kind === 'loading' || jd.trim().length < 40}
              className="rounded-card border border-model-dim bg-surface-2 px-5 py-2.5 text-sm text-model transition-colors hover:border-model disabled:cursor-not-allowed disabled:opacity-50"
            >
              {state.kind === 'loading' ? 'Reading the role…' : 'Focus the lens'}
            </button>
            {state.kind === 'active' && (
              <button
                type="button"
                onClick={() => setState({ kind: 'idle' })}
                className="num text-sm text-fg-3 underline decoration-line-bright underline-offset-4 transition-colors hover:text-fg-2"
              >
                clear — back to default order
              </button>
            )}
            {state.kind === 'offline' && (
              <span className="text-sm text-fg-3" role="status">
                The lens is offline right now. The shelf below stays in its
                default order.
              </span>
            )}
            {state.kind === 'empty' && (
              <span className="text-sm text-fg-3" role="status">
                No strong matches for that text — default order kept.
              </span>
            )}
          </div>
        </div>
      </section>

      {state.kind === 'active' ? (
        <section className="pb-20 md:pb-28">
          <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
            <p className="eyebrow">
              Model-ordered · {state.matches.length} of {data.length} projects
            </p>
            <p className="num text-[11px] text-fg-3">
              relevance lines are model output
            </p>
          </div>
          <div className="grid-lines mt-6 grid">
            {state.matches.map((m, i) => {
              const p = bySlug.get(m.slug);
              if (!p) return null;
              return (
                <article
                  key={m.slug}
                  className="bg-surface p-5 transition-colors hover:bg-surface-2 md:p-6"
                >
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="num text-xs text-fg-3">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <StatusBadge status={p.status} />
                    <span className="eyebrow">{p.org}</span>
                  </div>
                  <h3 className="mt-3 text-xl font-medium">
                    <Link
                      href={`/projects/${p.slug}`}
                      className="transition-colors hover:text-signal"
                    >
                      {p.title}
                    </Link>
                  </h3>
                  <p
                    className="mt-3 rounded-chip border-l-2 border-model-dim py-2 pl-3 pr-3 text-sm leading-relaxed text-model"
                    style={{
                      background:
                        'color-mix(in srgb, var(--color-model) 8%, transparent)',
                    }}
                  >
                    {m.line}
                  </p>
                  <p className="mt-3 max-w-3xl text-sm leading-relaxed text-fg-2">
                    {p.problem}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {p.stack.slice(0, 6).map((s) => (
                      <span
                        key={s}
                        className="num rounded-chip border border-line bg-surface-2 px-2 py-1 text-[11px] text-fg-2"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      ) : (
        children
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: Status }) {
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
        <span
          className="inline-block h-1.5 w-1.5 rounded-full"
          style={{ background: 'var(--color-signal)' }}
        />
      )}
      {status}
    </span>
  );
}

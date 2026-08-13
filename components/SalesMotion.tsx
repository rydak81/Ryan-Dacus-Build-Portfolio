import Link from 'next/link';
import { motion, systemsFor } from '@/lib/career';

/**
 * The revenue motion, stage by stage, with the system built for each one.
 *
 * This section exists to fix a positioning problem. A portfolio full of
 * copulas and Bayesian posteriors reads as an engineer's CV, and the roles
 * being targeted are commercial ones — business development, partnerships,
 * alliances, sales leadership. So the spine here is the sales motion, and
 * the builds hang off it as evidence that the selling gets easier rather
 * than as the subject.
 *
 * Left rail carries the stage, right column carries the job, the friction
 * it removes, and links to the projects underneath. Server component —
 * there is nothing to interact with, and the page already spends its one
 * interactive moment on the career trace.
 */
export default function SalesMotion() {
  return (
    <ol className="grid-lines grid">
      {motion.map((m, i) => {
        const systems = systemsFor(m);
        return (
          <li
            key={m.stage}
            className="cell grid gap-x-8 gap-y-4 p-6 md:grid-cols-[190px_1fr] md:p-8"
          >
            <div className="flex items-baseline gap-3 md:block">
              <span className="num text-xs text-signal">
                {String(i + 1).padStart(2, '0')}
              </span>
              <h3 className="text-xl tracking-[-0.02em] md:mt-3 md:text-2xl">
                {m.stage}
              </h3>
            </div>

            <div className="min-w-0">
              <p className="max-w-3xl text-pretty leading-relaxed text-fg-2">
                {m.job}
              </p>
              <p className="mt-4 max-w-3xl border-l-2 border-line-bright pl-4 text-pretty text-sm leading-relaxed text-fg-3">
                {m.friction}
              </p>

              {systems.length > 0 && (
                <div className="mt-5">
                  <p className="eyebrow text-[10px]">
                    What I built for this stage
                  </p>
                  <ul className="mt-2.5 flex flex-wrap gap-1.5">
                    {systems.map((p) => (
                      <li key={p.slug}>
                        <Link
                          href={`/projects/${p.slug}`}
                          className="label inline-flex items-center gap-2 rounded-chip border border-line bg-surface-2 px-2.5 py-1 text-[11px] text-fg-2 transition-colors hover:border-signal hover:text-fg"
                        >
                          {/* Filled dot means it is deployed and reachable —
                              same status vocabulary as the rest of the site. */}
                          <span
                            aria-hidden
                            className="inline-block h-1.5 w-1.5 rounded-full"
                            style={{
                              background:
                                p.status === 'Live'
                                  ? 'var(--color-signal)'
                                  : 'transparent',
                              boxShadow:
                                'inset 0 0 0 1px var(--color-signal-dim)',
                            }}
                          />
                          {p.title}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

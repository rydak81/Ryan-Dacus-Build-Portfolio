import Link from 'next/link';
import { loop, systemsForStage } from '@/lib/career';

/**
 * The operating loop, stage by stage, with the systems built for each one.
 *
 * This replaced SalesMotion as the spine of the home page. The old section
 * framed everything on this site as a stage of a sales funnel, which was
 * the right answer to the wrong question: it kept a shelf of ingestion,
 * measurement, diagnosis and optimisation work filed under "how I sell",
 * where nobody hiring for performance analysis or revenue operations would
 * look for it.
 *
 * Left rail carries the stage and its index; right column carries the job,
 * the friction it removes, and links to the projects underneath. Server
 * component — there is nothing to interact with, and the page already
 * spends its interactive moments on the three live models.
 */
export default function OperatingLoop() {
  return (
    <ol className="grid-lines grid">
      {loop.map((m, i) => {
        const systems = systemsForStage(m);
        return (
          <li
            key={m.stage}
            className="cell grid gap-x-8 gap-y-4 p-6 md:grid-cols-[210px_1fr] md:p-8"
          >
            <div className="flex items-baseline gap-3 md:block">
              {/* The index is a real sequence — the stages run in this
                  order and each one depends on the one before it — so it
                  earns the mono treatment the rest of the site reserves
                  for genuine numerics. */}
              <span className="num text-xs font-semibold text-model">
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
              {/* The friction line is the argument, not a caption, so it
                  gets a rail rather than being set smaller and grey until
                  it reads as boilerplate. The rail is neutral on purpose:
                  under the palette rule warm means verified and cool means
                  modelled, and "what most teams do instead" is neither. */}
              <p className="mt-4 max-w-3xl rounded-r-chip border-l-2 border-line-bright bg-surface-2 py-3 pl-4 pr-4 text-pretty text-sm leading-relaxed text-fg-2">
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
                          className="label inline-flex items-center gap-2 rounded-chip border border-line bg-surface px-2.5 py-1.5 text-[11px] text-fg-2 transition-colors hover:border-model-dim hover:text-model"
                        >
                          {/* Filled dot means it is deployed and reachable —
                              same status vocabulary as the rest of the site. */}
                          <span
                            aria-hidden
                            className="inline-block h-1.5 w-1.5 rounded-full"
                            style={{
                              background:
                                p.status === 'Live'
                                  ? 'var(--color-signal-fill)'
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

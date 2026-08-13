'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import type { Status } from '@/lib/projects';

/**
 * CareerTrace — the résumé as an instrument.
 *
 * Two lanes over the same four chapters. The top lane is the commercial
 * track and never breaks: every chapter carried a number. The bottom lane
 * is one dot per shipped system, read straight out of lib/projects.ts, and
 * it starts completely empty.
 *
 * That gap closing left-to-right is the entire argument the site makes,
 * drawn from the same data file that renders the shelf — so it cannot be
 * flattering and wrong at the same time. If a project's status changes,
 * this chart changes with it.
 *
 * Same structural pattern as CorrelationExplorer: readout strip, SVG,
 * controls, then a caption explaining what was just shown. The SVG is
 * `role="img"` with a description; the real affordance is the HTML tablist
 * beneath it, so the whole thing is keyboard-operable.
 */

export interface TraceProject {
  slug: string;
  title: string;
  status: Status;
}

export interface TraceChapter {
  id: string;
  label: string;
  title: string;
  org: string;
  period?: string;
  mandate: string;
  build: string;
  lesson: string;
  projects: TraceProject[];
}

/* ── geometry ───────────────────────────────────────────────────────── */

const VW = 840;
const PAD = 30;
const LANE_COMMERCIAL = 62;
const DOTS_TOP = 122;
const DOT_GAP = 19;
const DOTS_PER_ROW = 6;
const AXIS = 236;
/** The wash and the chapter separators stop at the axis rule. */
const BAND_TOP = 22;
const BAND_H = AXIS - BAND_TOP;

const isShipped = (s: Status) => s === 'Live' || s === 'Built';

/** Live is verified-and-reachable, so it alone gets the filled warm dot. */
function dotStyle(status: Status) {
  if (status === 'Live') {
    return { fill: 'var(--color-signal)', stroke: 'var(--color-signal)' };
  }
  if (status === 'Built') {
    return { fill: 'transparent', stroke: 'var(--color-signal)' };
  }
  return { fill: 'transparent', stroke: 'var(--color-model)' };
}

export default function CareerTrace({
  chapters,
}: {
  chapters: TraceChapter[];
}) {
  const [active, setActive] = useState(chapters.length - 1);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const scroller = useRef<HTMLDivElement | null>(null);

  const bw = (VW - PAD * 2) / chapters.length;
  const centerOf = (i: number) => PAD + bw * i + bw / 2;

  /* The axis grows a second row only if lib/career.ts actually carries
     periods. Reserving the space unconditionally would leave a visible gap
     under the labels for as long as the dates stay unconfirmed. */
  const hasPeriods = chapters.some((c) => c.period);
  const VH = hasPeriods ? 292 : 268;

  /* The chapter where software first appears. The dashed riser is drawn
     there and nowhere else — it marks one event, not a decoration. */
  const converge = chapters.findIndex((c) =>
    c.projects.some((p) => isShipped(p.status))
  );

  const current = chapters[active];
  const shipped = current.projects.filter((p) => isShipped(p.status));
  const live = current.projects.filter((p) => p.status === 'Live');

  /*
    On a phone the trace is wider than the viewport, so selecting a chapter
    from the tablist has to bring that chapter's band into view — otherwise
    the readout strip updates and the chart appears not to have reacted at
    all. No-ops on desktop, where nothing overflows.
  */
  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    const overflow = el.scrollWidth - el.clientWidth;
    if (overflow <= 0) return;
    const band = el.scrollWidth / chapters.length;
    const left = Math.max(
      0,
      Math.min(overflow, band * (active + 0.5) - el.clientWidth / 2)
    );
    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    el.scrollTo({ left, behavior: still ? 'auto' : 'smooth' });
  }, [active, chapters.length]);

  function onKey(e: React.KeyboardEvent) {
    const last = chapters.length - 1;
    let next = active;
    if (e.key === 'ArrowRight') next = active === last ? 0 : active + 1;
    else if (e.key === 'ArrowLeft') next = active === 0 ? last : active - 1;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = last;
    else return;
    e.preventDefault();
    setActive(next);
    tabs.current[next]?.focus();
  }

  return (
    <div className="bg-surface">
      {/* ── readout strip ───────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-px border-b border-line bg-line md:grid-cols-4">
        <Readout label="Chapter">
          {current.label}
          <span className="num ml-2 text-xs font-normal text-fg-3">
            {active + 1}/{chapters.length}
          </span>
        </Readout>
        <Readout label="Where">{current.org}</Readout>
        <Readout
          label="Systems shipped"
          numeric
          tone={shipped.length ? 'signal' : 'mute'}
        >
          {shipped.length}
        </Readout>
        <Readout
          label="Of those, live"
          numeric
          tone={live.length ? 'signal' : 'mute'}
        >
          {live.length}
        </Readout>
      </div>

      {/* ── the trace ───────────────────────────────────────────────── */}
      <div className="py-5">
        {/*
          Below roughly 620px the 840-unit viewBox scales the axis labels
          down to about five real pixels, which is not a small chart — it is
          an unreadable one. So the trace keeps a legible floor and the
          container scrolls instead, the same trade the hero mosaic makes on
          a phone. The tablist underneath is the accessible path to every
          chapter, so nothing is reachable only by dragging.
        */}
        <div ref={scroller} className="overflow-x-auto px-3 md:px-5">
          <svg
            viewBox={`0 0 ${VW} ${VH}`}
            className="h-auto w-full min-w-[620px]"
            role="img"
          aria-label={`Career trace. ${chapters.length} chapters. The commercial track runs unbroken across all of them; shipped systems appear only from the ${
            converge >= 0 ? chapters[converge].label : 'later'
          } chapter onward, then accumulate.`}
        >
          {/* selected-chapter wash */}
          <rect
            x={PAD + bw * active}
            y={BAND_TOP}
            width={bw}
            height={BAND_H}
            fill="var(--color-surface-2)"
          />

          {/* chapter separators */}
          {chapters.slice(1).map((c, i) => (
            <line
              key={c.id}
              x1={PAD + bw * (i + 1)}
              x2={PAD + bw * (i + 1)}
              y1={BAND_TOP}
              y2={AXIS}
              stroke="var(--color-line)"
              strokeWidth={1}
            />
          ))}

          {/* lane labels */}
          <text x={PAD} y={34} className="trace-lane" fill="var(--color-fg-3)">
            COMMERCIAL TRACK
          </text>
          <text
            x={PAD}
            y={104}
            className="trace-lane"
            fill="var(--color-fg-3)"
          >
            SYSTEMS SHIPPED
          </text>

          {/* the commercial rail — continuous by construction */}
          <line
            x1={PAD}
            x2={VW - PAD}
            y1={LANE_COMMERCIAL}
            y2={LANE_COMMERCIAL}
            stroke="var(--color-line-bright)"
            strokeWidth={2}
          />
          {chapters.map((c, i) => (
            <circle
              key={c.id}
              cx={centerOf(i)}
              cy={LANE_COMMERCIAL}
              r={i === active ? 7 : 5}
              fill={i === active ? 'var(--color-fg)' : 'var(--color-fg-3)'}
            />
          ))}

          {/* the one riser: where the second track starts existing */}
          {converge >= 0 && (
            <line
              x1={centerOf(converge)}
              x2={centerOf(converge)}
              y1={LANE_COMMERCIAL + 12}
              y2={DOTS_TOP - 10}
              stroke="var(--color-signal-dim)"
              strokeWidth={1.5}
              strokeDasharray="3 4"
            />
          )}

          {/* evidence dots, one per published project */}
          {chapters.map((c, i) => {
            if (!c.projects.length) {
              return (
                <text
                  key={c.id}
                  x={centerOf(i)}
                  y={DOTS_TOP + 14}
                  textAnchor="middle"
                  className="trace-empty"
                  fill="var(--color-fg-3)"
                >
                  none
                </text>
              );
            }
            return c.projects.map((p, j) => {
              const cols = Math.min(c.projects.length, DOTS_PER_ROW);
              const col = j % DOTS_PER_ROW;
              const row = Math.floor(j / DOTS_PER_ROW);
              const rowCount =
                row === Math.floor((c.projects.length - 1) / DOTS_PER_ROW)
                  ? ((c.projects.length - 1) % DOTS_PER_ROW) + 1
                  : cols;
              const startX = centerOf(i) - ((rowCount - 1) * DOT_GAP) / 2;
              const style = dotStyle(p.status);
              return (
                <circle
                  key={p.slug}
                  cx={startX + col * DOT_GAP}
                  cy={DOTS_TOP + row * DOT_GAP}
                  r={5}
                  fill={style.fill}
                  stroke={style.stroke}
                  strokeWidth={1.5}
                  opacity={i === active ? 1 : 0.42}
                />
              );
            });
          })}

          {/* axis + chapter labels */}
          <line
            x1={PAD}
            x2={VW - PAD}
            y1={AXIS}
            y2={AXIS}
            stroke="var(--color-line)"
            strokeWidth={1}
          />
          {chapters.map((c, i) => (
            <g key={c.id}>
              <text
                x={centerOf(i)}
                y={AXIS + 20}
                textAnchor="middle"
                className="trace-tick"
                fill={
                  i === active ? 'var(--color-fg)' : 'var(--color-fg-3)'
                }
              >
                {c.label}
              </text>
              {/* Renders only once a real period exists in lib/career.ts.
                  Until then the axis simply carries no dates. */}
              {c.period && (
                <text
                  x={centerOf(i)}
                  y={AXIS + 38}
                  textAnchor="middle"
                  className="trace-tick"
                  fill="var(--color-fg-3)"
                >
                  {c.period}
                </text>
              )}
            </g>
          ))}
          </svg>
        </div>

        {/* legend */}
        <ul className="mt-1 flex flex-wrap items-center gap-x-5 gap-y-2 px-4 text-[11px] text-fg-3 md:px-6">
          <Key fill="var(--color-signal)" stroke="var(--color-signal)">
            Live — deployed and reachable
          </Key>
          <Key fill="transparent" stroke="var(--color-signal)">
            Built — runs, not hosted
          </Key>
          <Key fill="transparent" stroke="var(--color-model)">
            Designed, in progress, or analysis
          </Key>
        </ul>
      </div>

      {/* ── chapter rail ────────────────────────────────────────────── */}
      <div
        role="tablist"
        aria-label="Career chapters"
        onKeyDown={onKey}
        className="grid grid-cols-2 gap-px border-y border-line bg-line md:grid-cols-4"
      >
        {chapters.map((c, i) => (
          <button
            key={c.id}
            ref={(el) => {
              tabs.current[i] = el;
            }}
            role="tab"
            id={`trace-tab-${c.id}`}
            aria-selected={i === active}
            aria-controls={`trace-panel-${c.id}`}
            tabIndex={i === active ? 0 : -1}
            onClick={() => setActive(i)}
            className={`cell px-4 py-3.5 text-left transition-colors ${
              i === active ? 'text-fg' : 'text-fg-3 hover:text-fg-2'
            }`}
            style={
              i === active
                ? { boxShadow: 'inset 0 2px 0 0 var(--color-signal)' }
                : undefined
            }
          >
            <span className="num block text-[11px] text-fg-3">
              {String(i + 1).padStart(2, '0')}
            </span>
            <span className="mt-1 block text-sm font-bold tracking-[-0.015em]">
              {c.label}
            </span>
            <span className="mt-0.5 block truncate text-[11px] text-fg-3">
              {c.org}
            </span>
          </button>
        ))}
      </div>

      {/* ── detail panel ────────────────────────────────────────────── */}
      <div
        role="tabpanel"
        id={`trace-panel-${current.id}`}
        aria-labelledby={`trace-tab-${current.id}`}
        className="p-5 md:p-7"
      >
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <h3 className="text-xl tracking-[-0.02em] md:text-2xl">
            {current.title}
          </h3>
          {current.period && (
            <span className="num text-sm text-fg-3">{current.period}</span>
          )}
        </div>
        <p className="eyebrow mt-2">{current.org}</p>

        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <div>
            <p className="eyebrow">What I sold</p>
            <p className="mt-2.5 text-sm leading-relaxed text-fg-2">
              {current.mandate}
            </p>
          </div>
          <div>
            <p className="eyebrow">What I built</p>
            <p className="mt-2.5 text-sm leading-relaxed text-fg-2">
              {current.build}
            </p>
          </div>
        </div>

        <p className="mt-6 rounded-card border-l-2 border-signal-dim bg-surface py-3 pl-5 pr-4 text-sm leading-relaxed text-fg">
          {current.lesson}
        </p>

        {current.projects.length > 0 && (
          <div className="mt-6">
            <p className="eyebrow">
              On the shelf from this chapter — {current.projects.length}
            </p>
            <ul className="mt-3 flex flex-wrap gap-1.5">
              {current.projects.map((p) => (
                <li key={p.slug}>
                  <Link
                    href={`/projects/${p.slug}`}
                    className="label inline-flex items-center gap-2 rounded-chip border border-line bg-surface-2 px-2.5 py-1 text-[11px] text-fg-2 transition-colors hover:border-line-bright hover:text-fg"
                  >
                    <span
                      aria-hidden
                      className="inline-block h-1.5 w-1.5 rounded-full"
                      style={{
                        background:
                          p.status === 'Live'
                            ? 'var(--color-signal)'
                            : 'transparent',
                        boxShadow: `inset 0 0 0 1px ${
                          isShipped(p.status)
                            ? 'var(--color-signal)'
                            : 'var(--color-model)'
                        }`,
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

      <p className="border-t border-line px-5 py-4 text-xs leading-relaxed text-fg-3 md:px-7">
        Every dot is a row in the same file that renders the work shelf —
        nothing on this chart is typed in by hand. The top line never breaks
        because the commercial job never stopped; the bottom one starts empty
        because for the first chapter there was nothing to show, and that is
        the honest version of the story.
      </p>
    </div>
  );
}

/**
 * `numeric` is not a style flag — it is the site's typographic rule. Mono
 * is reserved for genuine measurements, so the counts get it and the
 * chapter and org names, which are words, do not. Setting a five-word
 * company name in tabular mono is what shattered this strip at 390px.
 */
function Readout({
  label,
  children,
  tone = 'fg',
  numeric = false,
}: {
  label: string;
  children: React.ReactNode;
  tone?: 'fg' | 'signal' | 'mute';
  numeric?: boolean;
}) {
  return (
    <div className="cell px-4 py-3">
      <p className="eyebrow text-[10px]">{label}</p>
      <p
        className={`mt-1.5 font-semibold ${
          numeric ? 'num text-lg' : 'text-pretty text-sm leading-snug'
        } ${
          tone === 'signal'
            ? 'text-signal'
            : tone === 'mute'
              ? 'text-fg-3'
              : 'text-fg'
        }`}
      >
        {children}
      </p>
    </div>
  );
}

function Key({
  fill,
  stroke,
  children,
}: {
  fill: string;
  stroke: string;
  children: React.ReactNode;
}) {
  return (
    <li className="flex items-center gap-2">
      <svg width="12" height="12" aria-hidden className="shrink-0">
        <circle
          cx="6"
          cy="6"
          r="4.5"
          fill={fill}
          stroke={stroke}
          strokeWidth="1.5"
        />
      </svg>
      {children}
    </li>
  );
}

'use client';

import { useMemo, useState } from 'react';
import {
  simulate,
  histogram,
  DEALS,
  TARGET,
  FLOOR,
  DEFAULT_W,
} from '@/lib/simulation';

const LO = 45000;
const HI = 335000;
const BINS = 58;

const W = 900;
const H = 300;
const PAD = { top: 16, right: 16, bottom: 34, left: 16 };

const usd = (n: number) => '$' + Math.round(n / 1000) + 'K';
const pct = (n: number) => (n * 100).toFixed(0) + '%';

export default function CorrelationExplorer() {
  const [w, setW] = useState(DEFAULT_W);

  // Independence baseline never changes, so it only ever computes once.
  const base = useMemo(() => simulate(0), []);
  const baseBins = useMemo(
    () => histogram(base.totals, BINS, LO, HI),
    [base]
  );

  const run = useMemo(() => simulate(w), [w]);
  const bins = useMemo(() => histogram(run.totals, BINS, LO, HI), [run]);

  const peak = Math.max(
    ...bins.map((b) => b.count),
    ...baseBins.map((b) => b.count)
  );

  const plotW = W - PAD.left - PAD.right;
  const plotH = H - PAD.top - PAD.bottom;
  const x = (v: number) => PAD.left + ((v - LO) / (HI - LO)) * plotW;
  const y = (c: number) => PAD.top + plotH - (c / peak) * plotH;

  const widening = base.spread > 0 ? run.spread / base.spread - 1 : 0;
  const barW = plotW / BINS;

  const areaPath = (bs: typeof bins) => {
    let d = `M ${x(bs[0].x0)} ${PAD.top + plotH}`;
    bs.forEach((b) => {
      d += ` L ${x(b.x0)} ${y(b.count)} L ${x(b.x1)} ${y(b.count)}`;
    });
    d += ` L ${x(bs[bs.length - 1].x1)} ${PAD.top + plotH} Z`;
    return d;
  };

  return (
    <div className="border border-line bg-surface">
      {/* Readout strip */}
      <div className="grid grid-cols-2 border-b border-line md:grid-cols-4">
        <Stat
          label="P50 outcome"
          value={usd(run.p50)}
          tone="model"
          sub="median booking"
        />
        <Stat
          label="P10 – P90 range"
          value={usd(run.spread)}
          tone="model"
          sub={
            widening > 0.005
              ? `${(widening * 100).toFixed(0)}% wider than independent`
              : 'baseline — deals assumed independent'
          }
        />
        <Stat
          label={`Miss the ${usd(FLOOR)} floor`}
          value={pct(run.pMissFloor)}
          tone="risk"
          sub="the number that actually moves"
        />
        <Stat
          label={`Hit the ${usd(TARGET)} target`}
          value={pct(run.pHitTarget)}
          tone="model"
          sub="upside crossings"
        />
      </div>

      {/* Chart */}
      <div className="px-3 pt-5 pb-1 md:px-5">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="w-full"
          role="img"
          aria-label={`Distribution of simulated quarter-end bookings. Median ${usd(
            run.p50
          )}. Ten to ninety percent range ${usd(run.spread)}.`}
        >
          {/* Independence baseline, drawn as an outline behind the live run */}
          <path
            d={areaPath(baseBins)}
            fill="none"
            stroke="var(--color-fg-3)"
            strokeWidth={1}
            strokeDasharray="3 3"
            opacity={0.65}
          />

          {/* Live distribution */}
          {bins.map((b, i) => (
            <rect
              key={i}
              x={x(b.x0)}
              y={y(b.count)}
              width={Math.max(barW - 1, 1)}
              height={PAD.top + plotH - y(b.count)}
              fill="var(--color-model)"
              opacity={b.x1 < FLOOR ? 0.75 : 0.32}
            />
          ))}

          {/* Floor */}
          <line
            x1={x(FLOOR)}
            x2={x(FLOOR)}
            y1={PAD.top}
            y2={PAD.top + plotH}
            stroke="var(--color-risk)"
            strokeWidth={1.5}
          />
          <text
            x={x(FLOOR) - 6}
            y={PAD.top + 12}
            textAnchor="end"
            className="num"
            fontSize="11"
            fill="var(--color-risk)"
          >
            floor {usd(FLOOR)}
          </text>

          {/* Target */}
          <line
            x1={x(TARGET)}
            x2={x(TARGET)}
            y1={PAD.top}
            y2={PAD.top + plotH}
            stroke="var(--color-signal)"
            strokeWidth={1.5}
            strokeDasharray="5 4"
          />
          <text
            x={x(TARGET) + 6}
            y={PAD.top + 12}
            className="num"
            fontSize="11"
            fill="var(--color-signal)"
          >
            target {usd(TARGET)}
          </text>

          {/* Percentile markers */}
          {([['P10', run.p10], ['P50', run.p50], ['P90', run.p90]] as const).map(
            ([label, v]) => (
              <g key={label}>
                <line
                  x1={x(v)}
                  x2={x(v)}
                  y1={PAD.top + plotH - 10}
                  y2={PAD.top + plotH}
                  stroke="var(--color-fg-2)"
                  strokeWidth={1}
                />
                <text
                  x={x(v)}
                  y={PAD.top + plotH + 15}
                  textAnchor="middle"
                  className="num"
                  fontSize="10"
                  fill="var(--color-fg-2)"
                >
                  {label}
                </text>
                <text
                  x={x(v)}
                  y={PAD.top + plotH + 28}
                  textAnchor="middle"
                  className="num"
                  fontSize="10"
                  fill="var(--color-fg-3)"
                >
                  {usd(v)}
                </text>
              </g>
            )
          )}
        </svg>
      </div>

      {/* Control */}
      <div className="border-t border-line px-5 py-5">
        <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
          <label htmlFor="corr" className="eyebrow">
            Deal correlation
          </label>
          <span className="num text-sm text-fg-2">
            <span className="text-signal">w = {w.toFixed(2)}</span>
            {' · '}
            {w < 0.05
              ? 'deals move independently'
              : w < 0.3
              ? 'deals move somewhat together'
              : 'deals move strongly together'}
          </span>
        </div>
        <input
          id="corr"
          type="range"
          min={0}
          max={0.6}
          step={0.01}
          value={w}
          onChange={(e) => setW(parseFloat(e.target.value))}
          className="mt-4 w-full"
          aria-valuetext={`correlation ${w.toFixed(2)}`}
        />
        <div className="num mt-2 flex justify-between text-[11px] text-fg-3">
          <span>0.00 — independent</span>
          <span>0.60 — highly correlated</span>
        </div>

        <p className="mt-5 max-w-2xl text-sm leading-relaxed text-fg-2">
          Drag it. The median barely moves — every deal keeps exactly the close
          probability it started with. What changes is the shape: when deals rise
          and fall together, both tails fatten, and the chance of landing under
          the floor climbs. A forecast that assumes independence isn&rsquo;t
          optimistic. It&rsquo;s just wrong about the risk.
        </p>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-fg-3">
          Run against the real pipeline in the Python engine, correlation widened
          the honest P10–P90 range by{' '}
          <span className="num text-signal">41%</span> and moved
          floor-miss risk from{' '}
          <span className="num">28%</span> to{' '}
          <span className="num text-risk">34%</span>. Same expected
          value. Different decision.
        </p>
      </div>

      <div className="num border-t border-line px-5 py-3 text-[11px] text-fg-3">
        5,000 trials · {DEALS.length} anonymised opportunities · factor-structured
        Gaussian copula · recomputes on every drag
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: string;
  sub: string;
  tone: 'model' | 'risk' | 'signal';
}) {
  const color =
    tone === 'risk'
      ? 'var(--color-risk)'
      : tone === 'signal'
      ? 'var(--color-signal)'
      : 'var(--color-model)';
  return (
    <div className="border-r border-line px-4 py-4 last:border-r-0">
      <div className="eyebrow">{label}</div>
      <div
        className="num mt-2 text-2xl md:text-3xl"
        style={{ color }}
        aria-live="polite"
      >
        {value}
      </div>
      <div className="mt-1 text-[11px] leading-snug text-fg-3">
        {sub}
      </div>
    </div>
  );
}

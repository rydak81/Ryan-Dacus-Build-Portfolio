'use client';

import { useMemo, useState } from 'react';
import {
  computeRecovery,
  sensitivity,
  DEFAULT_INPUTS,
  RANGES,
  INPUT_LABELS,
  SENSITIVITY_BUMP,
  type RecoveryInputs,
} from '@/lib/recovery';
import { bySlug } from '@/lib/projects';

const W = 900;
const H = 248;
const LABEL_W = 200;
const PAD = { top: 10, right: 70, bottom: 30 };
const ROW_H = 50;
const BAR_H = 11;
const BAR_GAP = 4;
/** Sensitivity axis ceiling — slightly above the bump so full bars don't touch the edge. */
const AXIS_MAX = SENSITIVITY_BUMP * 1.25;

const usd = (n: number) => '$' + Math.round(n).toLocaleString('en-US');
const usdCents = (n: number) =>
  '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const pct1 = (n: number) => (n * 100).toFixed(1) + '%';
const pct2 = (n: number) => (n * 100).toFixed(2) + '%';

/** The correction figure lives in lib/projects.ts, where it can be defended. */
const CORRECTION = bySlug('recovery-profitability-suite')
  ?.metrics?.find((m) => m.label.startsWith('Correction'))?.value;

export default function RecoverySimulator() {
  const [inputs, setInputs] = useState<RecoveryInputs>(DEFAULT_INPUTS);

  const result = useMemo(() => computeRecovery(inputs), [inputs]);
  const rows = useMemo(() => sensitivity(inputs), [inputs]);

  const set = (key: keyof RecoveryInputs) => (v: number) =>
    setInputs((prev) => ({ ...prev, [key]: v }));

  const plotW = W - LABEL_W - PAD.right;
  const x = (delta: number) => LABEL_W + (Math.max(delta, 0) / AXIS_MAX) * plotW;
  const plotH = PAD.top + rows.length * ROW_H;

  const aspRow = rows.find((r) => r.key === 'asp');

  return (
    <div className="border border-line bg-surface">
      {/* Readout strip */}
      <div className="grid grid-cols-2 border-b border-line md:grid-cols-4">
        <Stat
          label="Estimated recoverable value"
          value={usd(result.recoverable)}
          tone="model"
          sub="annually, at manufacturing cost"
        />
        <Stat
          label="Recovery rate"
          value={pct2(result.rate)}
          tone="model"
          sub="of revenue — the number that gets quoted"
        />
        <Stat
          label="Lost or damaged units"
          value={Math.round(result.lostUnits).toLocaleString('en-US')}
          tone="model"
          sub={`of ${inputs.units.toLocaleString('en-US')} annual units`}
        />
        <Stat
          label="Reimbursement per lost unit"
          value={usdCents(result.reimbPerUnit)}
          tone="model"
          sub="landed COGS, not retail price"
        />
      </div>

      {/* Sensitivity chart */}
      <div className="px-3 pt-5 pb-1 md:px-5">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-1">
          <span className="eyebrow">
            Effect of +{Math.round(SENSITIVITY_BUMP * 100)}% in each input
          </span>
          <span className="num flex items-center gap-1.5 text-[11px] text-fg-3">
            <span
              className="inline-block h-2 w-4"
              style={{ background: 'var(--color-model)', opacity: 0.28 }}
            />
            recoverable dollars
          </span>
          <span className="num flex items-center gap-1.5 text-[11px] text-fg-3">
            <span
              className="inline-block h-2 w-4"
              style={{ background: 'var(--color-model)' }}
            />
            recovery rate, % of revenue
          </span>
        </div>
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="mt-4 w-full"
          role="img"
          aria-label={`Sensitivity of the recovery estimate to each input. A ${Math.round(
            SENSITIVITY_BUMP * 100
          )} percent increase in average selling price moves the recovery rate by ${pct1(
            aspRow?.rateDelta ?? 0
          )}, while the same increase in COGS share moves it by ${pct1(
            rows.find((r) => r.key === 'cogsShare')?.rateDelta ?? 0
          )}.`}
        >
          {/* Axis gridlines */}
          {[0, 0.1, 0.2].map((g) => (
            <g key={g}>
              <line
                x1={x(g)}
                x2={x(g)}
                y1={PAD.top}
                y2={plotH}
                stroke={g === 0 ? 'var(--color-line-bright)' : 'var(--color-line)'}
                strokeWidth={1}
                strokeDasharray={g === 0 ? undefined : '3 3'}
              />
              <text
                x={x(g)}
                y={plotH + 18}
                textAnchor="middle"
                className="num"
                fontSize="10"
                fill="var(--color-fg-3)"
              >
                {g === 0 ? '0%' : `+${Math.round(g * 100)}%`}
              </text>
            </g>
          ))}

          {rows.map((r, i) => {
            const rowY = PAD.top + i * ROW_H + 8;
            return (
              <g key={r.key}>
                <text
                  x={0}
                  y={rowY + BAR_H + BAR_GAP / 2 + 4}
                  fontSize="12"
                  fill="var(--color-fg-2)"
                >
                  {r.label}
                </text>
                <Bar y={rowY} delta={r.dollarsDelta} x={x} dim />
                <Bar y={rowY + BAR_H + BAR_GAP} delta={r.rateDelta} x={x} />
              </g>
            );
          })}
        </svg>
      </div>

      {/* Controls */}
      <div className="border-t border-line px-5 py-5">
        <div className="grid gap-x-10 gap-y-5 md:grid-cols-2">
          <Slider
            id="rec-units"
            label={INPUT_LABELS.units}
            display={inputs.units.toLocaleString('en-US')}
            range={RANGES.units}
            value={inputs.units}
            onChange={set('units')}
          />
          <Slider
            id="rec-asp"
            label={INPUT_LABELS.asp}
            display={usd(inputs.asp)}
            range={RANGES.asp}
            value={inputs.asp}
            onChange={set('asp')}
          />
          <Slider
            id="rec-cogs"
            label={INPUT_LABELS.cogsShare}
            display={pct1(inputs.cogsShare)}
            range={RANGES.cogsShare}
            value={inputs.cogsShare}
            onChange={set('cogsShare')}
          />
          <Slider
            id="rec-loss"
            label={INPUT_LABELS.lossRate}
            display={pct1(inputs.lossRate)}
            range={RANGES.lossRate}
            value={inputs.lossRate}
            onChange={set('lossRate')}
          />
        </div>

        <p className="mt-6 max-w-2xl text-sm leading-relaxed text-fg-2">
          Drag average selling price. Recoverable dollars move — a bigger
          business has more at stake — but the recovery rate doesn&rsquo;t,
          because price cancels out of the fraction. The rate is loss rate
          &times; COGS share, nothing else. A catalog of cheap accessories and
          a catalog of premium appliances with the same cost structure recover
          the same share of revenue — which is why sizing recovery as a
          percentage of revenue, without knowing the cost structure, is
          guessing.
        </p>
        {CORRECTION && (
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-fg-3">
            That is not a hypothetical failure mode. The engine&rsquo;s first
            recovery estimate was sized off revenue and came out{' '}
            <span className="num text-signal">{CORRECTION}</span> — caught and
            rebuilt bottom-up on units &times; manufacturing cost before it
            reached a partner.
          </p>
        )}
        <p className="mt-5 max-w-2xl border-l-2 border-line-bright pl-4 text-sm leading-relaxed text-fg-3">
          Inputs are illustrative defaults, not client data. A real engagement
          is sized from actual seller units, landed costs, and loss history.
        </p>
      </div>

      <div className="num border-t border-line px-5 py-3 text-[11px] text-fg-3">
        bottom-up: units &times; manufacturing cost · post-March-2025
        reimbursement policy basis · recomputes on every drag
      </div>
    </div>
  );
}

function Bar({
  y,
  delta,
  x,
  dim,
}: {
  y: number;
  delta: number;
  x: (d: number) => number;
  dim?: boolean;
}) {
  const x0 = x(0);
  const x1 = x(delta);
  const near0 = Math.abs(delta) < 0.0005;
  return (
    <g>
      {!near0 && (
        <rect
          x={x0}
          y={y}
          width={Math.max(x1 - x0, 1)}
          height={BAR_H}
          fill="var(--color-model)"
          opacity={dim ? 0.28 : 0.9}
        />
      )}
      <text
        x={(near0 ? x0 : x1) + 6}
        y={y + BAR_H - 2}
        className="num"
        fontSize="10"
        fill={near0 ? 'var(--color-fg-3)' : 'var(--color-fg-2)'}
      >
        {near0 ? '0%' : `+${(delta * 100).toFixed(0)}%`}
      </text>
    </g>
  );
}

function Slider({
  id,
  label,
  display,
  range,
  value,
  onChange,
}: {
  id: string;
  label: string;
  display: string;
  range: { min: number; max: number; step: number };
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-x-4">
        <label htmlFor={id} className="eyebrow">
          {label}
        </label>
        <span className="num text-sm text-signal">{display}</span>
      </div>
      <input
        id={id}
        type="range"
        min={range.min}
        max={range.max}
        step={range.step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="mt-3 w-full"
        aria-valuetext={`${label} ${display}`}
      />
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
      <div className="num mt-2 text-2xl md:text-3xl" style={{ color }} aria-live="polite">
        {value}
      </div>
      <div className="mt-1 text-[11px] leading-snug text-fg-3">{sub}</div>
    </div>
  );
}

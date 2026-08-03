'use client';

import { useMemo, useState } from 'react';
import {
  PRIOR_ALPHA,
  PRIOR_BETA,
  MAX_OBSERVED,
  DEFAULT_N,
  DEFAULT_K,
  posterior,
  betaMean,
  densityGrid,
  credibleInterval,
} from '@/lib/bayes';

const W = 900;
const H = 300;
const PAD = { top: 16, right: 16, bottom: 34, left: 16 };

const pct = (n: number) => (n * 100).toFixed(1) + '%';

export default function BayesianExplorer() {
  const [n, setN] = useState(DEFAULT_N);
  const [k, setK] = useState(DEFAULT_K);

  const post = useMemo(() => posterior(k, n), [k, n]);
  // The prior never changes, so its curve only ever computes once.
  const priorGrid = useMemo(() => densityGrid(PRIOR_ALPHA, PRIOR_BETA), []);
  const postGrid = useMemo(() => densityGrid(post.alpha, post.beta), [post]);
  const interval = useMemo(
    () => credibleInterval(post.alpha, post.beta),
    [post]
  );

  const naive = n > 0 ? k / n : null;
  const postMean = betaMean(post.alpha, post.beta);
  const priorMean = betaMean(PRIOR_ALPHA, PRIOR_BETA);
  const pullPts = naive !== null ? (postMean - naive) * 100 : null;

  const plotW = W - PAD.left - PAD.right;
  const plotH = H - PAD.top - PAD.bottom;
  const x = (v: number) => PAD.left + v * plotW;
  const peak = Math.max(priorGrid.peak, postGrid.peak);
  const y = (d: number) => PAD.top + plotH - (d / peak) * plotH;

  const linePath = (g: typeof priorGrid) =>
    g.xs.map((gx, i) => `${i === 0 ? 'M' : 'L'} ${x(gx)} ${y(g.ys[i])}`).join(' ');
  const areaPath = (g: typeof priorGrid) =>
    `M ${x(0)} ${PAD.top + plotH} ` +
    g.xs.map((gx, i) => `L ${x(gx)} ${y(g.ys[i])}`).join(' ') +
    ` L ${x(1)} ${PAD.top + plotH} Z`;

  // Keep the naive-rate label inside the frame at the edges.
  const naiveLabelLeft = naive !== null && naive > 0.82;

  return (
    <div className="border border-line bg-surface">
      {/* Readout strip */}
      <div className="grid grid-cols-2 border-b border-line md:grid-cols-4">
        <Stat
          label="Observed"
          value={`${k} of ${n}`}
          tone="neutral"
          sub="accounts activated"
        />
        <Stat
          label="Naive rate"
          value={naive !== null ? pct(naive) : '—'}
          tone="neutral"
          sub={naive !== null ? 'what the spreadsheet reports' : 'no observations yet'}
        />
        <Stat
          label="Posterior mean"
          value={pct(postMean)}
          tone="model"
          sub={
            pullPts !== null && Math.abs(pullPts) >= 0.05
              ? `pulled ${Math.abs(pullPts).toFixed(1)} pts toward the prior`
              : 'what the model believes'
          }
        />
        <Stat
          label="90% credible interval"
          value={`${pct(interval[0])}–${pct(interval[1])}`}
          tone="model"
          sub="where the true rate plausibly lives"
        />
      </div>

      {/* Chart. Scrolls horizontally on small screens so the marker labels
          stay legible instead of scaling down with the SVG. */}
      <div className="overflow-x-auto px-3 pt-5 pb-1 md:px-5">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="w-full min-w-[520px]"
          role="img"
          aria-label={`Prior and posterior densities of the account activation rate. With ${k} activations in ${n} observations, the naive rate is ${
            naive !== null ? pct(naive) : 'undefined'
          } and the posterior mean is ${pct(postMean)}.`}
        >
          {/* Prior, drawn as a dashed ghost behind the posterior */}
          <path
            d={linePath(priorGrid)}
            fill="none"
            stroke="var(--color-fg-3)"
            strokeWidth={1}
            strokeDasharray="3 3"
            opacity={0.65}
          />

          {/* Posterior */}
          <path d={areaPath(postGrid)} fill="var(--color-model)" opacity={0.18} />
          <path
            d={linePath(postGrid)}
            fill="none"
            stroke="var(--color-model)"
            strokeWidth={1.5}
          />

          {/* Naive rate marker */}
          {naive !== null && (
            <g>
              <line
                x1={x(naive)}
                x2={x(naive)}
                y1={PAD.top}
                y2={PAD.top + plotH}
                stroke="var(--color-fg-2)"
                strokeWidth={1}
                strokeDasharray="5 4"
              />
              <text
                x={x(naive) + (naiveLabelLeft ? -6 : 6)}
                y={PAD.top + 12}
                textAnchor={naiveLabelLeft ? 'end' : 'start'}
                className="num"
                fontSize="11"
                fill="var(--color-fg-2)"
              >
                naive k/n {pct(naive)}
              </text>
            </g>
          )}

          {/* Posterior mean marker */}
          <line
            x1={x(postMean)}
            x2={x(postMean)}
            y1={PAD.top}
            y2={PAD.top + plotH}
            stroke="var(--color-model)"
            strokeWidth={1.5}
          />
          <text
            x={x(postMean) + (naive !== null && naive >= postMean ? -6 : 6)}
            y={PAD.top + 28}
            textAnchor={naive !== null && naive >= postMean ? 'end' : 'start'}
            className="num"
            fontSize="11"
            fill="var(--color-model)"
          >
            posterior mean {pct(postMean)}
          </text>

          {/* Prior mean tick */}
          <line
            x1={x(priorMean)}
            x2={x(priorMean)}
            y1={PAD.top + plotH - 10}
            y2={PAD.top + plotH}
            stroke="var(--color-fg-3)"
            strokeWidth={1}
          />
          <text
            x={x(priorMean)}
            y={PAD.top + plotH - 14}
            textAnchor="middle"
            className="num"
            fontSize="10"
            fill="var(--color-fg-3)"
          >
            prior {pct(priorMean)}
          </text>

          {/* X axis */}
          {[0, 0.25, 0.5, 0.75, 1].map((t) => (
            <text
              key={t}
              x={x(t)}
              y={PAD.top + plotH + 18}
              textAnchor={t === 0 ? 'start' : t === 1 ? 'end' : 'middle'}
              className="num"
              fontSize="10"
              fill="var(--color-fg-3)"
            >
              {Math.round(t * 100)}%
            </text>
          ))}
          <text
            x={x(0.5)}
            y={H - 2}
            textAnchor="middle"
            className="num"
            fontSize="10"
            fill="var(--color-fg-3)"
          >
            activation rate
          </text>
        </svg>
      </div>

      {/* Controls */}
      <div className="border-t border-line px-5 py-5">
        <div className="grid gap-x-10 gap-y-5 md:grid-cols-2">
          <div>
            <div className="flex items-baseline justify-between gap-x-4">
              <label htmlFor="bay-n" className="eyebrow">
                Accounts observed
              </label>
              <span className="num text-sm text-signal">n = {n}</span>
            </div>
            <input
              id="bay-n"
              type="range"
              min={0}
              max={MAX_OBSERVED}
              step={1}
              value={n}
              onChange={(e) => {
                const next = parseInt(e.target.value, 10);
                setN(next);
                if (k > next) setK(next);
              }}
              className="mt-3 w-full"
              aria-valuetext={`${n} accounts observed`}
            />
          </div>
          <div>
            <div className="flex items-baseline justify-between gap-x-4">
              <label htmlFor="bay-k" className="eyebrow">
                Activations
              </label>
              <span className="num text-sm text-signal">k = {k}</span>
            </div>
            <input
              id="bay-k"
              type="range"
              min={0}
              max={n}
              step={1}
              value={k}
              onChange={(e) => setK(Math.min(parseInt(e.target.value, 10), n))}
              className="mt-3 w-full"
              aria-valuetext={`${k} activations`}
            />
          </div>
        </div>

        <p className="mt-6 max-w-2xl text-sm leading-relaxed text-fg-2">
          {naive !== null ? (
            <>
              The spreadsheet says this account activates{' '}
              <span className="num">{pct(naive)}</span> of the time. The
              posterior says <span className="num text-model">{pct(postMean)}</span> —
              because {n} observation{n === 1 ? '' : 's'} can&rsquo;t outvote a
              prior carrying the weight of {PRIOR_ALPHA + PRIOR_BETA}{' '}
              pseudo-observations of program history. Push n and k up together
              and watch the data take over: the curve tightens and walks away
              from the prior. An account that activated 1 of 2 times is not a
              50% account. An account that activated 30 of 60 times might be.
            </>
          ) : (
            <>
              With nothing observed, the posterior is the prior — the dashed
              and solid curves coincide. Every forecast starts somewhere; the
              honest ones say where.
            </>
          )}
        </p>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-fg-3">
            In the QBR dashboard this same conjugate update runs on channel
            conversion signals, implemented from first principles rather than
          imported — so a quarterly review stops treating a two-touch sample
          and a two-year track record as equally load-bearing.
        </p>
      </div>

      <div className="num border-t border-line px-5 py-3 text-[11px] text-fg-3">
        Beta({PRIOR_ALPHA}, {PRIOR_BETA}) prior · posterior Beta(α+k, β+n−k) ·
        densities recomputed on every drag
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
  tone: 'model' | 'risk' | 'signal' | 'neutral';
}) {
  const color =
    tone === 'risk'
      ? 'var(--color-risk)'
      : tone === 'signal'
      ? 'var(--color-signal)'
      : tone === 'neutral'
      ? 'var(--color-fg)'
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

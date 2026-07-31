/**
 * Factor-structured Gaussian copula Monte Carlo.
 *
 * This is a browser port of the model in the Partner ACV Forecast Engine.
 * The mechanism, in full:
 *
 *   F     ~ N(0,1)                    one shared market factor per trial
 *   eps_i ~ N(0,1)                    one idiosyncratic draw per deal
 *   Z_i   = sqrt(w)*F + sqrt(1-w)*eps_i
 *
 * Because Var(Z_i) = w + (1-w) = 1, each Z_i is still standard normal, so
 * deal i closing when Z_i < probit(p_i) preserves its marginal probability
 * exactly. w only changes how the deals move *together*, never how likely
 * any one of them is on its own. That is the entire point: the mean holds
 * still while the tails spread.
 */

export interface Deal {
  name: string;
  segment: 'Agency' | '3PL' | 'SaaS';
  p: number; // marginal close probability
  value: number; // ACV if it closes
}

/** Anonymised. Shape and spread mirror a real quarter; names and values do not. */
export const DEALS: Deal[] = [
  { name: 'Enterprise Retail Partner', segment: 'Agency', p: 0.8, value: 42000 },
  { name: '3PL Network — Midwest', segment: '3PL', p: 0.65, value: 38000 },
  { name: 'Returns Platform', segment: 'SaaS', p: 0.55, value: 31000 },
  { name: 'Marketplace Agency — West', segment: 'Agency', p: 0.75, value: 24000 },
  { name: 'Fulfillment SaaS', segment: 'SaaS', p: 0.45, value: 28000 },
  { name: 'Freight Tech Vendor', segment: 'SaaS', p: 0.35, value: 22000 },
  { name: 'Brand Aggregator', segment: 'Agency', p: 0.6, value: 19000 },
  { name: 'Retail Media Agency', segment: 'Agency', p: 0.5, value: 17000 },
  { name: 'Cross-Border 3PL', segment: '3PL', p: 0.3, value: 26000 },
  { name: 'Inventory Platform', segment: 'SaaS', p: 0.7, value: 14000 },
  { name: 'Ad Management Agency', segment: 'Agency', p: 0.4, value: 12000 },
  { name: 'Logistics Consultancy', segment: '3PL', p: 0.25, value: 9000 },
];

/** Committed run-rate from already-active partners. Not at risk in the sim. */
export const BASE_RUN_RATE = 45000;
export const TARGET = 215000;
/** The number you've told leadership you will not go below. */
export const FLOOR = 175000;
/** Reproduces the ~41% widening the real engine found on the real pipeline. */
export const DEFAULT_W = 0.17;

/**
 * Inverse standard normal CDF (probit).
 * Acklam's rational approximation — accurate to ~1.15e-9 across the range,
 * which is far tighter than anything a 5,000-trial simulation could resolve.
 */
export function probit(p: number): number {
  if (p <= 0) return -Infinity;
  if (p >= 1) return Infinity;

  const a = [-3.969683028665376e1, 2.209460984245205e2, -2.759285104469687e2,
             1.38357751867269e2, -3.066479806614716e1, 2.506628277459239];
  const b = [-5.447609879822406e1, 1.615858368580409e2, -1.556989798598866e2,
             6.680131188771972e1, -1.328068155288572e1];
  const c = [-7.784894002430293e-3, -3.223964580411365e-1, -2.400758277161838,
             -2.549732539343734, 4.374664141464968, 2.938163982698783];
  const d = [7.784695709041462e-3, 3.224671290700398e-1, 2.445134137142996,
             3.754408661907416];

  const plow = 0.02425;
  const phigh = 1 - plow;
  let q: number, r: number;

  if (p < plow) {
    q = Math.sqrt(-2 * Math.log(p));
    return (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
           ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
  }
  if (p > phigh) {
    q = Math.sqrt(-2 * Math.log(1 - p));
    return -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
            ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
  }
  q = p - 0.5;
  r = q * q;
  return (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q /
         (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1);
}

/** Mulberry32 — small, fast, seedable. Seeded so the chart is stable across renders. */
function rng(seed: number) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface SimResult {
  totals: Float64Array;
  p10: number;
  p50: number;
  p90: number;
  spread: number;
  pHitTarget: number;
  pMissFloor: number;
  mean: number;
}

export function simulate(w: number, trials = 5000, seed = 20260731): SimResult {
  const rand = rng(seed);
  const thresholds = DEALS.map((d) => probit(d.p));
  const values = DEALS.map((d) => d.value);
  const n = DEALS.length;

  const sqrtW = Math.sqrt(w);
  const sqrtOneMinusW = Math.sqrt(1 - w);
  const totals = new Float64Array(trials);

  // Box-Muller, buffering the spare deviate rather than discarding it.
  let spare: number | null = null;
  const normal = (): number => {
    if (spare !== null) {
      const s = spare;
      spare = null;
      return s;
    }
    let u = 0, v = 0, s = 0;
    do {
      u = rand() * 2 - 1;
      v = rand() * 2 - 1;
      s = u * u + v * v;
    } while (s === 0 || s >= 1);
    const mul = Math.sqrt((-2 * Math.log(s)) / s);
    spare = v * mul;
    return u * mul;
  };

  let sum = 0;
  let hits = 0;
  let misses = 0;
  for (let t = 0; t < trials; t++) {
    const F = normal();
    let booked = BASE_RUN_RATE;
    for (let i = 0; i < n; i++) {
      const z = sqrtW * F + sqrtOneMinusW * normal();
      if (z < thresholds[i]) booked += values[i];
    }
    totals[t] = booked;
    sum += booked;
    if (booked >= TARGET) hits++;
    if (booked < FLOOR) misses++;
  }

  const sorted = Float64Array.from(totals).sort();
  const q = (f: number) => sorted[Math.min(trials - 1, Math.floor(f * trials))];
  const p10 = q(0.1);
  const p50 = q(0.5);
  const p90 = q(0.9);

  return {
    totals,
    p10,
    p50,
    p90,
    spread: p90 - p10,
    pHitTarget: hits / trials,
    pMissFloor: misses / trials,
    mean: sum / trials,
  };
}

export interface Bin {
  x0: number;
  x1: number;
  count: number;
}

export function histogram(totals: Float64Array, binCount: number, lo: number, hi: number): Bin[] {
  const width = (hi - lo) / binCount;
  const bins: Bin[] = Array.from({ length: binCount }, (_, i) => ({
    x0: lo + i * width,
    x1: lo + (i + 1) * width,
    count: 0,
  }));
  for (let i = 0; i < totals.length; i++) {
    let idx = Math.floor((totals[i] - lo) / width);
    if (idx < 0) idx = 0;
    if (idx >= binCount) idx = binCount - 1;
    bins[idx].count++;
  }
  return bins;
}

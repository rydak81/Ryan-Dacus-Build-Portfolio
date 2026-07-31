/**
 * Beta-conjugate updating on a partner activation rate.
 *
 * Browser port of the inference mechanism in the QBR dashboard, where it
 * runs on partner conversion signals. The mechanism, in full:
 *
 *   prior      rate ~ Beta(α, β)
 *   observe    n partners, k activations
 *   posterior  rate ~ Beta(α + k, β + n − k)
 *
 * The prior acts as α + β pseudo-observations of program history. A partner
 * observed twice cannot outvote it; a partner observed sixty times can.
 * That is the entire argument for shrinkage in a QBR: small samples get
 * pulled toward the base rate instead of being reported at face value.
 */

/**
 * Illustrative program-level prior: mean α/(α+β) = 1/3, carrying the weight
 * of twelve pseudo-observations. Not fitted to real partner data.
 */
export const PRIOR_ALPHA = 4;
export const PRIOR_BETA = 8;

/** Slider bounds for the observed data. */
export const MAX_OBSERVED = 60;
export const DEFAULT_N = 2;
export const DEFAULT_K = 1;

/** Lanczos approximation (g = 7). More precision than the chart can show. */
const LG = [
  676.5203681218851, -1259.1392167224028, 771.32342877765313,
  -176.61502916214059, 12.507343278686905, -0.13857109526572012,
  9.9843695780195716e-6, 1.5056327351493116e-7,
];

export function logGamma(z: number): number {
  if (z < 0.5) {
    return Math.log(Math.PI / Math.sin(Math.PI * z)) - logGamma(1 - z);
  }
  z -= 1;
  let s = 0.99999999999980993;
  for (let i = 0; i < LG.length; i++) s += LG[i] / (z + i + 1);
  const t = z + 7.5;
  return 0.5 * Math.log(2 * Math.PI) + (z + 0.5) * Math.log(t) - t + Math.log(s);
}

const logBeta = (a: number, b: number) => logGamma(a) + logGamma(b) - logGamma(a + b);

/**
 * Beta density. Math.pow handles the endpoints: pow(0, 0) = 1, and for the
 * α, β ≥ 1 range this site uses, pow(0, α−1) is 0 or 1, never Infinity.
 */
export function betaPdf(x: number, a: number, b: number): number {
  if (x < 0 || x > 1) return 0;
  return Math.pow(x, a - 1) * Math.pow(1 - x, b - 1) * Math.exp(-logBeta(a, b));
}

export const betaMean = (a: number, b: number) => a / (a + b);

export function posterior(k: number, n: number): { alpha: number; beta: number } {
  return { alpha: PRIOR_ALPHA + k, beta: PRIOR_BETA + n - k };
}

export interface DensityGrid {
  xs: number[];
  ys: number[];
  peak: number;
}

export function densityGrid(a: number, b: number, points = 241): DensityGrid {
  const xs: number[] = [];
  const ys: number[] = [];
  let peak = 0;
  for (let i = 0; i < points; i++) {
    const x = i / (points - 1);
    const y = betaPdf(x, a, b);
    xs.push(x);
    ys.push(y);
    if (y > peak) peak = y;
  }
  return { xs, ys, peak };
}

/**
 * Equal-tailed credible interval, by trapezoid-integrating the density and
 * inverting the CDF numerically. Exact enough for a chart; no incomplete
 * beta function needed.
 */
export function credibleInterval(a: number, b: number, mass = 0.9): [number, number] {
  const points = 2001;
  const dx = 1 / (points - 1);
  const cdf = new Float64Array(points);
  let prev = betaPdf(0, a, b);
  for (let i = 1; i < points; i++) {
    const cur = betaPdf(i * dx, a, b);
    cdf[i] = cdf[i - 1] + ((prev + cur) / 2) * dx;
    prev = cur;
  }
  const total = cdf[points - 1];
  const lo = (1 - mass) / 2;
  const hi = 1 - lo;
  let loX = 0;
  let hiX = 1;
  for (let i = 0; i < points; i++) {
    const c = cdf[i] / total;
    if (loX === 0 && c >= lo) loX = i * dx;
    if (c >= hi) {
      hiX = i * dx;
      break;
    }
  }
  return [loX, hiX];
}

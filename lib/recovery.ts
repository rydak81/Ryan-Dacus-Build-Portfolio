/**
 * Bottom-up marketplace recovery model.
 *
 * Browser port of the corrected recovery model from the Amazon Recovery &
 * Profitability Suite engine. The mechanism, in full:
 *
 *   lost units          = annual units × loss/damage rate
 *   reimbursement/unit  = landed COGS = COGS share × average selling price
 *   recoverable value   = lost units × reimbursement per unit
 *
 * Amazon's post-March-2025 reimbursement policy pays out at manufacturing
 * cost, not retail price, so the model is sized on units × manufacturing
 * cost — never as a percentage of revenue. Divide recoverable value by
 * revenue and the reason percentage-of-revenue sizing fails falls out of
 * the algebra:
 *
 *   rate = (units × loss × cogsShare × asp) / (units × asp)
 *        = loss × cogsShare
 *
 * Units and average selling price cancel. The recovery *rate* — the number
 * that gets quoted in every sizing conversation — answers only to landed
 * COGS as a share of retail price and to the loss rate.
 */

export interface RecoveryInputs {
  /** Annual units sold. */
  units: number;
  /** Average selling price, USD. */
  asp: number;
  /** Landed COGS as a share of retail price, 0–1. */
  cogsShare: number;
  /** Share of units lost or damaged annually, 0–1. */
  lossRate: number;
}

/** Illustrative mid-market seller. Not client data. */
export const DEFAULT_INPUTS: RecoveryInputs = {
  units: 50000,
  asp: 28,
  cogsShare: 0.32,
  lossRate: 0.015,
};

/** Slider bounds. Illustrative, like the defaults. */
export const RANGES = {
  units: { min: 5000, max: 200000, step: 1000 },
  asp: { min: 8, max: 120, step: 1 },
  cogsShare: { min: 0.1, max: 0.6, step: 0.01 },
  lossRate: { min: 0.002, max: 0.05, step: 0.001 },
} as const;

export const INPUT_LABELS: Record<keyof RecoveryInputs, string> = {
  units: 'Annual units',
  asp: 'Average selling price',
  cogsShare: 'COGS share of retail',
  lossRate: 'Loss / damage rate',
};

export interface RecoveryResult {
  revenue: number;
  lostUnits: number;
  reimbPerUnit: number;
  recoverable: number;
  /** recoverable / revenue — the quoted number. Equals loss × cogsShare. */
  rate: number;
}

export function computeRecovery(i: RecoveryInputs): RecoveryResult {
  const revenue = i.units * i.asp;
  const lostUnits = i.units * i.lossRate;
  const reimbPerUnit = i.cogsShare * i.asp;
  const recoverable = lostUnits * reimbPerUnit;
  return {
    revenue,
    lostUnits,
    reimbPerUnit,
    recoverable,
    rate: revenue > 0 ? recoverable / revenue : 0,
  };
}

/** How hard each input is pushed for the sensitivity readout. */
export const SENSITIVITY_BUMP = 0.2;

export interface SensitivityRow {
  key: keyof RecoveryInputs;
  label: string;
  /** Relative change in recoverable dollars from a +20% bump. */
  dollarsDelta: number;
  /** Relative change in recovery rate (% of revenue) from the same bump. */
  rateDelta: number;
}

/**
 * Bump each input by SENSITIVITY_BUMP and recompute, rather than reading
 * derivatives off the closed form — the zeros have to be earned by the
 * model, not asserted by the chart.
 */
export function sensitivity(i: RecoveryInputs): SensitivityRow[] {
  const base = computeRecovery(i);
  return (Object.keys(INPUT_LABELS) as (keyof RecoveryInputs)[]).map((key) => {
    const bumped = computeRecovery({ ...i, [key]: i[key] * (1 + SENSITIVITY_BUMP) });
    return {
      key,
      label: INPUT_LABELS[key],
      dollarsDelta: base.recoverable > 0 ? bumped.recoverable / base.recoverable - 1 : 0,
      rateDelta: base.rate > 0 ? bumped.rate / base.rate - 1 : 0,
    };
  });
}

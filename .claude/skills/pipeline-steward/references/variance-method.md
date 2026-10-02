# Variance method

Read this when you need to justify a conclusion from eval results, or decide how
many repeats a decision needs.

## Contents

- [What is being measured](#what-is-being-measured)
- [Why Wilson intervals](#why-wilson-intervals)
- [How many reps](#how-many-reps)
- [Why near-zero variance is the wrong target](#why-near-zero-variance-is-the-wrong-target)
- [Reading the flags](#reading-the-flags)

## What is being measured

Each rep of an eval either passes or fails, so a configuration's results are
Bernoulli trials. With `k` passes in `n` reps:

- pass rate `p̂ = k/n`
- variance of the pass indicator `= p̂(1 − p̂)`

That variance peaks at `p̂ = 0.5` (value 0.25) and falls to zero at both `p̂ = 0`
and `p̂ = 1`. This is the whole reason variance alone is useless as a score: it
cannot distinguish "always right" from "always wrong."

The source of the spread is model sampling nondeterminism interacting with
underspecified instructions. You cannot remove the sampling. You can remove the
underspecification, and that is what a flaky flag is pointing at.

## Why Wilson intervals

The textbook normal approximation is `p̂ ± z·√(p̂(1−p̂)/n)`. At `p̂ = 1` the radical
is zero, so 3/3 reports `[1.00, 1.00]` — certainty from three observations. It is
confidently wrong exactly where eval results usually land.

The Wilson score interval instead solves for where the true proportion could be
given the observed count:

```
center = (p̂ + z²/2n) / (1 + z²/n)
margin = z·√(p̂(1−p̂)/n + z²/4n²) / (1 + z²/n)
```

At 3/3 with z = 1.96 this gives roughly `[0.44, 1.00]`. Worth internalizing: three
clean runs are consistent with a true pass rate as low as 44%.

## How many reps

Approximate 95% CI width for a true rate near 0.8:

| n | CI width | What it supports |
|---|---|---|
| 3 | 0.73 | nothing; the interval spans most of the range |
| 5 | 0.59 | barely a smell test |
| 10 | 0.45 | "this is probably above half" |
| 20 | 0.34 | comparing two versions that differ a lot |
| 50 | 0.22 | comparing two versions that differ a little |

(Computed with `wilson_interval(round(0.8n), n)` — reproduce them rather than
trusting this table; an earlier draft of it was wrong by a full row.)

The practical consequence: **a 3-rep run cannot tell you whether a change helped.**
Use 3 reps to find flakiness, which only needs a mixed result to show up at all.
Use 20+ before claiming one version beats another, and if that is too expensive,
report the comparison as inconclusive rather than quoting a point estimate. A
confident number from 3 reps is worse than no number, because it gets repeated.

## Why near-zero variance is the wrong target

Three failure modes it drives you into:

1. **Consistent wrongness scores perfectly.** `p̂ = 0` has zero variance.
2. **Overfitting.** Instructions tightened until a fixed eval set stops wobbling are
   instructions tuned to that set. Held-out inputs get worse while the dashboard
   improves.
3. **Suppressing a real signal.** Flakiness is information about where instructions
   are ambiguous. Optimizing it away directly — rather than by fixing the ambiguity —
   destroys the measurement while leaving the fault.

Use pass rate as the objective, variance as the diagnostic, and a held-out set to
catch the overfitting that the main set cannot show you.

## Reading the flags

| Flag | Means | Do |
|---|---|---|
| `flaky-eval` | mixed outcomes on identical inputs | find the ambiguous instruction; do not re-run until green |
| `always-failing` | 0% pass, zero variance | the skill or the assertion is wrong — check the assertion first |
| `wide-interval` | CI too wide to act on | add reps, or report as inconclusive |
| `insufficient-reps` | below `--min-trials` | variance is unmeasurable; add reps |
| `non-discriminating-assertion` | 100% with and without the skill | replace it; it cannot catch a regression |

A `non-discriminating-assertion` is the one most worth acting on. Each one inflates
the headline pass rate while measuring nothing, so a suite full of them reports
health that is not there.

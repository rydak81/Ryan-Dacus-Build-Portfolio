#!/usr/bin/env python3
"""Measure skill-output consistency across repeated runs of the same eval.

The objective is pass rate. Variance is a *diagnostic*: an eval that passes half
the time is telling you the instructions are ambiguous, because the same prompt and
the same skill produced different outcomes. That is a fixable fault, and it is the
useful thing this script surfaces.

Driving variance to zero is explicitly not the goal. A skill that fails identically
every run has zero variance and no value, so this reports pass rate and variance
side by side and refuses to rank on variance alone.

Expected layout (reps are what make variance measurable at all):

    workspace/iteration-1/
      <eval-name>/
        with_skill/rep-1/grading.json
        with_skill/rep-2/grading.json
        without_skill/rep-1/grading.json

grading.json follows skill-creator's schema: {"expectations": [{"text", "passed", "evidence"}]}
"""

from __future__ import annotations

import argparse
import json
import math
import sys
from collections import defaultdict
from pathlib import Path

Z95 = 1.959964


def wilson_interval(successes: int, trials: int, z: float = Z95) -> tuple[float, float]:
    """Wilson score interval for a proportion.

    Used instead of the textbook normal approximation because that one produces
    nonsense at the edges -- with 3/3 passes it gives [1.0, 1.0], implying certainty
    from three observations. Wilson stays honest about how little small N tells you.
    """
    if trials == 0:
        return (0.0, 1.0)
    p = successes / trials
    denom = 1 + z * z / trials
    center = (p + z * z / (2 * trials)) / denom
    margin = z * math.sqrt(p * (1 - p) / trials + z * z / (4 * trials * trials)) / denom
    return (max(0.0, center - margin), min(1.0, center + margin))


def collect(workspace: Path) -> dict:
    """Walk a workspace and group grading results by (eval, config)."""
    runs: dict[tuple[str, str], list[dict]] = defaultdict(list)
    for grading_path in sorted(workspace.rglob("grading.json")):
        relative = grading_path.relative_to(workspace).parts
        if len(relative) < 2:
            continue
        eval_name = relative[0]
        config = relative[1]
        try:
            payload = json.loads(grading_path.read_text())
        except json.JSONDecodeError:
            print(f"  warn: {grading_path} is not valid JSON, skipped", file=sys.stderr)
            continue
        runs[(eval_name, config)].append(payload)
    return runs


def analyze(runs: dict) -> dict:
    """Per (eval, config): overall pass rate, and per-assertion pass rate."""
    results = {}
    for (eval_name, config), payloads in sorted(runs.items()):
        trials = len(payloads)
        whole_run_passes = 0
        per_assertion: dict[str, int] = defaultdict(int)
        assertion_trials: dict[str, int] = defaultdict(int)

        for payload in payloads:
            expectations = payload.get("expectations", [])
            if expectations and all(e.get("passed") for e in expectations):
                whole_run_passes += 1
            for expectation in expectations:
                text = expectation.get("text", "(unnamed)")
                assertion_trials[text] += 1
                if expectation.get("passed"):
                    per_assertion[text] += 1

        p = whole_run_passes / trials if trials else 0.0
        low, high = wilson_interval(whole_run_passes, trials)
        results[(eval_name, config)] = {
            "trials": trials,
            "passes": whole_run_passes,
            "pass_rate": p,
            # Bernoulli variance of the pass indicator. Peaks at p=0.5, which is
            # exactly the "coin flip" regime that signals ambiguous instructions.
            "variance": p * (1 - p),
            "ci95": (low, high),
            "ci_width": high - low,
            "assertions": {
                text: {
                    "passes": per_assertion[text],
                    "trials": assertion_trials[text],
                    "pass_rate": per_assertion[text] / assertion_trials[text],
                }
                for text in sorted(assertion_trials)
            },
        }
    return results


def diagnose(results: dict, min_trials: int, flaky_band: tuple[float, float]) -> list[dict]:
    findings = []
    low_band, high_band = flaky_band

    by_eval: dict[str, dict[str, dict]] = defaultdict(dict)
    for (eval_name, config), stats in results.items():
        by_eval[eval_name][config] = stats

    for (eval_name, config), stats in sorted(results.items()):
        if stats["trials"] < min_trials:
            findings.append(
                {
                    "kind": "insufficient-reps",
                    "summary": f"{eval_name}/{config}: only {stats['trials']} rep(s)",
                    "recommendation": f"run at least {min_trials} reps; variance is unmeasurable below that",
                }
            )
            continue

        if low_band < stats["pass_rate"] < high_band:
            findings.append(
                {
                    "kind": "flaky-eval",
                    "summary": (
                        f"{eval_name}/{config}: pass rate {stats['pass_rate']:.0%} "
                        f"({stats['passes']}/{stats['trials']}), variance {stats['variance']:.3f}"
                    ),
                    "recommendation": (
                        "identical inputs produced different outcomes -- find the ambiguous "
                        "instruction rather than re-running until it passes"
                        if config == "with_skill"
                        else "unstable baseline; the eval itself may be underspecified, "
                        "which makes any skill comparison against it unreliable"
                    ),
                }
            )

        if stats["pass_rate"] == 0.0:
            findings.append(
                {
                    "kind": "always-failing",
                    "summary": f"{eval_name}/{config}: 0/{stats['trials']} passes",
                    "recommendation": "zero variance but zero value; the skill or the assertion is wrong",
                }
            )

        if stats["ci_width"] > 0.5:
            findings.append(
                {
                    "kind": "wide-interval",
                    "summary": (
                        f"{eval_name}/{config}: 95% CI is "
                        f"[{stats['ci95'][0]:.2f}, {stats['ci95'][1]:.2f}] -- too wide to act on"
                    ),
                    "recommendation": "add reps before concluding anything about this eval",
                }
            )

    # An assertion that passes at the same rate with and without the skill is not
    # measuring the skill. It inflates the pass rate and hides real regressions.
    for eval_name, configs in sorted(by_eval.items()):
        with_skill = configs.get("with_skill")
        baseline = next((configs[k] for k in configs if k != "with_skill"), None)
        if not with_skill or not baseline:
            continue
        for text, stats in with_skill["assertions"].items():
            base = baseline["assertions"].get(text)
            if not base:
                continue
            if abs(stats["pass_rate"] - base["pass_rate"]) < 0.01 and stats["pass_rate"] > 0.99:
                findings.append(
                    {
                        "kind": "non-discriminating-assertion",
                        "summary": f"{eval_name}: '{text}' passes 100% with and without the skill",
                        "recommendation": "replace it; it cannot detect a regression",
                    }
                )
    return findings


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("workspace", help="Iteration directory containing grading.json files.")
    parser.add_argument("--min-trials", type=int, default=3)
    parser.add_argument(
        "--flaky-low", type=float, default=0.15, help="Below this, treat as failing, not flaky."
    )
    parser.add_argument(
        "--flaky-high", type=float, default=0.85, help="Above this, treat as passing, not flaky."
    )
    parser.add_argument("--json", action="store_true")
    args = parser.parse_args()

    workspace = Path(args.workspace)
    if not workspace.exists():
        raise SystemExit(f"workspace not found: {workspace}")

    runs = collect(workspace)
    if not runs:
        raise SystemExit(f"no grading.json files found under {workspace}")

    results = analyze(runs)
    findings = diagnose(results, args.min_trials, (args.flaky_low, args.flaky_high))

    if args.json:
        print(
            json.dumps(
                {
                    "results": {f"{e}/{c}": v for (e, c), v in results.items()},
                    "findings": findings,
                },
                indent=2,
                default=list,
            )
        )
        return 1 if findings else 0

    print(f"{'eval / config':<46} {'pass':>8} {'rate':>7} {'var':>7} {'95% CI':>16}")
    print("-" * 88)
    for (eval_name, config), stats in sorted(results.items()):
        low, high = stats["ci95"]
        print(
            f"{eval_name + ' / ' + config:<46} "
            f"{stats['passes']}/{stats['trials']:<6} "
            f"{stats['pass_rate']:>6.0%} "
            f"{stats['variance']:>7.3f} "
            f"{'[' + format(low, '.2f') + ', ' + format(high, '.2f') + ']':>16}"
        )

    if findings:
        print(f"\n{len(findings)} finding(s):")
        for finding in findings:
            print(f"\n  {finding['kind']}")
            print(f"    {finding['summary']}")
            print(f"    -> {finding['recommendation']}")
    else:
        print("\nno findings")

    return 1 if findings else 0


if __name__ == "__main__":
    sys.exit(main())

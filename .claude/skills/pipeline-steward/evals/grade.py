#!/usr/bin/env python3
"""Grade add-ticker-nvda runs programmatically.

The assertions are all mechanically checkable, so grading them with a script rather
than an LLM judge removes the grader itself as a source of variance -- which matters
in a run whose purpose is measuring variance.

Emits grading.json in skill-creator's schema so variance.py and the eval viewer
both read it without translation.
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

sys.path.insert(
    0, str(Path(__file__).resolve().parents[2] / "market-data-ingest" / "scripts")
)
import datetime as dt  # noqa: E402

from validate import check_envelope  # noqa: E402

BASELINE_TICKERS = {"AAPL", "AMZN", "SHOP"}


def grade(run_dir: Path) -> dict:
    """run_dir holds the files a run copied out: tickers.json, NVDA.json, manifest.json."""
    out = run_dir / "outputs"
    expectations = []

    def check(text: str, passed: bool, evidence: str = ""):
        expectations.append({"text": text, "passed": bool(passed), "evidence": evidence})

    # 1. config
    config_path = out / "tickers.json"
    config = {}
    if config_path.exists():
        try:
            config = json.loads(config_path.read_text())
        except json.JSONDecodeError as exc:
            check("NVDA present in ticker config", False, f"config is not valid JSON: {exc}")
            config = None
    if config is None:
        pass
    elif not config_path.exists():
        check("NVDA present in ticker config", False, "tickers.json not captured")
    else:
        tickers = config.get("tickers", [])
        check("NVDA present in ticker config", "NVDA" in tickers, f"tickers={tickers}")
        check(
            "existing tickers still intact",
            BASELINE_TICKERS.issubset(set(tickers)),
            f"missing={sorted(BASELINE_TICKERS - set(tickers))}",
        )

    # 2. fixture
    fixture = out / "NVDA.fixture.json"
    if fixture.exists():
        try:
            payload = json.loads(fixture.read_text())
            check(
                "NVDA fixture generated via make_fixtures.py",
                payload.get("_synthetic") is True and bool(payload.get("bars")),
                f"_synthetic={payload.get('_synthetic')}, bars={len(payload.get('bars', []))}",
            )
        except json.JSONDecodeError as exc:
            check("NVDA fixture generated via make_fixtures.py", False, str(exc))
    else:
        check("NVDA fixture generated via make_fixtures.py", False, "no fixture captured")

    # 3 + 4. envelope
    envelope_path = out / "NVDA.json"
    if envelope_path.exists():
        check("data/market/NVDA.json exists", True, "captured")
        try:
            envelope = json.loads(envelope_path.read_text())
            problems = check_envelope(envelope, dt.datetime.now(dt.timezone.utc))
            check(
                "NVDA envelope passes all validation gates",
                not problems,
                "clean" if not problems else "; ".join(problems[:3]),
            )
        except json.JSONDecodeError as exc:
            check("NVDA envelope passes all validation gates", False, str(exc))
    else:
        check("data/market/NVDA.json exists", False, "not captured")
        check("NVDA envelope passes all validation gates", False, "no envelope")

    # 5 + 6. manifest
    manifest_path = out / "manifest.json"
    if manifest_path.exists():
        try:
            manifest = json.loads(manifest_path.read_text())
            entries = manifest.get("tickers", {})
            check("manifest.json lists NVDA", "NVDA" in entries, f"tickers={sorted(entries)}")
            check(
                "manifest ticker_count matches envelope count",
                manifest.get("ticker_count") == len(entries),
                f"ticker_count={manifest.get('ticker_count')}, entries={len(entries)}",
            )
        except json.JSONDecodeError as exc:
            check("manifest.json lists NVDA", False, str(exc))
            check("manifest ticker_count matches envelope count", False, str(exc))
    else:
        check("manifest.json lists NVDA", False, "no manifest captured")
        check("manifest ticker_count matches envelope count", False, "no manifest captured")

    return {"expectations": expectations}


def main() -> int:
    if len(sys.argv) < 2:
        raise SystemExit("usage: grade.py <workspace-iteration-dir>")
    root = Path(sys.argv[1])
    graded = 0
    for run_dir in sorted(root.glob("*/*/rep-*")):
        result = grade(run_dir)
        (run_dir / "grading.json").write_text(json.dumps(result, indent=2) + "\n")
        passed = sum(1 for e in result["expectations"] if e["passed"])
        total = len(result["expectations"])
        print(f"{run_dir.relative_to(root)}: {passed}/{total} assertions passed")
        graded += 1
    print(f"\ngraded {graded} run(s)")
    return 0


if __name__ == "__main__":
    sys.exit(main())

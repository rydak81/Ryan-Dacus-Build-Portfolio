#!/usr/bin/env python3
"""Prove every validation gate actually fires.

A validator nobody has seen fail is indistinguishable from one that always passes,
and that is the failure mode that lets bad data through for months. Each case here
is a minimal envelope that trips exactly one gate.
"""

from __future__ import annotations

import datetime as dt
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "scripts"))
from validate import check_envelope  # noqa: E402

NOW = dt.datetime(2026, 10, 2, 12, 0, 0, tzinfo=dt.timezone.utc)


def bar(t=1_767_225_600_000, o=100.0, h=101.0, l=99.0, c=100.5, v=1000.0):
    return {"t": t, "o": o, "h": h, "l": l, "c": c, "v": v}


def envelope(bars, **overrides):
    base = {
        "ticker": "TEST",
        "source": "fixture",
        "fetched_at": "2026-10-02T11:00:00Z",
        "bar_count": len(bars),
        "bars": bars,
    }
    base.update(overrides)
    return base


DAY = 86_400_000

CASES = [
    ("clean envelope passes", envelope([bar(), bar(t=1_767_225_600_000 + DAY)]), None),
    ("missing required key", {"ticker": "T", "bars": [bar()]}, "missing required key"),
    ("empty bars", envelope([]), "bars is empty"),
    ("bar_count mismatch", envelope([bar()], bar_count=99), "disagrees"),
    ("null OHLCV field", envelope([bar(c=None)]), "missing/null field"),
    (
        "non-increasing timestamps",
        envelope([bar(t=2000), bar(t=2000)]),
        "is not after previous",
    ),
    ("high below low", envelope([bar(h=50.0, l=60.0, o=55.0, c=55.0)]), "below low"),
    ("high below close", envelope([bar(h=100.0, c=200.0, o=99.0, l=98.0)]), "below open"),
    ("low above open", envelope([bar(l=200.0, o=100.0, c=150.0, h=250.0)]), "above open"),
    ("negative volume", envelope([bar(v=-5.0)]), "negative volume"),
    ("malformed fetched_at", envelope([bar()], fetched_at="last tuesday"), "not ISO-8601"),
    (
        "future fetched_at",
        envelope([bar()], fetched_at="2027-01-01T00:00:00Z"),
        "in the future",
    ),
]


def main() -> int:
    failures = 0
    for name, payload, expect in CASES:
        problems = check_envelope(payload, NOW)
        if expect is None:
            ok = not problems
            detail = "no problems" if ok else f"unexpected: {problems}"
        else:
            ok = any(expect in p for p in problems)
            detail = f"matched {expect!r}" if ok else f"expected {expect!r}, got {problems}"
        print(f"{'PASS' if ok else 'FAIL'}  {name}: {detail}")
        if not ok:
            failures += 1

    print(f"\n{len(CASES) - failures}/{len(CASES)} gate tests passed")
    return 1 if failures else 0


if __name__ == "__main__":
    sys.exit(main())

#!/usr/bin/env python3
"""Gate market-data envelopes before they are promoted, and check freshness after.

Exit code 0 means every gate passed. Non-zero means do not promote, and in CI means
do not commit. Each gate here exists because that specific shape of bad data has
produced a silently wrong number -- see the table in SKILL.md.
"""

from __future__ import annotations

import argparse
import datetime as dt
import json
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[4]
DEFAULT_OUT = REPO_ROOT / "data" / "market"
OHLCV = ("o", "h", "l", "c", "v")


def parse_stamp(value: str) -> dt.datetime:
    """Parse an ISO-8601 UTC stamp. Raises ValueError on anything else."""
    return dt.datetime.strptime(value, "%Y-%m-%dT%H:%M:%SZ").replace(tzinfo=dt.timezone.utc)


def check_envelope(payload: dict, now: dt.datetime) -> list[str]:
    """Return a list of gate failures for one envelope. Empty list means it passed."""
    problems: list[str] = []

    for key in ("ticker", "source", "fetched_at", "bar_count", "bars"):
        if key not in payload:
            problems.append(f"envelope missing required key '{key}'")
    if problems:
        return problems  # further checks would just raise KeyError

    try:
        fetched = parse_stamp(payload["fetched_at"])
    except (ValueError, TypeError):
        problems.append(f"fetched_at is not ISO-8601 UTC: {payload['fetched_at']!r}")
    else:
        # A future stamp means a clock problem. Left alone, freshness checks would
        # then never fire and the data would age indefinitely while looking current.
        if fetched > now + dt.timedelta(minutes=5):
            problems.append(f"fetched_at is in the future: {payload['fetched_at']}")

    bars = payload["bars"]
    if not isinstance(bars, list) or not bars:
        problems.append("bars is empty -- a 200 with zero bars means a bad ticker or window")
        return problems

    if payload["bar_count"] != len(bars):
        problems.append(
            f"bar_count {payload['bar_count']} disagrees with {len(bars)} bars present "
            "-- indicates a truncated write"
        )

    previous_t = None
    for index, bar in enumerate(bars):
        missing = [f for f in OHLCV + ("t",) if bar.get(f) is None]
        if missing:
            problems.append(f"bar {index}: missing/null field(s) {', '.join(missing)}")
            continue

        if previous_t is not None and bar["t"] <= previous_t:
            problems.append(
                f"bar {index}: timestamp {bar['t']} is not after previous {previous_t}"
            )
        previous_t = bar["t"]

        o, h, l, c, v = (bar[f] for f in OHLCV)
        if h < l:
            problems.append(f"bar {index}: high {h} below low {l}")
        if h < o or h < c:
            problems.append(f"bar {index}: high {h} below open {o} or close {c}")
        if l > o or l > c:
            problems.append(f"bar {index}: low {l} above open {o} or close {c}")
        if v < 0:
            problems.append(f"bar {index}: negative volume {v}")

    return problems


def validate_dir(directory: Path) -> int:
    files = sorted(p for p in directory.glob("*.json") if p.name != "manifest.json")
    if not files:
        print(f"no envelopes found in {directory}", file=sys.stderr)
        return 1

    now = dt.datetime.now(dt.timezone.utc)
    total_failures = 0
    for path in files:
        try:
            payload = json.loads(path.read_text())
        except json.JSONDecodeError as exc:
            print(f"FAIL {path.name}: not valid JSON ({exc})")
            total_failures += 1
            continue

        problems = check_envelope(payload, now)
        if problems:
            total_failures += 1
            print(f"FAIL {path.name}: {len(problems)} gate failure(s)")
            for problem in problems[:10]:
                print(f"       - {problem}")
            if len(problems) > 10:
                print(f"       - ...and {len(problems) - 10} more")
        else:
            print(f"ok   {path.name}: {payload['bar_count']} bars, fetched {payload['fetched_at']}")

    print(f"\n{len(files) - total_failures}/{len(files)} envelopes passed")
    return 1 if total_failures else 0


def check_freshness(directory: Path, max_age_hours: float) -> int:
    manifest_path = directory / "manifest.json"
    if not manifest_path.exists():
        print(f"no manifest at {manifest_path} -- run a promote first", file=sys.stderr)
        return 1

    manifest = json.loads(manifest_path.read_text())
    now = dt.datetime.now(dt.timezone.utc)
    cutoff = dt.timedelta(hours=max_age_hours)

    stale = []
    for ticker, entry in sorted(manifest.get("tickers", {}).items()):
        age = now - parse_stamp(entry["fetched_at"])
        hours = age.total_seconds() / 3600
        flag = "STALE" if age > cutoff else "ok   "
        if age > cutoff:
            stale.append((ticker, hours))
        print(f"{flag} {ticker}: {hours:.1f}h old")

    if stale:
        print(f"\n{len(stale)} ticker(s) exceed the {max_age_hours}h freshness bound")
        return 1
    print(f"\nall {len(manifest.get('tickers', {}))} tickers within {max_age_hours}h")
    return 0


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--staging", help="Validate a staging dir before promoting.")
    parser.add_argument("--out", default=str(DEFAULT_OUT))
    parser.add_argument(
        "--freshness",
        action="store_true",
        help="Check manifest ages instead of envelope contents.",
    )
    parser.add_argument(
        "--max-age-hours",
        type=float,
        default=30.0,
        help="Freshness bound. 30h suits daily bars: tolerates a weekend-adjacent "
        "miss and one failed nightly run. Intraday needs a much tighter value.",
    )
    args = parser.parse_args()

    if args.freshness:
        return check_freshness(Path(args.out), args.max_age_hours)
    return validate_dir(Path(args.staging) if args.staging else Path(args.out))


if __name__ == "__main__":
    sys.exit(main())

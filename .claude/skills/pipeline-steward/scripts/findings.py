#!/usr/bin/env python3
"""Append-only findings log, read at the start of every steward run.

This is the closest honest thing to "the skill learns". Nothing adapts and no
weights change -- what happens is that each run writes what it found to a JSONL
file, and the next run reads that file into context before it starts. Behavior
improves across runs because prior conclusions arrive as input, not because any
model updated. Describe it that way; the distinction matters when someone asks.

Append-only is deliberate: a log you can rewrite is a log that quietly loses the
embarrassing entries, which are the ones worth keeping. So closing a finding adds a
resolution entry pointing at its id rather than editing the original. An id is
derived from the finding's kind and summary, which means re-reporting the same
finding reuses its id -- that is how a recurrence becomes visible instead of
looking like a brand new problem.
"""

from __future__ import annotations

import argparse
import datetime as dt
import hashlib
import json
import sys
from pathlib import Path

LOG_PATH = Path(__file__).resolve().parent.parent / "findings.jsonl"


def finding_id(kind: str, summary: str) -> str:
    """Stable short id. Same fault reported twice gets the same id, by design."""
    digest = hashlib.sha256(f"{kind}|{summary}".encode()).hexdigest()
    return digest[:8]


def append(entry: dict, log_path: Path = LOG_PATH) -> None:
    entry.setdefault("logged_at", dt.datetime.now(dt.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"))
    log_path.parent.mkdir(parents=True, exist_ok=True)
    with log_path.open("a") as handle:
        handle.write(json.dumps(entry, sort_keys=True) + "\n")


def read(log_path: Path = LOG_PATH, limit: int | None = None) -> list[dict]:
    if not log_path.exists():
        return []
    entries = []
    for line in log_path.read_text().splitlines():
        line = line.strip()
        if not line:
            continue
        try:
            entries.append(json.loads(line))
        except json.JSONDecodeError:
            # One corrupt line should not blind the run to every other finding.
            continue
    return entries[-limit:] if limit else entries


def reconcile(entries: list[dict]) -> tuple[list[dict], list[dict], list[dict]]:
    """Fold the append-only log into (open, resolved, recurring).

    Recurring is the important one: a finding reported again *after* it was resolved
    means the earlier fix addressed a symptom. That is worth more attention than a
    brand new finding, so it is reported separately rather than mixed in with open.
    """
    # Order by position in the log, not by logged_at. Timestamps here have
    # second granularity, so a resolution and a re-report landing in the same
    # second were indistinguishable and recurrences were silently swallowed.
    # Append order is the exact ordering an append-only log already has.
    latest: dict[str, tuple[int, dict]] = {}
    resolved_at_seq: dict[str, int] = {}

    for seq, entry in enumerate(entries):
        entry_id = entry.get("id")
        is_resolution = entry.get("kind") == "resolution" or entry.get("status") == "resolved"

        if entry.get("kind") == "resolution":
            for target in entry.get("resolves", []):
                resolved_at_seq[target] = seq
            if entry_id:
                resolved_at_seq.setdefault(entry_id, seq)
            continue

        if not entry_id:
            continue

        # A finding logged with status=resolved is a find-and-fix in one pass -- by
        # far the most common case in practice. It resolves itself at its own seq, so
        # it still appears in the summary instead of disappearing into the void.
        latest[entry_id] = (seq, entry)
        if is_resolution:
            resolved_at_seq.setdefault(entry_id, seq)

    open_items, resolved, recurring = [], [], []
    for entry_id, (seq, entry) in latest.items():
        if entry.get("status") == "wontfix":
            continue
        resolution_seq = resolved_at_seq.get(entry_id)
        if resolution_seq is None:
            open_items.append((seq, entry))
        elif seq > resolution_seq:
            recurring.append((seq, entry))
        else:
            resolved.append((seq, entry))

    unwrap = lambda items: [e for _, e in sorted(items)]  # noqa: E731
    return unwrap(open_items), unwrap(resolved), unwrap(recurring)


def summarize(entries: list[dict]) -> str:
    if not entries:
        return "No prior findings. This is the first steward run."

    open_items, resolved, recurring = reconcile(entries)
    lines = [
        f"{len(entries)} log entries -> {len(open_items)} open, "
        f"{len(resolved)} resolved, {len(recurring)} recurring.",
    ]

    if recurring:
        lines += ["", "RECURRING (a previous fix missed the cause -- start here):"]
        for entry in recurring:
            lines.append(f"  [{entry['id']}] {entry.get('kind')}: {entry.get('summary')}")
            if entry.get("recommendation"):
                lines.append(f"      -> {entry['recommendation']}")

    if open_items:
        lines += ["", "Open:"]
        for entry in open_items:
            lines.append(
                f"  [{entry['id']}] {entry.get('logged_at', '?')} "
                f"{entry.get('kind', 'finding')}: {entry.get('summary', '(none)')}"
            )
            if entry.get("recommendation"):
                lines.append(f"      -> {entry['recommendation']}")

    if resolved:
        lines += ["", f"Resolved ({len(resolved)}):"]
        for entry in resolved[-5:]:
            lines.append(f"  [{entry['id']}] {entry.get('summary', '(none)')}")

    return "\n".join(lines)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    sub = parser.add_subparsers(dest="command", required=True)

    sub.add_parser("read", help="Print the log, reconciled. Run this first in every steward pass.")

    add = sub.add_parser("add", help="Append one finding.")
    add.add_argument("--kind", required=True, help="e.g. audit-error, flaky-eval, gate-failure")
    add.add_argument("--summary", required=True)
    add.add_argument("--recommendation", default="")
    add.add_argument("--status", default="open", choices=["open", "resolved", "wontfix"])
    add.add_argument("--evidence", default="")

    resolve = sub.add_parser("resolve", help="Append a resolution pointing at finding id(s).")
    resolve.add_argument("--resolves", nargs="+", required=True, metavar="ID")
    resolve.add_argument("--summary", required=True)
    resolve.add_argument("--evidence", default="")

    args = parser.parse_args()

    if args.command == "read":
        print(summarize(read()))
        return 0

    if args.command == "add":
        entry_id = finding_id(args.kind, args.summary)
        append(
            {
                "id": entry_id,
                "kind": args.kind,
                "summary": args.summary,
                "recommendation": args.recommendation,
                "status": args.status,
                "evidence": args.evidence,
            }
        )
        print(f"logged [{entry_id}]: {args.summary}")
        return 0

    append(
        {
            "id": finding_id("resolution", args.summary),
            "kind": "resolution",
            "resolves": args.resolves,
            "summary": args.summary,
            "status": "resolved",
            "evidence": args.evidence,
        }
    )
    print(f"logged resolution of {', '.join(args.resolves)}: {args.summary}")
    return 0


if __name__ == "__main__":
    sys.exit(main())

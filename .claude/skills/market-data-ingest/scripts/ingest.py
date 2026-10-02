#!/usr/bin/env python3
"""Fetch market data from Massive into a staging dir, then promote it after validation.

Fetch and promote are deliberately separate. A partially-failed fetch looks like
success from the outside, so nothing reaches data/market/ until validate.py has
passed over the staging copy.
"""

from __future__ import annotations

import argparse
import datetime as dt
import json
import os
import shutil
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[4]
DEFAULT_STAGING = REPO_ROOT / ".market-staging"
DEFAULT_CONFIG = Path(__file__).resolve().parent.parent / "tickers.json"
DEFAULT_OUT = REPO_ROOT / "data" / "market"
FIXTURE_DIR = Path(__file__).resolve().parent.parent / "fixtures"

# Massive's aggregate bars come back either as client objects or plain dicts
# depending on client version, so every field read goes through this.
_FIELD_ALIASES = {
    "t": ("timestamp", "t"),
    "o": ("open", "o"),
    "h": ("high", "h"),
    "l": ("low", "l"),
    "c": ("close", "c"),
    "v": ("volume", "v"),
}


def _utcnow_iso() -> str:
    return dt.datetime.now(dt.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def _read_field(bar, canonical: str):
    """Pull one OHLCV field off a bar that may be an object or a dict."""
    for name in _FIELD_ALIASES[canonical]:
        if isinstance(bar, dict):
            if name in bar and bar[name] is not None:
                return bar[name]
        else:
            value = getattr(bar, name, None)
            if value is not None:
                return value
    return None


def normalize_bar(bar) -> dict:
    return {key: _read_field(bar, key) for key in ("t", "o", "h", "l", "c", "v")}


def fetch_massive(ticker: str, window: dict, resolution: dict) -> list[dict]:
    """Call the Massive REST API. Requires MASSIVE_API_KEY and network egress.

    Uses the official client rather than hand-rolled URLs so pagination is handled
    for us -- list_aggs pages by default, and the `limit` parameter is page size,
    not a total cap.
    """
    api_key = os.environ.get("MASSIVE_API_KEY")
    if not api_key:
        raise SystemExit(
            "MASSIVE_API_KEY is not set. Export it, or use --source fixture to "
            "exercise the pipeline offline."
        )
    try:
        from massive import RESTClient
    except ImportError as exc:
        raise SystemExit(
            "The 'massive' client is not installed. Run: pip install -r requirements.txt"
        ) from exc

    client = RESTClient(api_key=api_key)
    aggs = client.list_aggs(
        ticker,
        resolution["multiplier"],
        resolution["timespan"],
        window["from"],
        window["to"],
    )
    return [normalize_bar(bar) for bar in aggs]


def fetch_fixture(ticker: str, window: dict, resolution: dict) -> list[dict]:
    """Replay a committed fixture through the real envelope and validation path.

    This is how the pipeline stays testable where massive.com is unreachable --
    Claude Code cloud sessions block it at the egress proxy. It proves the envelope,
    the validators and the manifest, and nothing about the HTTP call.
    """
    path = FIXTURE_DIR / f"{ticker}.json"
    if not path.exists():
        raise SystemExit(
            f"No fixture for {ticker} at {path}. Add one, or drop the ticker from "
            "the config when running with --source fixture."
        )
    payload = json.loads(path.read_text())
    return [normalize_bar(bar) for bar in payload["bars"]]


FETCHERS = {"massive": fetch_massive, "fixture": fetch_fixture}


def build_envelope(ticker: str, bars: list[dict], window: dict, resolution: dict, source: str) -> dict:
    return {
        "ticker": ticker,
        "source": source,
        "resolution": f"{resolution['multiplier']}{resolution['timespan'][0]}",
        "window": window,
        "fetched_at": _utcnow_iso(),
        "bar_count": len(bars),
        "bars": bars,
    }


def load_config(path: Path) -> dict:
    if not path.exists():
        raise SystemExit(f"Config not found: {path}")
    config = json.loads(path.read_text())
    for key in ("tickers", "resolution", "lookback_days"):
        if key not in config:
            raise SystemExit(f"Config is missing required key '{key}': {path}")
    return config


def resolve_window(config: dict) -> dict:
    today = dt.datetime.now(dt.timezone.utc).date()
    start = today - dt.timedelta(days=int(config["lookback_days"]))
    return {"from": start.isoformat(), "to": today.isoformat()}


def do_fetch(args) -> int:
    config = load_config(Path(args.config))
    window = resolve_window(config)
    staging = Path(args.staging)
    staging.mkdir(parents=True, exist_ok=True)

    fetcher = FETCHERS[args.source]
    failures = []
    for ticker in config["tickers"]:
        try:
            bars = fetcher(ticker, window, config["resolution"])
        except SystemExit:
            raise
        except Exception as exc:  # noqa: BLE001 - one bad ticker shouldn't kill the run
            failures.append((ticker, repr(exc)))
            print(f"  FAIL {ticker}: {exc}", file=sys.stderr)
            continue
        envelope = build_envelope(ticker, bars, window, config["resolution"], args.source)
        (staging / f"{ticker}.json").write_text(json.dumps(envelope, indent=2) + "\n")
        print(f"  ok   {ticker}: {len(bars)} bars")

    print(
        f"\nfetched {len(config['tickers']) - len(failures)}/{len(config['tickers'])} "
        f"tickers from {args.source} into {staging}"
    )
    if failures:
        print(f"{len(failures)} ticker(s) failed; staging is incomplete and must not be promoted.")
        return 1
    return 0


def do_promote(args) -> int:
    """Move validated staging files into data/market/ and rewrite the manifest.

    The manifest is rebuilt from the files actually present rather than from what we
    think we fetched -- otherwise a promote that silently dropped a file would leave
    the manifest asserting a freshness nothing on disk supports.
    """
    staging = Path(args.staging)
    out = Path(args.out)
    if not staging.exists():
        raise SystemExit(f"Nothing to promote: {staging} does not exist")

    staged = sorted(staging.glob("*.json"))
    if not staged:
        raise SystemExit(f"Nothing to promote: no .json files in {staging}")

    out.mkdir(parents=True, exist_ok=True)
    for path in staged:
        shutil.copy2(path, out / path.name)
        print(f"  promoted {path.name}")

    required = ("ticker", "fetched_at", "bar_count", "resolution", "source")
    entries = {}
    for path in sorted(out.glob("*.json")):
        if path.name == "manifest.json":
            continue
        try:
            payload = json.loads(path.read_text())
        except json.JSONDecodeError:
            print(f"  warn {path.name}: not valid JSON, excluded from manifest", file=sys.stderr)
            continue
        if not all(key in payload for key in required):
            print(
                f"  warn {path.name}: not a market-data envelope, excluded from manifest",
                file=sys.stderr,
            )
            continue
        entries[payload["ticker"]] = {
            "fetched_at": payload["fetched_at"],
            "bar_count": payload["bar_count"],
            "resolution": payload["resolution"],
            "source": payload["source"],
            "window": payload.get("window"),
        }

    if not entries:
        raise SystemExit(
            f"Promoted files but found no valid envelopes in {out}; refusing to write "
            "a manifest that claims nothing."
        )

    manifest = {
        "generated_at": _utcnow_iso(),
        "ticker_count": len(entries),
        "oldest_fetched_at": min((e["fetched_at"] for e in entries.values()), default=None),
        "tickers": entries,
    }
    (out / "manifest.json").write_text(json.dumps(manifest, indent=2) + "\n")
    print(f"\nmanifest: {len(entries)} tickers, oldest fetch {manifest['oldest_fetched_at']}")

    shutil.rmtree(staging)
    return 0


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--config", default=str(DEFAULT_CONFIG))
    parser.add_argument("--source", choices=sorted(FETCHERS), default="massive")
    parser.add_argument("--staging", default=str(DEFAULT_STAGING))
    parser.add_argument("--out", default=str(DEFAULT_OUT))
    parser.add_argument(
        "--promote",
        action="store_true",
        help="Promote an already-validated staging dir instead of fetching.",
    )
    args = parser.parse_args()
    return do_promote(args) if args.promote else do_fetch(args)


if __name__ == "__main__":
    sys.exit(main())

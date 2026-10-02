---
name: market-data-ingest
description: >
  Pull market data from the Massive API (stocks, options, forex, crypto; formerly
  Polygon.io) into timestamped, schema-validated JSON under data/market/, with a
  freshness manifest. Use this skill whenever the task involves fetching, refreshing,
  validating, or checking the staleness of market data in this repo — including
  "update the market data", "is the price data stale", "add a ticker to the pipeline",
  "the refresh job failed", or any work touching data/market/ or the Massive client.
  Also use it before writing new code that reads market data, so the envelope format
  and validation gates are respected rather than reinvented.
---

# Market data ingest

This skill owns one job: get market data out of Massive and onto disk in a shape
the rest of the repo can trust. "Trust" here means a reader never has to wonder
how old a number is or whether a field might be null.

## Why the envelope exists

Raw API responses are a bad thing to commit. They carry no provenance, so six
months later nobody can tell whether `data/market/AAPL.json` was fetched during
market hours, during a holiday, or from a half-failed paginated call that returned
three bars instead of two hundred and fifty.

Every file this skill writes is therefore wrapped:

```json
{
  "ticker": "AAPL",
  "source": "massive",
  "resolution": "1d",
  "window": {"from": "2026-01-02", "to": "2026-10-01"},
  "fetched_at": "2026-10-02T14:03:11Z",
  "bar_count": 189,
  "bars": [{"t": 1767312000000, "o": 1.0, "h": 1.0, "l": 1.0, "c": 1.0, "v": 1.0}]
}
```

`fetched_at` is the load-bearing field. The site and any analysis read it to decide
whether to show the data at all. A consumer that ignores it will eventually render a
stale number with full confidence, which is the single worst outcome this pipeline
can produce.

## The two-stage rule

Fetch and validate are separate commands, and validation gates the commit. This
matters because a partial fetch is worse than no fetch: it looks like success. So
`ingest.py` writes to a staging directory, `validate.py` checks it, and only a
passing run is promoted into `data/market/`.

```bash
# 1. fetch into staging (needs MASSIVE_API_KEY)
python3 .claude/skills/market-data-ingest/scripts/ingest.py

# 2. validate staging; non-zero exit means do not promote
python3 .claude/skills/market-data-ingest/scripts/validate.py --staging .market-staging

# 3. promote only if validation passed
python3 .claude/skills/market-data-ingest/scripts/ingest.py --promote --staging .market-staging
```

Never promote by hand with `cp`. The promote step rewrites `manifest.json`, and a
manual copy leaves the manifest claiming a freshness the files no longer have.

## Working without network access or a key

Some environments cannot reach `massive.com` — notably Claude Code cloud sessions,
where the egress proxy blocks it. Rather than making the pipeline untestable there,
`--source fixture` replays committed fixtures through the exact same envelope,
validation, and promote path:

```bash
python3 .claude/skills/market-data-ingest/scripts/ingest.py --source fixture
```

This exercises everything except the HTTP call. Use it to test changes to the
envelope, the validators, or the manifest. It is not a substitute for a real run —
if you change request parameters, say so plainly in your report, because you have
not proven those against the live API.

The fixtures themselves are synthetic and generated deterministically by
`.claude/skills/market-data-ingest/scripts/make_fixtures.py`, so a fixture diff in review always means someone changed
the generator deliberately. Regenerate with:

```bash
python3 .claude/skills/market-data-ingest/scripts/make_fixtures.py
```

Do not replace them with real market data. A real price committed as a test fixture
will eventually be cited as a source by something downstream.

## Proving a change against the real API

The gates and the envelope are covered by `.claude/skills/market-data-ingest/tests/test_gates.py`, which feeds
deliberately broken envelopes through every validator:

```bash
python3 .claude/skills/market-data-ingest/tests/test_gates.py
```

A validator nobody has watched fail is indistinguishable from one that always
passes, so run this after touching `validate.py`.

## Validation gates

`validate.py` fails a file on any of these, because each one has produced a silently
wrong number before:

| Gate | Why it exists |
|---|---|
| `bars` non-empty | A 200 response with zero bars means the ticker or window is wrong, not that the market was closed |
| timestamps strictly increasing | Out-of-order bars break every windowed calculation downstream |
| no null/missing OHLCV field | Nulls propagate into averages as zeros and quietly drag them down |
| `high >= low`, `high >= open/close`, `low <= open/close` | Catches transposed fields and bad merges |
| `bar_count` matches `len(bars)` | The envelope disagreeing with its own payload means a truncated write |
| `fetched_at` parses as UTC ISO-8601 and is not in the future | A future stamp means a clock problem, and freshness checks will then never fire |
| non-negative volume | Negative volume is always a parse error |

Add a gate whenever you find a new class of bad data. Record why in the table above —
a gate without a stated reason gets deleted by the next person who finds it annoying.

## Freshness

`manifest.json` carries `fetched_at` per ticker plus a top-level `oldest_fetched_at`.
Check staleness with:

```bash
python3 .claude/skills/market-data-ingest/scripts/validate.py --freshness --max-age-hours 30
```

30 hours is the default for daily bars: it tolerates a weekend-adjacent miss and one
failed nightly run, but fires before data is two sessions old. Intraday resolutions
need a much tighter bound — pass `--max-age-hours` explicitly rather than editing the
default, so the daily contract stays intact.

## Adding a ticker

Edit `.claude/skills/market-data-ingest/tickers.json`. Keep it small and deliberate; every ticker is an API
call per run, and the free tier rate-limits. Then run the three-stage sequence above.

## Reporting

When you finish a run, state: how many tickers fetched, how many gates failed and
which, the oldest `fetched_at` in the manifest, and whether you ran against the live
API or fixtures. If you ran against fixtures, lead with that — it changes how much
the result is worth.

# data/market

Market-data envelopes written by `.claude/skills/market-data-ingest/`. Read that
SKILL.md before changing anything here.

## Check the `source` field before using a number

Every envelope records where it came from:

- `"source": "massive"` — fetched from the Massive API. Real data.
- `"source": "fixture"` — replayed from committed synthetic fixtures so the pipeline
  can be exercised without network access or an API key. **Not real prices. Do not
  cite, chart, or publish these.**

The files currently committed here are `fixture`-sourced placeholders. They exist so
the pipeline has something to validate against and so `manifest.json` has a real
shape. The first successful scheduled refresh replaces them with `massive`-sourced
data.

## Check `fetched_at` before using a number

`manifest.json` carries `fetched_at` per ticker and a top-level `oldest_fetched_at`.
Anything reading from this directory should treat a stale stamp as a reason not to
display the number rather than a detail to ignore — stale data rendered confidently
is the worst thing this pipeline can produce.

```bash
python3 .claude/skills/market-data-ingest/scripts/validate.py --freshness --max-age-hours 30
```

## Do not hand-edit

`manifest.json` is rebuilt from the files present during a promote. Editing an
envelope by hand leaves the manifest asserting a freshness and bar count that the
file no longer supports.

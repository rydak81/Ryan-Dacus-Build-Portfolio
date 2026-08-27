# JobSignal

**Know which jobs are worth applying to.**

JobSignal is not a job board. It is an intelligence layer on top of the job
market: it ingests listings from employer ATS feeds (Greenhouse and Lever in
the MVP), verifies them against their sources, remembers every appearance,
removal, and repost, and turns that evidence into two independent numbers:

- **Job Confidence (0–100)** — how likely the listing represents a real,
  actively hiring role. Computed by a deterministic scoring engine over
  configurable signal weights. Never invented by an LLM.
- **Candidate Match (0–100%)** — how well the job fits *you*. Computed
  separately, and deliberately never blended with confidence: a 94% match at
  a 29%-confidence job is still a questionable job.

AI (Anthropic or OpenAI, behind an abstraction) is used only where it adds
intelligence: explaining scores, drafting outreach, extracting skills from a
resume. HTTP status codes, dates, repost history, and duplicate detection are
deterministic.

## Running it

```bash
npm install
npm run dev        # http://localhost:3000
npm test           # scoring / dedup / ghost / pipeline / match engines
npm run build
```

With no configuration the app runs in **demo mode**: an in-memory store
seeded with realistic scenarios (a strong verified job, a likely ghost, a
serial repost, high-match/low-confidence and the reverse), scored by the real
engine. Auth is bypassed with a demo identity.

## Production configuration

Copy `.env.example` to `.env.local`:

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase auth + client |
| `SUPABASE_SERVICE_ROLE_KEY` | server-side pipeline writes |
| `AI_PROVIDER` + `ANTHROPIC_API_KEY` or `OPENAI_API_KEY` | AI explanations/outreach (optional) |
| `JOBSIGNAL_CRON_SECRET` | bearer token guarding `/api/ingest` and `/api/verify` |

Apply `supabase/migrations/*.sql` in order (Supabase SQL editor or CLI). Row
level security keeps user profiles, applications, feedback, and watchlists
private per user; market data is read-only to authenticated users and written
by the service role.

Deployment target: Vercel (`vercel.json` schedules ingestion every 6h and
verification sweeps every 4h) + Supabase.

## Architecture

```
lib/
  config/scoring.ts    signal weights + confidence bands (DB-overridable)
  scoring/             deterministic Job Confidence engine + facts builder
  ghost/               repost-pattern & true-age analysis (age never resets)
  dedup/               duplicate detection (title/location/description/ATS ids)
  match/               deterministic Candidate Match engine
  ingest/              provider contract + Greenhouse + Lever + reconciliation
  verify/              HTTP/ATS verification engine
  ai/                  provider abstraction (Anthropic | OpenAI | none) + tasks
  services/            ingest / verify / rescore orchestration
  db/                  store interface + Supabase impl + seeded demo impl
app/
  api/ingest           cron: pull ATS feeds
  api/verify           cron: re-verify stale jobs
  api/jobs, /check     extension-ready read API (check a URL from anywhere)
supabase/migrations/   schema + RLS + weight seeds
tests/                 engine test suite (vitest)
```

Adding an ATS provider = one file implementing `IngestionProvider`
(`lib/ingest/types.ts`) plus a registry entry in `lib/services/ingest.ts`.

## Product rules encoded in the system

- `first_seen_at` is never reset. Reposting cannot erase a job's true age.
- Verification history is append-only (`job_verifications`, `job_events`).
- Every score is explainable — the UI renders the full signal breakdown.
- Duplicates fold into one canonical job, preferring the employer's ATS as
  the application source.
- Match and confidence never mix.
- Candidate data is private: RLS on all user tables, no resale, no cross-user
  exposure.

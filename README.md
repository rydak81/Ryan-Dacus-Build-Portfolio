# ryandacus.com

Portfolio site. Next.js 15 + Tailwind v4. No database, no CMS.

## Run

    npm install
    npm run dev

## Edit content

Everything lives in `lib/projects.ts`. One typed array. Add a project, push, done.

Status vocabulary — use these exactly and don't inflate:

- `Live`        deployed and reachable
- `Built`       runs, not hosted
- `Designed`    architecture and spec exist, not implemented
- `In Progress` actively being built
- `Analysis`    research deliverable, not software
- `Retired`     was running, intentionally shut down

## Design system

`app/globals.css`. The rule: **colour encodes epistemic status.**

- `signal` (amber) — a measured, verified, defensible number
- `model` (cyan) — something a model produced; an estimate
- `risk` (red) — downside, floor breach

Nothing on the site is warm unless it's true.

## The simulation

`lib/simulation.ts` is a browser port of the factor-structured Gaussian copula
from the Python forecast engine. Deals share a market factor, so they move
together; each deal's marginal close probability is preserved exactly.

## Deploy

Push to GitHub, import at vercel.com, add the domain. No env vars needed yet.

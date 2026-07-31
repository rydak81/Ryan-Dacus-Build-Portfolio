# Claude Code Handoff — ryandacus.com, Sessions 3–5

**How to use this file:** put it in the repo root as `HANDOFF.md`, open Claude Code
in the project directory, and paste the "Opening prompt" section below. Everything
after it is reference Claude Code can read on its own.

---

## Opening prompt (paste this)

> Read `HANDOFF.md` in the repo root before doing anything else. It describes a
> portfolio site that is already built and deploying, the design system it uses,
> and three remaining work sessions.
>
> Run `npm install && npm run dev` and look at the site first. Then start
> **Session 3** only. Do not start Sessions 4 or 5 until I say so.
>
> Two standing rules that override anything else you infer from the code:
> the honesty rules in "Content discipline" are not stylistic preferences, they
> are hard constraints; and every number you put on screen must come from
> `lib/projects.ts` or be computed live in the browser. Never type a statistic
> directly into a component.
>
> Before you write code, tell me your plan for Session 3 and what you think the
> riskiest part is.

---

## What this is

A portfolio site for Ryan Dacus — 20 years in e-commerce revenue (Amazon seller →
founding sales hire at an agency → partnerships lead at a commerce SaaS holding
company), now job searching for GTM engineering, solutions consulting, and
partnerships roles.

The site's thesis: **a portfolio where the models are live, not pictured.** Anyone
can claim they built a Monte Carlo forecasting engine. This site runs it in the
visitor's browser. That is the entire differentiator and every decision should
protect it.

Hero line: *"I sell technology I actually know how to build."*

Audience: hiring managers at commerce/retail/logistics software companies. They are
technical enough to be impressed by a working copula simulation and unimpressed by
a wall of buzzwords. Assume they will click one thing, and it will be the widget.

---

## Current state

Built and verified: `next build` compiles clean, 26 static pages, ~109 kB first load.

```
app/
  layout.tsx              fonts + metadata
  globals.css             design tokens (see below)
  page.tsx                home — Hero, Proof, Method, SelectedWork,
                          EverythingElse, Stack, ThroughLine, Contact, Footer
  projects/[slug]/page.tsx   case study template, generateStaticParams over all projects
components/
  CorrelationExplorer.tsx    THE signature element. Client component.
  ArchitectureDiagram.tsx    static SVG, Marketplace Beta pipeline
lib/
  projects.ts             single source of truth — 22 projects, typed
  simulation.ts           Gaussian copula Monte Carlo, browser port of the Python engine
```

Stack: Next 15.5.4 (App Router), React 19.1.0, Tailwind **v4**.1.13, TypeScript.
No database, no CMS, no auth, no test suite. Keep it that way.

### Tailwind v4 gotcha — read this before styling anything

Tokens are declared in `@theme` in `globals.css`, which makes Tailwind generate
utilities automatically. Use `bg-surface`, `text-fg-2`, `border-line`.

**Do not write `bg-[--color-surface]`.** That was v3 syntax. In v4 it silently
emits no CSS — the build passes and the page renders unstyled. This already
happened once. If styles go missing, check this first:

```bash
npm run build && grep -o '\.bg-surface{[^}]*}' .next/static/css/*.css
```

---

## Design system

### The one idea: colour encodes epistemic status

This is not decoration. The whole project has been an argument about the
difference between *built* and *claimed*, so the palette enforces it:

| Token | Meaning |
|---|---|
| `signal` (amber `#ffb454`) | a measured, verified, defensible number; something live |
| `model` (cyan `#5ac8e8`) | something a model produced — an estimate, a simulation |
| `risk` (red `#e5484d`) | downside, floor breach |

**Nothing on this site is warm unless it is true.** If you add a new stat and
you're unsure which colour it takes, that uncertainty is your answer: it's cyan.

Full token set: `ink` `surface` `surface-2` `line` `line-bright` `fg` `fg-2` `fg-3`
`signal` `signal-dim` `model` `model-dim` `risk`.

### Type

- Display — Space Grotesk, via `style={{ fontFamily: 'var(--font-display)' }}`
- Body — IBM Plex Sans (default on `body`)
- Mono — IBM Plex Mono, applied with the `.num` utility class

**Every number on the site is mono and tabular.** `.num` handles it. Stats, tags,
percentages, URLs, eyebrows. This is the most load-bearing typographic rule here —
it's what makes the site read as an instrument rather than a brochure.

### Other conventions

- Borders over shadows. Grid gaps done with `gap-px` on a `bg-line` parent.
- Zero border radius except status dots.
- `.eyebrow` for small uppercase mono labels.
- Numbered markers (`01`/`02`/`03`) only where content is genuinely sequential.
  They're used in Method and in case study sections. Don't spread them further.
- Respect `prefers-reduced-motion` (already handled globally).
- Motion is currently near-zero. That is a choice. If you add any, make it one
  orchestrated moment, not scattered hover effects.

---

## Content discipline — hard constraints

These exist because the site's credibility is the product. A single inflated claim
that gets probed in an interview costs more than every feature in this document.

**Never claim:**
- LSTM, ARIMA, Croston, or AutoARIMA anywhere. Ryan has graduate EE coursework that
  *touched* these, but he did not implement them. AgencyForecast is a heuristic
  weighted ensemble and must always be described that way.
- Real partner names, real ACV figures, or revenue-share terms.
- Any infrastructure not actually in use: FastAPI, Playwright, Redis, BullMQ,
  microservices, RAG, vector databases, GPT-4-in-production. The real stack is
  Next.js on Vercel with Supabase and Python. That's it.

**Status vocabulary** is defined at the top of `lib/projects.ts`. `Live` means
deployed and reachable. `Built` means it runs but isn't hosted. Never promote a
project to a higher tier of claim than its status supports.

**Blocked until Ryan clears it:**
- The Recovery Calculator at `v0-recovery-calculator.vercel.app` must not be linked
  from anywhere until a partner-economics panel is **deleted from its source** —
  not toggled off, not hidden behind a flag. Deleted.
- Marketplace Beta's repo README and an older portfolio PDF disagree on numbers
  (RSS source count, model roles, cron stages). `ArchitectureDiagram.tsx` currently
  reflects the higher figures. If Ryan resolves this, the diagram and the
  `metrics` entry in `projects.ts` both need updating. Ask him before publishing.

---

## Session 3 — the remaining two widgets

Goal: give the Recovery Suite and QBR case study pages the same live-model
treatment the forecast engine has. Both are client components, both computed in
browser, both wired through the existing `interactive` field in `lib/projects.ts`
(`'recovery'` and `'bayesian'` are already set on the right projects — the case
study template just doesn't render them yet).

Follow the structural pattern of `CorrelationExplorer.tsx`: a readout strip of
stats across the top, an SVG chart, controls below, then a caption explaining what
the visitor just did and what it meant in the real engagement.

### 3a. Recovery Simulator

The insight this must land, from the real analysis: **average selling price largely
cancels out. The real driver of recovery rate is landed COGS as a share of retail
price.** That's counterintuitive and it's the thing worth demonstrating.

Model it bottom-up the way the corrected engine does — units × manufacturing cost,
matching Amazon's post-March-2025 reimbursement policy, *not* a percentage of
revenue. The original estimate was ~2.5× overstated precisely because it was sized
off revenue, and Ryan caught it himself before it reached a partner.

Suggested controls: annual units, average selling price, COGS as % of retail,
loss/damage rate. Suggested output: estimated recoverable value, plus a small
sensitivity strip showing how much each input moves the result. When the visitor
drags ASP and the recovery rate barely responds, the point has been made.

Put a visible note that inputs are illustrative and any real engagement requires
actual seller data.

### 3b. Bayesian updating widget

Beta-conjugate updating on partner activation rate. Prior `Beta(α, β)`, observe `n`
partners with `k` activations, posterior `Beta(α+k, β+n−k)`.

Draw prior and posterior densities on the same axes — prior as a dashed ghost,
matching how `CorrelationExplorer` renders its independence baseline. Let the
visitor set observed data with sliders.

The lesson to make unmissable: **a partner that activated 1 of 2 times is not a 50%
partner.** Small samples get pulled toward the prior. Show the naive rate and the
posterior mean side by side so the gap is visible. That is the entire argument for
Bayesian shrinkage in a QBR, in one screen.

### Wiring

In `app/projects/[slug]/page.tsx` there's already a block rendering
`{p.interactive === 'correlation' && ...}`. Extend it for the other two values.
Keep each widget's intro copy specific to that project — don't genericise it.

**Verify before you finish:** `npm run build`, then confirm each widget appears
only on its own page:

```bash
grep -c "RecoverySimulator-specific-string" .next/server/app/projects/*.html
```

---

## Session 4 — Role Lens

The one AI feature. A visitor pastes a job description; the project grid reorders
and each surfaced project gets a one-line note on why it's relevant to *that* role.

Server route at `app/api/role-lens/route.ts`, calling Claude Haiku. Key is stored
server-side as an env var and never reaches the client.

**The hard constraint:** the model may reorder projects and select which existing
sentences to surface. It may write one short relevance line per project. It may not
assert any fact about a project that isn't already in `lib/projects.ts`. Send it the
project data and instruct it to return only slugs plus a relevance line, then render
from local data. Never render model-generated prose as project description.

Fail gracefully — if the API is down or the key is missing, the grid stays in its
default order and nothing visibly breaks. This must never be the reason the site
looks broken to a hiring manager.

Rate-limit it. It's a public endpoint calling a paid API.

---

## Session 5 — polish

- OG image (`app/opengraph-image.tsx`). This gets seen every time the link is
  shared on LinkedIn, which is the primary distribution channel. Worth real effort.
- `sitemap.ts`, `robots.ts`, favicon.
- Accessibility pass: keyboard nav through the widgets, focus visibility, SVG
  `aria-label`s (the existing two have them — match that standard), colour contrast
  on `fg-3` against `surface`.
- Mobile pass. The SVGs scale but check that chart labels stay legible and the
  readout strips don't crush at 375px.
- Lighthouse. Target 95+ across the board; the site is static and should get there
  without much fighting.

---

## Guardrails

- **Do not add dependencies** without asking. Current list is deliberately tiny.
  No animation library, no chart library, no UI kit. The SVGs are hand-written on
  purpose — they're part of the argument.
- **Do not restructure `lib/projects.ts`.** Add fields if needed; don't reorganise.
- **Do not rewrite `CorrelationExplorer.tsx`.** The simulation constants were tuned
  against the real engine's findings (`DEFAULT_W = 0.17` reproduces the measured 41%
  widening). Changing them breaks the correspondence to the real work.
- **Do not add a chatbot.** It was considered and rejected as generic.
- If you think a section is weak, say so before rebuilding it.

---

## Open items for Ryan (not blocking Sessions 3–5)

- Purchase `ryandacus.com` (~$11/yr) and point Vercel at it.
- Make the `BMS-Algorithms` GitHub repo private — it contains solved problem sets.
- Resolve the README-vs-PDF discrepancy on Marketplace Beta's numbers.
- Confirm what Lead Intel Studio is, and where the Universal Business Acquisition
  Analyzer is actually hosted.
- Fix the "Private repository. All rights reserved." line on the public
  `margin-intel-hub` repo; add a profile README and pinned repos.
- Strip the partner-economics panel from the Recovery Calculator source.

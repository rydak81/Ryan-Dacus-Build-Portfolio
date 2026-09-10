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
company), who now builds the revenue systems as well as carrying the number.

The site's thesis: **a portfolio where the models are live, not pictured.** Anyone
can claim they built a Monte Carlo forecasting engine. This site runs it in the
visitor's browser. That is the entire differentiator and every decision should
protect it.

Hero line: *"I build the systems that find the revenue."*

**The positioning was inverted, and this is the current framing.** The site used
to lead commercially — "I sell technology I know how to build", a record strip
opening on ACV, and a five-stage sales motion as the page spine — because the
roles being targeted were all business development and partnerships ones. That
framing filed twenty projects about ingestion, measurement, diagnosis and
optimisation under "how I sell", where nobody hiring for revenue operations,
performance analysis, or a data role would look for them.

The spine is now the **operating loop** — instrument, monitor, pinpoint,
diagnose, execute (`lib/career.ts` → `loop`, rendered by `OperatingLoop.tsx`).
The sales motion survives further down the page as one chapter of the career.
The commercial record is not hidden or softened anywhere; it is repositioned as
the reason the models are built around the operator's economics rather than as
the whole of the offer. Keep both halves. The adaptability across them is the
argument, so do not let a future edit collapse the site back onto one of them.

Audience: hiring managers at commerce/retail/logistics software companies, across
both families of role. They are technical enough to be impressed by a working
copula simulation and unimpressed by a wall of buzzwords. Assume they will click
one thing, and it will be the widget.

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

Stack: Next 15.5.9 (App Router), React 19.1.0, Tailwind **v4**, TypeScript.
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

### The ground: light, and shared with the analytics app

**The site was a dark build and is now a light one.** The palette, type,
radius and elevation come from the FilamentIQ desktop-manufacturing
analytics app, ported deliberately so the two properties read as one body of
work. If you are looking at an old screenshot or an old branch, the near-black
indigo field is gone.

- Page ground is cool paper `oklch(0.975 0.007 262)`; cards are white.
- The **only** dark surfaces are the mesh hero, the sticky nav, and the
  closing band. They all use `.bg-mesh`, which is one definition.
- `.on-dark` redefines the colour tokens for a subtree rather than restyling
  each element. That is why `text-fg-2` means "the quieter body colour" on
  either ground, and it is the mechanism the print block uses too. Use it —
  do not hand-write white text utilities on a dark section.

### The one idea: colour encodes epistemic status

This survived the move intact. It is not decoration — the whole project is an
argument about the difference between *built* and *claimed*, so the palette
enforces it:

| Token | Meaning |
|---|---|
| `signal` (burnt orange `oklch(0.5 0.16 42)`) | a measured, verified, defensible number; something live |
| `model` (royal blue `oklch(0.44 0.2 268)`) | something a model produced — an estimate, a simulation |
| `risk` (red) | downside, floor breach |

**Nothing on this site is warm unless it is true.** If you add a new stat and
you're unsure which colour it takes, that uncertainty is your answer: it's blue.

One thing did change with the ground. On near-black, colour was how a number
got noticed, so most figures were amber. On paper the default state of a
number is navy ink, and only a figure actually making a claim takes a hue —
the record strip tones exactly one cell. Follow that restraint.

Three variants exist per hue and they are not interchangeable:

- plain (`--color-signal`, `--color-model`) — **text**, verified AA on white
- `-fill` — bars, dots, gradient stops, glows. Nothing is read on top of it.
- `-dim` — hairlines: underline decorations, left rails, chart gridlines.
- `--color-signal-cta` is a fourth, for filled buttons only. White on the
  brand `-fill` orange measures 3.31:1, which is under AA for button text.

Full token set: `page` `surface` `surface-2` `ink` `ink-2` `line` `line-bright`
`fg` `fg-2` `fg-3` `signal` `signal-fill` `signal-dim` `signal-cta` `model`
`model-fill` `model-dim` `risk` `success` `warning` `glow`.

**Contrast is checked, not eyeballed.** Every text/background pair on `/`,
`/about` and a case study measures at or above AA. Re-check after any token
change — resolve colours through a canvas, because `getComputedStyle` returns
`oklch()` strings that naive RGB parsing silently mis-reads as passing.

### Type

- Display and body — Plus Jakarta Sans (`--font-jakarta`), 400–800
- Mono — JetBrains Mono, applied with the `.num` utility class
- The type scale is overridden in `@theme`; `text-xs` is 13px, not 12px,
  because this site's caveat copy lives at the two smallest steps.

**Every number on the site is mono and tabular.** `.num` handles it. Stats,
percentages, step indices, URLs. Not eyebrows and not tag chips — those are
words, not measurements, and use `.label` instead.

### Other conventions

- Radius everywhere: `rounded-chip` 8px, `rounded-card` 12px, `rounded-panel`
  16px. The old zero-radius rule is gone.
- Elevation is a soft navy-tinted drop shadow, not a border and not a
  gradient. `.panel` is the primitive; `.cell` is its version for a card
  inside a hairline grid.
- `.grid-lines` builds ruled grids with `gap: 1px`, and the hairlines are
  drawn by `.grid-lines > *` box-shadows rather than by the container's
  background. That is deliberate: a short last row would otherwise leave a
  grey block where a card is missing.
- `.eyebrow` for small uppercase labels. They are blue — brand chrome, not
  body copy.
- Numbered markers (`01`/`02`/`03`) only where content is genuinely
  sequential: the operating loop, Method, case study sections.
- Respect `prefers-reduced-motion` (already handled globally).
- Motion is near-zero. That is a choice. If you add any, make it one
  orchestrated moment, not scattered hover effects.

**Screenshotting this site:** the `.fade-in` and `.stagger` scroll timelines
render at opacity 0 in a full-page capture, which looks like half the page is
blank. Emulate reduced motion. And always confirm the served HTML's CSS URL
returns 200 — a `next start` left running across a rebuild serves a stale
hash and the page renders completely unstyled, which looks like a Tailwind
failure and is not one.

---

## Content discipline — hard constraints

These exist because the site's credibility is the product. A single inflated claim
that gets probed in an interview costs more than every feature in this document.

**Never claim:**
- LSTM, ARIMA, Croston, or AutoARIMA anywhere. Ryan has graduate EE coursework that
  *touched* these, but he did not implement them. AgencyForecast is a heuristic
  weighted ensemble and must always be described that way.
- Real company or partner names, real ACV figures, or revenue-share terms. (This
  rule keeps the word "partner" deliberately — it is about what must never be
  published, not about site vocabulary. See the naming note below.)
- Any infrastructure not actually in use: FastAPI, Playwright, Redis, BullMQ,
  microservices, RAG, vector databases, GPT-4-in-production. The real stack is
  Next.js on Vercel with Supabase and Python. That's it.

**Naming: avoid "partner" in project titles and copy.** Ryan works with real
partners who could read a project called "Partner CRM" as a reference to work
co-built with them. Every project title, description, and piece of UI copy now
uses **Sales**, **Revenue** / **Revenue Ops**, **Channel**, **Account**, or
**Client** instead. Pick whichever fits the subject; don't apply one word
mechanically.

Two deliberate exceptions:
- **Ryan's own career history keeps "partnerships"** — the hero eyebrow, the
  about narrative, the OG image, and the contact section. That is the role he
  held and the role he is targeting, and it reads as biography, not as a
  reference to any specific partner's project.
- **The "never publish real partner names" rule above** keeps the word, because
  the rule is about the risk itself.

Four slugs were renamed with permanent redirects in `next.config.mjs`. If you
rename another, add a redirect there too.

**Status vocabulary** is defined at the top of `lib/projects.ts`. `Live` means
deployed and reachable. `Built` means it runs but isn't hosted. Never promote a
project to a higher tier of claim than its status supports.

**Blocked until Ryan clears it:**
- The Recovery Calculator at `v0-recovery-calculator.vercel.app` must not be linked
  from anywhere until a revenue-share economics panel is **deleted from its source** —
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
off revenue, and Ryan caught it himself before it reached a client.

Suggested controls: annual units, average selling price, COGS as % of retail,
loss/damage rate. Suggested output: estimated recoverable value, plus a small
sensitivity strip showing how much each input moves the result. When the visitor
drags ASP and the recovery rate barely responds, the point has been made.

Put a visible note that inputs are illustrative and any real engagement requires
actual seller data.

### 3b. Bayesian updating widget

Beta-conjugate updating on account activation rate. Prior `Beta(α, β)`, observe `n`
accounts with `k` activations, posterior `Beta(α+k, β+n−k)`.

Draw prior and posterior densities on the same axes — prior as a dashed ghost,
matching how `CorrelationExplorer` renders its independence baseline. Let the
visitor set observed data with sliders.

The lesson to make unmissable: **an account that activated 1 of 2 times is not a 50%
account.** Small samples get pulled toward the prior. Show the naive rate and the
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
- Strip the revenue-share economics panel from the Recovery Calculator source.

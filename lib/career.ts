/**
 * lib/career.ts
 * Single source of truth for the /about profile — the same discipline
 * lib/projects.ts applies to work, applied to biography.
 *
 * ─────────────────────────────────────────────────────────────────────
 * TODO(ryan) — READ THIS BEFORE THE PAGE GOES LIVE
 *
 * Everything below is derived from what is already published in this repo
 * (project `org` values, HANDOFF.md, the home page copy). Three kinds of
 * fact are NOT derivable from the repo and are therefore left empty rather
 * than guessed:
 *
 *   1. `period` on each chapter — every one is undefined. The UI renders
 *      nothing where a period is missing, so the page is honest as shipped.
 *      Fill them in and the timeline gains a date column automatically.
 *   2. `title` on the first two chapters — my best reading of the arc in
 *      HANDOFF.md ("Amazon seller → founding sales hire at an agency →
 *      partnerships lead at a commerce SaaS holding company"). Confirm the
 *      real titles and the real employer names.
 *   3. `education` — empty array. HANDOFF.md references graduate EE
 *      coursework; the institution and credential are yours to state.
 *
 * The rule from lib/projects.ts carries over unchanged: never promote a
 * claim above what the evidence supports. `resolveCapability()` below
 * enforces that mechanically for the capability ledger — a "shipped" claim
 * that cites no Live or Built project is silently demoted to "working".
 * ─────────────────────────────────────────────────────────────────────
 */

import { published, type Project, type Status } from './projects';

/* ── profile ────────────────────────────────────────────────────────── */

export interface Profile {
  name: string;
  /** One line. Same claim as the hero, in the third person a recruiter reads. */
  headline: string;
  location: string;
  email: string;
  linkedin: string;
  github: string;
  /**
   * Optional portrait. Drop a square image in `public/` and set the path
   * (e.g. '/ryan.jpg'). Absent, the header renders a stat block instead —
   * which is deliberately not a worse outcome, just a different one.
   */
  portrait?: string;
  /** Shown as a live status chip. Set `open: false` when the search closes. */
  availability: { open: boolean; line: string };
}

export const profile: Profile = {
  name: 'Ryan Dacus',
  headline:
    'Twenty years carrying a revenue number, and a working portfolio of the systems I built rather than waited for.',
  location: 'Greenville, SC',
  email: 'ryandacus@gmail.com',
  linkedin: 'https://linkedin.com/in/ryandacus-sbc',
  github: 'https://github.com/rydak81',
  // portrait: '/ryan.jpg',   // TODO(ryan): add the file, then uncomment.
  availability: {
    open: true,
    line: 'Open to partnerships, GTM engineering, and solutions roles',
  },
};

/* ── the operating thesis ───────────────────────────────────────────── */

/**
 * The "about me" that isn't a summary of the résumé below it. Three
 * paragraphs, each doing a different job: what I do, why it's unusual,
 * what I'm optimising for next.
 */
export const mission = {
  eyebrow: 'Operating thesis',
  title: 'The gap between the people who sell software and the people who build it is the whole opportunity.',
  body: [
    'I have spent twenty years on the commercial side of e-commerce — selling, running business development, and building channel programs. That whole time, the tools I needed either did not exist or arrived two quarters after they would have mattered. Forecasts that were a single confident number. Pipeline data that was stale before anyone opened it. Enablement that stayed on a roadmap.',
    'At some point the cost of waiting got higher than the cost of learning to build, so I learned to build. Not to change careers — to stop being blocked. Everything on this site came out of a problem inside my own revenue work, and most of it went into production against real accounts while I was still carrying a quota.',
    'What I want next is a seat where both halves are load-bearing: close enough to customers that I feel the friction first, and trusted enough to go build the answer rather than file a request for it. Partnerships, go-to-market engineering, solutions consulting — the titles vary, the job does not.',
  ],
};

/* ── career chapters ────────────────────────────────────────────────── */

export interface Chapter {
  id: string;
  /** Short label for the timeline rail. Keep to two words. */
  label: string;
  /** Full role title. */
  title: string;
  org: string;
  /**
   * e.g. '2021 — Present'. Undefined renders nothing at all, which is why
   * this file ships honest with every one of them blank.
   */
  period?: string;
  /** What I was commercially accountable for. */
  mandate: string;
  /** The systems half of the same chapter. */
  build: string;
  /** One sentence. What this chapter taught that the next one needed. */
  lesson: string;
  /**
   * `org` values in lib/projects.ts that belong to this chapter. The
   * timeline counts and lists projects from here — nothing is retyped, so
   * the evidence can never drift from the shelf.
   */
  orgs: string[];
}

export const chapters: Chapter[] = [
  {
    id: 'operator',
    label: 'Operator',
    // TODO(ryan): real titles and employers for this chapter.
    title: 'Amazon seller, then founding sales hire at a marketplace agency',
    org: 'Independent · Agency',
    mandate:
      'Sourced, listed, and priced product on Amazon with my own capital at risk, then joined a marketplace agency as its first sales hire — writing the pitch, the pricing, and the qualification standard from nothing, and carrying the number they produced.',
    build:
      'Nothing here is software. This is the chapter every tool further down the page is a response to: spreadsheets rebuilt weekly, pricing decisions made on instinct, and a matching problem between sellers and agencies that I solved by hand, one conversation at a time, for years.',
    lesson:
      'Owning the P&L of a real catalogue is why the unit economics in every model here are the seller’s, not a textbook’s.',
    orgs: [],
  },
  {
    id: 'voadera',
    label: 'Business dev',
    // TODO(ryan): confirm exact title.
    title: 'Business development',
    org: 'Voadera',
    mandate:
      'Built and worked a business development pipeline against a lead and prospect database large enough that the spreadsheet holding it had already failed.',
    build:
      'Architected the BD CRM from scratch in Monday.com and wired it into the company ERP, then put a Monte Carlo forecast on top of it with Bayesian updating as deals moved. The first time a system I built was the system of record for someone else’s job.',
    lesson:
      'A forecast is not a number, it is a distribution — and the people reading it can handle that if you show them the range.',
    orgs: ['Voadera'],
  },
  {
    id: 'threecolts',
    label: 'Partnerships',
    // TODO(ryan): confirm exact title.
    title: 'Partnerships and channel',
    org: 'Threecolts',
    mandate:
      'Ran a net-new channel program at a commerce SaaS holding company — agency and technology accounts, from first conversation through enablement, referral, and quarterly review.',
    // No count in this sentence on purpose: the trace and the résumé both
    // count this chapter's projects live, and a number typed here would go
    // stale the first time a project is added or retired.
    build:
      'The largest block of work on this site. The system of record and funnel definition the program launched on, the enablement portal that does the account’s work for them, the recovery and profitability engine, the QBR command center, the forecast engine, and the weekly intelligence brief that replaced a standing day of manual research.',
    lesson:
      'Presented one of these internally as the company case study in applied AI — which is when it became clear the building was not a side activity.',
    orgs: ['Threecolts'],
  },
  {
    id: 'independent',
    label: 'Founder',
    title: 'Founder and independent builds',
    org: 'Marketplace Beta · BeaconPath Holdings',
    mandate:
      'Concurrent with the work above, not after it. An e-commerce intelligence publication with a real audience, and an acquisition pipeline run against a defined thesis.',
    build:
      'Marketplace Beta end to end — a multi-model AI editorial pipeline with model tier matched deliberately to task and cost, five scheduled stages, an email layer, and embedded operator tools. Alongside it, an SBA-structured acquisition screening engine and the deal pipeline it feeds.',
    lesson:
      'Shipping something with no employer behind it is the only way to find out which parts of the job you were actually doing.',
    orgs: ['Marketplace Beta', 'Founder', 'Independent', 'BeaconPath Holdings'],
  },
];

/** Every published project belonging to a chapter, in shelf order. */
export function evidenceFor(c: Chapter): Project[] {
  return published.filter((p) => c.orgs.includes(p.org));
}

/** Live and Built only — the things that actually run. */
export function shippedIn(c: Chapter): Project[] {
  return evidenceFor(c).filter(
    (p) => p.status === 'Live' || p.status === 'Built'
  );
}

/* ── capability ledger ──────────────────────────────────────────────── */

/**
 * The falsifiable skills section.
 *
 *   'shipped'  in production or in a running artifact — cites the projects
 *   'working'  used it for real, but not in anything shipped on this site
 *   'studied'  coursework or reading. Says so, in as many words.
 *
 * Only 'shipped' takes the warm colour, which is the same rule the rest of
 * the site runs on: nothing is warm unless it is true.
 */
export type Proof = 'shipped' | 'working' | 'studied';

export interface Capability {
  name: string;
  claim: Proof;
  /** Project slugs from lib/projects.ts. The proof, not a decoration. */
  evidence: string[];
  /** Required on 'studied'. This is where a claim gets its limits stated. */
  note?: string;
}

export interface ResolvedCapability {
  name: string;
  /** What the evidence supports, which may be lower than what was claimed. */
  proof: Proof;
  evidence: Project[];
  note?: string;
}

const SHIPPED_STATUSES: Status[] = ['Live', 'Built'];

/**
 * Resolves a claim against lib/projects.ts and refuses to let it outrun its
 * evidence. A 'shipped' claim citing no Live or Built project comes back as
 * 'working'. This is the honesty rule expressed as code rather than as a
 * comment somebody has to remember to obey.
 */
export function resolveCapability(c: Capability): ResolvedCapability {
  const evidence = c.evidence
    .map((slug) => published.find((p) => p.slug === slug))
    .filter((p): p is Project => Boolean(p));

  const hasShipped = evidence.some((p) => SHIPPED_STATUSES.includes(p.status));
  const proof: Proof =
    c.claim === 'shipped' && !hasShipped ? 'working' : c.claim;

  return { name: c.name, proof, evidence, note: c.note };
}

export interface CapabilityGroup {
  label: string;
  items: Capability[];
}

export const capabilities: CapabilityGroup[] = [
  {
    label: 'Quantitative',
    items: [
      {
        name: 'Monte Carlo simulation',
        claim: 'shipped',
        evidence: [
          'acv-forecast-engine',
          'recovery-profitability-suite',
          'voadera-bd-crm',
        ],
      },
      {
        name: 'Bayesian inference, conjugate priors',
        claim: 'shipped',
        evidence: [
          '3t-recovery-wizard',
          'qbr-funnel-command-center',
          'recovery-profitability-suite',
        ],
      },
      {
        name: 'Dependence modelling, Gaussian copula',
        claim: 'shipped',
        evidence: ['acv-forecast-engine'],
      },
      {
        name: 'Regression and elasticity, OLS',
        claim: 'shipped',
        evidence: ['recovery-profitability-suite', 'qbr-funnel-command-center'],
      },
      {
        name: 'Uncertainty propagation, credible intervals',
        claim: 'shipped',
        evidence: ['3t-recovery-wizard'],
      },
      {
        name: 'Kalman filtering',
        claim: 'studied',
        evidence: [],
        note: 'Graduate electrical engineering coursework. Not implemented in anything on this site, and I would not claim it in an interview.',
      },
    ],
  },
  {
    label: 'Applied AI',
    items: [
      {
        name: 'Multi-model pipeline orchestration',
        claim: 'shipped',
        evidence: ['marketplace-beta', 'article-topic-classifier'],
      },
      {
        name: 'Model-tier selection against cost',
        claim: 'shipped',
        evidence: ['article-topic-classifier', 'marketplace-beta'],
        note: 'Haiku for classification, Sonnet for editorial reasoning. Paying Sonnet rates for tagging is a design error, not a rounding error.',
      },
      {
        name: 'Scheduled autonomous research',
        claim: 'shipped',
        evidence: ['weekly-growth-brief-engine'],
      },
      {
        name: 'Constrained generation over trusted data',
        claim: 'shipped',
        evidence: ['marketplace-beta'],
        note: 'The Role Lens on the home page is the smallest example: the model may reorder and annotate, it may not assert a fact that is not already in lib/projects.ts.',
      },
    ],
  },
  {
    label: 'Product engineering',
    items: [
      {
        name: 'Next.js, React, TypeScript',
        claim: 'shipped',
        evidence: [
          'channel-enablement-portal',
          '3t-recovery-wizard',
          'fba-deal-analyzer',
        ],
      },
      {
        name: 'Postgres schema design and row-level security',
        claim: 'shipped',
        evidence: ['channel-enablement-portal', '3t-recovery-wizard'],
      },
      {
        name: 'Python data engineering',
        claim: 'shipped',
        evidence: [
          'recovery-profitability-suite',
          'acv-forecast-engine',
          'carrier-spend-analysis',
        ],
      },
    ],
  },
  {
    label: 'Revenue',
    items: [
      {
        name: 'Channel and partnership programs',
        claim: 'shipped',
        evidence: [
          'channel-enablement-portal',
          'monday-revenue-crm',
          'sales-enablement-system',
        ],
      },
      {
        name: 'CRM architecture and revenue operations',
        claim: 'shipped',
        evidence: [
          'voadera-bd-crm',
          'monday-revenue-crm',
          'prospecting-command-center',
        ],
      },
      {
        name: 'Marketplace domain — Amazon 1P/3P, Walmart, TikTok Shop',
        claim: 'shipped',
        evidence: [
          'recovery-profitability-suite',
          'weekly-growth-brief-engine',
          'fba-deal-analyzer',
        ],
      },
      {
        name: 'Acquisition screening and diligence',
        claim: 'shipped',
        evidence: ['acquisition-analyzer', 'acquisition-deal-pipeline'],
      },
    ],
  },
];

/* ── what I'm looking for ───────────────────────────────────────────── */

/**
 * The section every portfolio omits and every recruiter needs. Being
 * specific here disqualifies bad fits early, which is the point.
 */
export const lookingFor: { label: string; lines: string[] }[] = [
  {
    label: 'Roles',
    lines: [
      'Partnerships and business development',
      'Go-to-market engineering',
      'Solutions consulting and sales engineering',
    ],
  },
  {
    label: 'Companies',
    lines: [
      'Commerce, retail, and logistics software',
      'Where marketplace domain knowledge pays off on day one',
      'Technical enough that a working model beats a deck',
    ],
  },
  {
    label: 'Arrangement',
    lines: [
      'Remote, or hybrid from Greenville, SC',
      'Open to travel for accounts and events',
    ],
  },
  {
    label: 'What I need',
    lines: [
      'Access to the customer conversation',
      'Permission to build the answer, not just file the request',
    ],
  },
];

/* ── selected results ───────────────────────────────────────────────── */

/**
 * The accomplishments block. Rather than restate numbers — the fastest way
 * for a résumé and a portfolio to start contradicting each other — this
 * names a project and a metric label, and the value is looked up in
 * lib/projects.ts at render time. Change a metric there and it changes
 * here, or it disappears. It cannot go stale and it cannot be inflated
 * independently of the case study that defends it.
 */
export interface SelectedResult {
  slug: string;
  /** Must match a `metrics[].label` on that project exactly. */
  label: string;
}

const SELECTED: SelectedResult[] = [
  { slug: 'recovery-profitability-suite', label: 'Correction to initial recovery estimate' },
  { slug: 'acv-forecast-engine', label: 'P10–P90 spread widening vs. independence' },
  { slug: 'carrier-spend-analysis', label: 'Annualised late-fee exposure identified' },
  { slug: 'recovery-profitability-suite', label: 'Rank elasticity of revenue' },
  { slug: 'marketplace-beta', label: 'RSS sources ingested' },
  { slug: 'weekly-growth-brief-engine', label: 'Competitors tracked' },
];

export interface ResolvedResult {
  value: string;
  label: string;
  project: Project;
}

/** Drops silently rather than rendering a hole if a metric was removed. */
export function selectedResults(): ResolvedResult[] {
  return SELECTED.flatMap(({ slug, label }) => {
    const project = published.find((p) => p.slug === slug);
    const metric = project?.metrics?.find((m) => m.label === label);
    return project && metric
      ? [{ value: metric.value, label: metric.label, project }]
      : [];
  });
}

/* ── résumé block ───────────────────────────────────────────────────── */

/**
 * Education. Empty until Ryan states the credential.
 * TODO(ryan): HANDOFF.md references graduate EE coursework — add the
 * institution and credential here and the section renders itself.
 */
export const education: { credential: string; org: string; note?: string }[] =
  [];

/** Derived headline numbers. Counted, never typed. */
export const stats = {
  get shipped() {
    return published.filter(
      (p) => p.status === 'Live' || p.status === 'Built'
    ).length;
  },
  get live() {
    return published.filter((p) => p.status === 'Live').length;
  },
  get total() {
    return published.length;
  },
  /** Chapters with at least one shipped system behind them. */
  get buildingChapters() {
    return chapters.filter((c) => shippedIn(c).length > 0).length;
  },
};

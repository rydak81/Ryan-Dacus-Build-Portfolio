/**
 * lib/career.ts
 * Single source of truth for the /about profile — the same discipline
 * lib/projects.ts applies to work, applied to biography.
 *
 * Sourced from Ryan's four role-targeted résumés (business development,
 * partnerships/AI SaaS, partnerships/channel, revops/enablement), combined
 * into one generalised profile. Where the four disagreed, the broader
 * phrasing won; where a résumé claimed something the site's content
 * discipline forbids, the site's rule won. Those three cases are marked
 * inline below with `RESUME DIVERGENCE` so nobody silently "fixes" them
 * back:
 *
 *   1. Three résumés describe the Voadera forecasting engine as applying
 *      "machine learning models". Nothing in lib/projects.ts is a trained
 *      model — AgencyForecast is explicitly flagged as a heuristic
 *      ensemble — and HANDOFF.md forbids the claim outright. Written here
 *      as Monte Carlo plus Bayesian updating, which is what it is.
 *   2. The résumés name signed and in-pipeline partner organisations.
 *      HANDOFF.md: real partner names never get published. Omitted.
 *      Threecolts' own product lines (MarginPro, CedCommerce, Seller
 *      Directories) are not partners and do appear.
 *   3. Two résumés list GPT-4 in the skills stack. HANDOFF.md names
 *      "GPT-4-in-production" as a forbidden claim and the shipped pipeline
 *      runs Claude plus DALL·E 3. Not carried over.
 *
 * The rule from lib/projects.ts carries over unchanged: never promote a
 * claim above what the evidence supports. `resolveCapability()` enforces
 * that mechanically for the capability ledger — a "shipped" claim that
 * cites no Live or Built project is demoted to "working".
 */

import { published, type Project, type Status } from './projects';

/* ── profile ────────────────────────────────────────────────────────── */

export interface Profile {
  name: string;
  /** One line. The claim a recruiter reads before anything else. */
  headline: string;
  location: string;
  email: string;
  /**
   * On all four résumés, and deliberately NOT rendered here.
   * TODO(ryan): flip `publishPhone` to true if you want it on the public
   * page. It would be crawlable and scrapable the moment it ships, which
   * is why the default is off rather than on.
   */
  phone: string;
  publishPhone: boolean;
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
    'Twenty years opening markets and carrying a revenue number — and a working portfolio of the systems I built rather than waited for.',
  location: 'Greenville, SC',
  email: 'ryandacus@gmail.com',
  phone: '(864) 915-3193',
  publishPhone: false,
  linkedin: 'https://linkedin.com/in/ryandacus-sbc',
  github: 'https://github.com/rydak81',
  // portrait: '/ryan.jpg',   // TODO(ryan): add the file, then uncomment.
  availability: {
    open: true,
    line: 'Open to partnerships, GTM engineering, and solutions roles',
  },
};

/** Career start year. Drives the counted "years" stat so it never goes stale. */
export const CAREER_START = 2005;

/* ── the operating thesis ───────────────────────────────────────────── */

/**
 * The "about me" that isn't a summary of the résumé below it. Three
 * paragraphs, each doing a different job: what I do, why it's unusual,
 * what I'm optimising for next. Synthesised from the professional summary
 * on all four targeted résumés.
 */
export const mission = {
  eyebrow: 'Operating thesis',
  title:
    'The gap between the people who sell software and the people who build it is the whole opportunity.',
  body: [
    'Twenty years opening markets and originating revenue. I was the founding sales hire at an Amazon brand growth agency and built the commercial function from nothing — ICP, outbound motion, service packaging, pricing — grew personal production past $1M in annual contract value, and hired and led a team of six. Then I did the same thing again from zero, building a net-new channel program at a commerce SaaS portfolio.',
    'What is unusual is the second half. I build the tooling I run the business on: the forecasting engine, the QBR dashboard, the prospecting console, the enablement library. Production multi-model AI pipelines, React on Supabase, probabilistic forecasting done from first principles. Everything on this site came out of a problem inside my own revenue work, and most of it went live against real accounts while I was still carrying a quota.',
    'What I want next is a seat where both halves are load-bearing: close enough to customers that I feel the friction first, and trusted enough to go build the answer rather than file a request for it. Partnerships, go-to-market engineering, solutions consulting, revenue operations — the titles vary, the job does not.',
  ],
};

/* ── career chapters ────────────────────────────────────────────────── */

export interface Chapter {
  id: string;
  /** Short label for the timeline rail. Keep it tight — it sets on an axis. */
  label: string;
  /** Full role title. */
  title: string;
  org: string;
  /** One line on what the company is. Renders under the org on the résumé. */
  context?: string;
  period?: string;
  location?: string;
  /** What I was commercially accountable for. Trace panel, left column. */
  mandate: string;
  /** The systems half of the same chapter. Trace panel, right column. */
  build: string;
  /** One sentence. What this chapter taught that the next one needed. */
  lesson: string;
  /** Résumé bullets. The plain, skimmable, ATS-readable version. */
  bullets: string[];
  /**
   * `org` values in lib/projects.ts that belong to this chapter. The
   * timeline counts and lists projects from here — nothing is retyped, so
   * the evidence can never drift from the shelf.
   */
  orgs: string[];
}

export const chapters: Chapter[] = [
  {
    id: 'earlier',
    label: 'Earlier career',
    title: 'B2B sales and independent e-commerce operations',
    org: 'Multiple industries · Independent',
    period: '2005 – 2021',
    mandate:
      'Progressive business-to-business sales and sales management roles across several industries, building the foundation of a twenty-year revenue career — while concurrently sourcing, listing, and scaling my own product businesses on eBay and Amazon FBA.',
    build:
      'No software from this chapter, and that is the point: every tool further down this page is a response to it. Spreadsheets rebuilt weekly, pricing decided on instinct, and inventory and margin questions answered by hand because there was nothing to answer them with.',
    lesson:
      'Owning the P&L of a real catalogue is why the unit economics in every model here are the seller’s, not a textbook’s.',
    bullets: [
      'Progressive business-to-business sales and sales management roles across multiple industries, building the foundation of a twenty-year revenue career.',
      'Concurrently sourced, listed, and scaled independent product businesses on eBay and Amazon FBA — operator experience that shaped a sales career built around the customer’s P&L rather than the vendor’s pitch.',
    ],
    orgs: [],
  },
  {
    id: 'junglescout',
    label: 'Jungle Scout',
    title: 'Sales Executive',
    org: 'Jungle Scout',
    context: 'Amazon seller analytics and sourcing SaaS platform',
    period: 'Sep 2021 – Feb 2022',
    mandate:
      'Sold the full SaaS suite to Amazon sellers, agencies, and consumer brands in a high-velocity, metrics-driven environment — the first time I worked inside a mature revenue stack rather than building one.',
    build:
      'Nothing built here. What this chapter produced was a template: agency accounts had to be worked as a multi-client, ecosystem relationship rather than a single account, which is the motion I would later be hired to build from scratch.',
    lesson:
      'Seeing a category-leading revenue org run properly is what made the gaps in every subsequent one obvious.',
    bullets: [
      'Sold the full product suite to Amazon sellers, agencies, and consumer brands inside a mature, metrics-driven revenue stack and reporting cadence.',
      'Built territory strategy and outbound approach for underpenetrated agency and brand segments.',
      'Agency accounts required a multi-client, ecosystem-style relationship model rather than single-account selling — the first version of the channel motion I would later build from zero.',
    ],
    orgs: [],
  },
  {
    id: 'sellerinteractive',
    label: 'Seller Interactive',
    title: 'Sales Team Lead / Senior Sales Executive',
    org: 'Seller Interactive',
    context: 'Hybrid Amazon brand growth agency — founding sales hire',
    period: 'Feb 2022 – Mar 2025',
    mandate:
      'Founding sales hire. Built the commercial function from zero — ICP definition, outbound motion, service packaging, pricing model — grew personal production past $1M in annual contract value at peak, and hired, ramped, and led a team of six representatives to consistent quota attainment.',
    build:
      'Systems, not software. The playbooks, qualification frameworks, pricing structure, deal-desk practice, and onboarding curriculum the department ran on, with Monday.com administered as its CRM and source of truth. This is the chapter where it became clear that the thing I was actually good at was building the operating system, not just working inside it.',
    lesson:
      'Three years of rebuilding the same reports by hand is what made the cost of waiting for tooling finally exceed the cost of learning to build it.',
    bullets: [
      'Founding sales hire at a hybrid Amazon brand growth agency; built the commercial function from zero — ICP definition, outbound motion, service packaging, and pricing model — and progressed to Sales Team Lead over three years of category-leading growth.',
      'Grew personal production to $1M+ in annual contract value at peak across a multi-service portfolio requiring long-cycle, multi-stakeholder negotiation.',
      'Hired, ramped, and led a team of 6+ representatives to consistent quota attainment; owned forecasting, pipeline hygiene, and Monday.com as the department’s primary CRM and source of truth.',
      'Structured the hybrid retainer-plus-performance commercial model and the deal-desk practice governing commercial exceptions.',
      'Designed onboarding and ramp programs for new sales hires, compressing time to first close.',
      'Identified and developed new market segments and service lines as the agency expanded its category footprint.',
    ],
    orgs: [],
  },
  {
    id: 'voadera',
    label: 'Voadera',
    title: 'Sales & Business Development Manager',
    org: 'Voadera',
    context: 'Amazon FBA wholesale and resale operator',
    period: 'Mar 2025 – Jan 2026',
    mandate:
      'Sourced, negotiated, and managed brand and supplier relationships as ongoing commercial relationships — owning terms, margin structure, and performance expectations rather than one-off transactions — against a lead and prospect database large enough that the spreadsheet holding it had already failed.',
    build:
      'Architected the business development CRM from scratch in Monday.com and wired it into the company ERP, then put a probabilistic forecast on top of it. The first time a system I built was the system of record for someone else’s job.',
    lesson:
      'A forecast is not a number, it is a distribution — and the people reading it can handle that if you show them the range.',
    bullets: [
      'Sourced, developed, and negotiated brand and supplier partnerships for an Amazon-focused wholesale and resale operation, owning terms, margin structure, and performance expectations.',
      'Architected the business development CRM in Monday.com — a large lead and prospect database integrated with the company ERP to automate pipeline, BDR outreach status, opportunity scoring, and estimated ACV.',
      // RESUME DIVERGENCE (1): résumés say "machine learning models" here.
      // Nothing in the shipped engine is a trained model, and HANDOFF.md
      // forbids the claim. Described as what it actually is.
      'Built a pipeline forecasting engine on top of it — Monte Carlo simulation with Bayesian updating as deals moved — replacing gut-feel estimates with a distribution carrying a real confidence range.',
      'Systematized supplier sourcing and evaluation into a repeatable, criteria-driven screening process.',
      'Owned origination end to end: market mapping, prospect identification, outreach, terms negotiation, and account onboarding.',
    ],
    orgs: ['Voadera'],
  },
  {
    id: 'threecolts',
    label: 'Threecolts',
    title: 'Partnerships Manager',
    org: 'Threecolts',
    context:
      'E-commerce SaaS portfolio — MarginPro, CedCommerce, Seller Directories',
    period: 'Jan 2026 – Present',
    location: 'Remote — Greenville, SC',
    mandate:
      'Primary relationship owner for an agency channel I built from zero — partner ICP, segmentation, recruitment motion, enablement library, onboarding path, and co-sell model — managing multiple organisations at once against quarterly targets for channel-sourced revenue and net-new agreements, and negotiating the terms and commercial structures underneath them.',
    build:
      'The largest block of work on this site. The system of record and funnel definition the program launched on, the enablement portal that does the account’s work for them, the recovery and profitability engine, the QBR command center, the forecast engine, and the weekly intelligence brief that replaced a standing day of manual research.',
    lesson:
      'Presented one of these internally as the company case study in applied AI — which is when it became clear the building was not a side activity.',
    bullets: [
      'Opened a net-new channel revenue stream from zero — defined the ICP, segmentation model, and value proposition across the MarginPro, CedCommerce, and Seller Directories product lines.',
      'Serve as primary relationship owner for the agency channel, managing multiple high-visibility organisations simultaneously against quarterly targets for channel-sourced revenue and new agreements.',
      'Negotiate terms, commercial structures, and performance expectations; own the full lifecycle post-signature through enablement, onboarding, activation, and ongoing co-sell expansion.',
      'Built the program’s reporting infrastructure — a React and Supabase QBR dashboard applying Bayesian updating and OLS regression — replacing a manual quarterly reporting process with live channel-sourced ACV trends and forward forecasts for leadership.',
      'Built a prospecting command center consolidating Salesforce, Apollo, LinkedIn Sales Navigator, and Dripify into one workflow, scaling outbound capacity without added headcount.',
      'Authored a 1P market strategy report identifying enterprise Vendor Central agencies as an underpenetrated segment; findings redirected go-to-market targeting.',
      'Run a standing competitive intelligence program tracking 20 competitors and seven platform surfaces weekly, mapped to product line so findings drive positioning and promotional decisions.',
      'Authored the enablement deck, onboarding path, and a master multi-channel outreach playbook covering email, LinkedIn, text, and phone with segment-specific sequencing.',
    ],
    orgs: ['Threecolts'],
  },
  {
    id: 'ventures',
    label: 'Ventures',
    title: 'Founder — BeaconPath Holdings and Marketplace Beta',
    org: 'BeaconPath Holdings · Marketplace Beta',
    context: 'Acquisition holding company · e-commerce intelligence platform',
    period: '2024 – Present · concurrent',
    location: 'Greenville, SC',
    mandate:
      'Run concurrently with the roles above, not after them. An acquisition holding company screening cash-flowing operating businesses against a defined thesis, and an e-commerce intelligence publication with a real audience of agency operators.',
    build:
      'Marketplace Beta end to end — a multi-model AI editorial pipeline with model tier matched deliberately to task and cost, five scheduled stages, an email layer, and embedded operator tools. Alongside it, an SBA-structured acquisition screening engine and the relational deal pipeline that feeds it.',
    lesson:
      'Shipping something with no employer behind it is the only way to find out which parts of the job you were actually doing.',
    bullets: [
      'BeaconPath Holdings, LLC (2024 – Present): founded an acquisition holding company screening cash-flowing operating businesses — $350K–$550K SDE, $1.2M–$2M+ revenue — across logistics, trucking, manufacturing, and services.',
      'Built the diligence toolset end to end: a relational deal pipeline in Notion and Airtable tracking targets by stage, financials, and thesis fit, feeding a Python and Streamlit engine performing SDE normalisation, valuation multiple analysis, working capital modelling, and SBA 7(a) debt-service modelling.',
      'Conduct diligence directly — financial statement analysis, customer concentration risk, and capital structure — including FedEx ISP route operations and domestic manufacturing candidates.',
      'Marketplace Beta (2025 – Present): founded and operate an e-commerce intelligence publication and operator toolset for Amazon and Walmart agency operators, designed, built, and shipped solo.',
      'Runs a production multi-model AI pipeline with model tier matched to task and cost — Claude Haiku for classification and triage, Claude Sonnet for editorial reasoning, DALL·E 3 for imagery — on Next.js, Supabase, and Vercel with scheduled jobs and a subscriber email layer.',
    ],
    orgs: [
      'Marketplace Beta',
      'Founder',
      'Independent',
      'BeaconPath Holdings',
    ],
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
 *   'working'  used it for real, but nothing on this site proves it
 *   'studied'  coursework or reading. Says so, in as many words.
 *
 * Only 'shipped' takes the warm colour, which is the same rule the rest of
 * the site runs on: nothing is warm unless it is true. Commercial skills
 * that no repo can evidence sit honestly at 'working' with a note pointing
 * at the role that earned them — the ledger is about what this site can
 * prove, not about what is on the résumé.
 */
export type Proof = 'shipped' | 'working' | 'studied';

export interface Capability {
  name: string;
  claim: Proof;
  /** Project slugs from lib/projects.ts. The proof, not a decoration. */
  evidence: string[];
  /** Required on 'studied'. Where a claim gets its limits stated. */
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
    label: 'Commercial',
    items: [
      {
        name: 'Building a revenue function from zero',
        claim: 'working',
        evidence: [],
        note: 'Twice: founding sales hire at an agency, then a net-new channel program at a commerce SaaS portfolio. Evidenced by the roles below, not by a repo.',
      },
      {
        name: 'Team hiring, ramping, and coaching',
        claim: 'working',
        evidence: [],
        note: 'Hired, ramped, and led a team of six to consistent quota attainment, including the onboarding curriculum they ramped on.',
      },
      {
        name: 'Contract, pricing, and program structure',
        claim: 'working',
        evidence: [],
        note: 'Hybrid retainer-plus-performance agency model and the deal-desk practice governing commercial exceptions; channel terms and performance expectations across three product lines.',
      },
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
        name: 'Competitive and market intelligence',
        claim: 'shipped',
        evidence: ['weekly-growth-brief-engine', '1p-market-strategy'],
      },
    ],
  },
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
        name: 'Kalman filtering and state estimation',
        claim: 'studied',
        evidence: [],
        note: 'Graduate electrical engineering coursework, applied to battery state-of-charge algorithm development. Not implemented in anything on this site, and I would not claim it as production experience.',
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
      {
        name: 'ERP and multi-system integration',
        claim: 'shipped',
        evidence: ['voadera-bd-crm', 'prospecting-command-center'],
      },
    ],
  },
  {
    label: 'Domain and finance',
    items: [
      {
        name: 'Marketplace domain — Amazon 1P/3P/FBA, Walmart, TikTok Shop',
        claim: 'shipped',
        evidence: [
          'recovery-profitability-suite',
          'weekly-growth-brief-engine',
          'fba-deal-analyzer',
        ],
      },
      {
        name: 'Acquisition screening, SDE normalisation, SBA 7(a) structuring',
        claim: 'shipped',
        evidence: ['acquisition-analyzer', 'acquisition-deal-pipeline'],
      },
      {
        name: 'Margin, unit economics, and spend analysis',
        claim: 'shipped',
        evidence: ['carrier-spend-analysis', 'recovery-profitability-suite'],
      },
      {
        name: 'Amazon and eBay seller operations',
        claim: 'working',
        evidence: [],
        note: 'Sourced, listed, priced, and scaled my own catalogues with my own capital at risk. The operator experience underneath every model on this site.',
      },
    ],
  },
];

/* ── what I'm looking for ───────────────────────────────────────────── */

/**
 * The section every portfolio omits and every recruiter needs. The four
 * tracks map to the four role-targeted résumés — being specific here
 * disqualifies bad fits early, which is the point.
 */
export const lookingFor: { label: string; lines: string[] }[] = [
  {
    label: 'Roles',
    lines: [
      'Partnerships, channel, and ecosystem revenue',
      'Business development and new market entry',
      'Go-to-market engineering and solutions consulting',
      'Revenue operations and sales enablement',
    ],
  },
  {
    label: 'Companies',
    lines: [
      'Commerce, retail, and logistics software',
      'B2B SaaS and AI tooling with a real integration story',
      'Where marketplace domain knowledge pays off on day one',
      'Technical enough that a working model beats a deck',
    ],
  },
  {
    label: 'Arrangement',
    lines: [
      'Remote, or hybrid from Greenville, SC',
      'Open to travel for accounts and events',
      'Currently remote and productive that way',
    ],
  },
  {
    label: 'What I need',
    lines: [
      'Access to the customer conversation',
      'Permission to build the answer, not just file the request',
      'A number to carry — I do better work with one',
    ],
  },
];

/* ── selected results ───────────────────────────────────────────────── */

/**
 * The accomplishments block. Project results name a project and a metric
 * label, and the value is looked up in lib/projects.ts at render time —
 * rather than restated, which is the fastest way for a résumé and a
 * portfolio to start contradicting each other. Change a metric there and
 * it changes here, or it disappears.
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

/**
 * Career figures. These have no project to look up — the evidence is the
 * role, so they carry the chapter rather than a link, and they are kept in
 * a separate list so nobody mistakes them for something lib/projects.ts
 * can verify.
 */
export const careerResults: { value: string; label: string; chapter: string }[] =
  [
    {
      value: '$1M+',
      label: 'Personal annual contract value at peak',
      chapter: 'Seller Interactive',
    },
    {
      value: '6+',
      label: 'Representatives hired, ramped, and led to quota',
      chapter: 'Seller Interactive',
    },
    {
      value: '2',
      label: 'Revenue functions built from zero',
      chapter: 'Seller Interactive · Threecolts',
    },
  ];

/* ── education ─────────────────────────────────────────────────────── */

export const education: { credential: string; org: string; note?: string }[] = [
  {
    credential: 'Bachelor of Science, Business Management — August 2005',
    org: 'Clemson University, Clemson, SC',
  },
  {
    credential: 'Graduate-level coursework, Electrical Engineering',
    org: 'Continued development',
    note: 'Battery state-of-charge algorithm development, with prerequisite coursework in electrical fundamentals and battery chemistry across consumer, power tool, and automotive cell types.',
  },
  {
    credential: 'Applied acoustics — self-directed',
    org: 'Continued development',
    note: 'Frequency response and target-curve fitting, parametric equalisation, transducer and enclosure characteristics, and frequency-band gain as it relates to speech intelligibility.',
  },
  {
    credential: 'Acquisition finance and SMB M&A',
    org: 'Continued development',
    note: 'ETA and SBA 7(a) structuring, financial statement and valuation analysis. Applied directly in BeaconPath Holdings’ screening engine.',
  },
];

/* ── derived stats ─────────────────────────────────────────────────── */

/** Headline numbers. Counted, never typed. */
export const stats = {
  /** Computed at build time from CAREER_START so it cannot go stale. */
  get years() {
    return new Date().getFullYear() - CAREER_START;
  },
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

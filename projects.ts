/**
 * lib/projects.ts
 * Single source of truth for all portfolio content.
 *
 * STATUS VOCABULARY — use these exactly, and never inflate:
 *   'Live'        deployed, reachable, URL verified
 *   'Built'       functional artifact that runs; not hosted
 *   'Designed'    architecture, schema, and spec exist; not implemented
 *   'In Progress' actively being built
 *   'Analysis'    research or analytical deliverable, not software
 *   'Retired'     was built and running; intentionally shut down
 *
 * Statuses below were verified against the Vercel account on 2026-07-30.
 * TODO markers indicate the few items still needing Ryan's confirmation.
 */

export type Status =
  | 'Live'
  | 'Built'
  | 'Designed'
  | 'In Progress'
  | 'Analysis'
  | 'Retired';

export type Tier = 1 | 2 | 3;

export type Group =
  | 'Revenue Systems & Forecasting'
  | 'AI Products & Pipelines'
  | 'Financial & Acquisition Analysis'
  | 'Strategy & Enablement';

export type Interactive = 'correlation' | 'recovery' | 'bayesian';

export interface Metric {
  label: string;
  value: string;
}

export interface Project {
  slug: string;
  title: string;
  org: string;
  tier: Tier;
  group: Group;
  status: Status;
  role: string;
  /** Not rendered. Keeps résumé / LinkedIn / site naming from drifting apart. */
  aliases?: string[];
  problem: string;
  built: string;
  changed: string;
  stack: string[];
  /** Only verified numbers. If you can't defend it in an interview, leave it out. */
  metrics?: Metric[];
  url?: string;
  repo?: string;
  interactive?: Interactive;
  diagram?: boolean;
  /** Rendered as a small muted line on the card. Honesty is the point. */
  note?: string;
}

export const projects: Project[] = [
  // ─────────────────────────────────────────────────────────────
  // TIER 1 — Deep case studies
  // ─────────────────────────────────────────────────────────────
  {
    slug: 'acv-forecast-engine',
    title: 'Partner ACV Forecast Engine',
    org: 'Threecolts',
    tier: 1,
    group: 'Revenue Systems & Forecasting',
    status: 'Built',
    role: 'Designed and built solo',
    aliases: ['Probabilistic Forecasting Engine', 'AI Decision Support'],
    problem:
      'Pipeline forecasts treat deals as independent events. They are not — quarter-end pressure, macro conditions, and shared activation capacity make them move together. Assuming independence produces a forecast that looks confident and understates real risk in both directions.',
    built:
      'A three-file Python package pairing two independent estimators. A factor-structured Gaussian copula Monte Carlo injects dependence through a shared market factor plus segment and activation-capacity factors, preserving each deal\u2019s marginal close probability exactly and guaranteeing a positive semi-definite correlation matrix by construction. Alongside it, a conjugate Normal-Inverse-Gamma Bayesian run-rate model with trend and Fourier seasonality produces Student-t posterior predictive intervals that widen honestly as the horizon extends. Three deal states with correlated close-by-activate gates, a tornado chart ranking which single deal most moves the probability of hitting target, and a documented Close CRM REST adapter.',
    changed:
      'Replaced a single-number forecast with two independently derived distributions and an explicit read on where they disagree. The tornado output changed which deal got worked: unsticking one stalled activation moved the probability of hitting target more than closing either of the two largest opportunities, which were already priced in.',
    stack: ['Python', 'NumPy', 'SciPy', 'pandas', 'Matplotlib', 'Close CRM API'],
    metrics: [
      { label: 'P10–P90 spread widening vs. independence', value: '+41%' },
      { label: 'Floor-miss probability, corrected', value: '28% → 34%' },
      { label: 'Monte Carlo P50 vs. Bayesian P50', value: '$199K / $182K' },
      { label: 'Top tornado lever', value: '+10.3 pts' },
    ],
    interactive: 'correlation',
    note: 'Runs locally. The interactive above is a browser reimplementation of the same copula model.',
  },
  {
    slug: 'marketplace-beta',
    title: 'Marketplace Beta',
    org: 'Founder',
    tier: 1,
    group: 'AI Products & Pipelines',
    status: 'Live',
    role: 'Designed, built, and operated solo',
    aliases: ['Marketplace Intelligence Platform', 'margin-intel-hub', 'Ecom Intel Hub'],
    problem:
      'Amazon, Walmart, and marketplace agency operators have no single credible resource tracking what is actually changing in their industry — and that audience is exactly the buyer profile worth reaching.',
    built:
      'An e-commerce intelligence publication and aggregation platform, built end to end. A multi-model AI pipeline runs the editorial operation with model tier matched deliberately to task complexity against cost: Claude Haiku for classification, tagging, and triage where throughput and price dominate; Claude Sonnet for original editorial analysis where reasoning quality dominates; DALL·E 3 for imagery. Everything routes through the Vercel AI Gateway. Five scheduled stages handle fetch, classify, generate, illustrate, and cleanup, with a Resend-powered email layer for subscriber delivery. Embedded operator tools — PriceScope, AgencyForecast, and a recovery estimator — give the audience a reason to return.',
    changed:
      'Operates as an industry resource, an audience engine, and a lead-generation surface simultaneously. Presented internally at Threecolts as the company case study in applied AI.',
    stack: [
      'Next.js', 'TypeScript', 'Tailwind CSS', 'shadcn/ui',
      'Supabase / PostgreSQL', 'Vercel', 'Vercel Cron', 'Vercel AI Gateway',
      'Resend', 'React Email', 'Claude Sonnet', 'Claude Haiku', 'DALL·E 3',
    ],
    metrics: [{ label: 'RSS sources ingested', value: '77+' }],
    url: 'https://marketplacebeta.com',
    repo: 'https://github.com/rydak81/margin-intel-hub',
    diagram: true,
  },
  {
    slug: 'recovery-profitability-suite',
    title: 'Amazon Recovery & Profitability Suite',
    org: 'Threecolts',
    tier: 1,
    group: 'Financial & Acquisition Analysis',
    status: 'Live',
    role: 'Built the engine and every deliverable',
    aliases: ['ProfitPath AI', 'Commerce Operations Intelligence Platform', 'MarginPro Recovery Estimator'],
    problem:
      'Brands cannot see true per-ASIN profitability, and nobody could credibly size 3P reimbursement recovery without either guessing or overselling it.',
    built:
      'One parameterized Python engine driving three analytical reports and an interactive calculator, so every number reconciles across every document. A 20,000-trial Monte Carlo forward revenue projection incorporating a seasonality index, per-ASIN lognormal estimate error, cohort growth drift, and a hero-ASIN disruption shock. Per-ASIN profitability reconstruction using modeled COGS by product line and TACoS by listing-age cohort. Bayesian shrinkage on star ratings to stop low-volume ASINs from dominating. OLS rank elasticity. Concentration analysis. And a recovery model rebuilt bottom-up on units times manufacturing cost, matching Amazon\u2019s post-March-2025 reimbursement policy.',
    changed:
      'I flagged my own first recovery estimate as roughly 2.5× overstated — it had been sized as a percentage of revenue rather than bottom-up on units and manufacturing cost — and rebuilt it before it reached a partner. Sensitivity analysis on the corrected model showed average selling price largely cancels out, and the real driver of recovery rate is landed COGS as a share of retail price. That finding changed how the opportunity gets sized in every conversation since.',
    stack: ['Python', 'pandas', 'NumPy', 'Monte Carlo simulation', 'Bayesian shrinkage', 'OLS regression'],
    metrics: [
      { label: 'Correction to initial recovery estimate', value: '2.5× overstated' },
      { label: 'Rank elasticity of revenue', value: '−1.30 (R² 0.76)' },
      { label: 'Catalog concentration', value: 'Gini 0.83 · HHI 1,511' },
      { label: 'Monte Carlo trials', value: '20,000' },
    ],
    // TODO: link only after the partner-economics panel is deleted from source.
    // Verified live at v0-recovery-calculator.vercel.app
    interactive: 'recovery',
  },
  {
    slug: 'qbr-funnel-command-center',
    title: 'QBR Dashboard & Partner Funnel Command Center',
    org: 'Threecolts',
    tier: 1,
    group: 'Revenue Systems & Forecasting',
    status: 'Built',
    role: 'Designed and built solo',
    aliases: ['Agency Intelligence OS', 'Executive Dashboard'],
    problem:
      'Partner program quarterly reviews were assembled by hand every cycle. Leadership got a static snapshot well after the fact, with no forward view and no way to interrogate it.',
    built:
      'A five-tab React dashboard on Supabase: program overview, pipeline management with full CRUD, an interactive funnel model with live-updating sliders, cadence targets by period, and an insights tab. The inference layer runs client-side and was implemented from first principles rather than pulled from a library — Beta-distribution conjugate Bayesian updating on partner conversion signals, OLS multivariate regression solved by Gaussian elimination, and probability decay applied to stalled deals so a forecast degrades honestly when nothing is happening.',
    changed:
      'Built to replace a manual, backward-looking reporting cycle with live program visibility and a forward projection attached. A multi-user version was fully specced on Supabase; I stopped short of standing it up once the hosting cost exceeded what the tool was returning.',
    stack: ['React', 'Supabase / PostgreSQL', 'TypeScript', 'Bayesian updating', 'OLS regression'],
    interactive: 'bayesian',
    note: 'Multi-user version designed and specced, deliberately not deployed on cost grounds.',
  },
  {
    slug: 'weekly-growth-brief-engine',
    title: 'Weekly Growth Brief Engine',
    org: 'Threecolts',
    tier: 1,
    group: 'AI Products & Pipelines',
    status: 'Live',
    role: 'Designed and built solo',
    problem:
      'Staying current on marketplace platform changes and competitor moves is roughly a full day of research a week — so in practice it never happens consistently, and go-to-market decisions get made on stale information.',
    built:
      'An automated weekly intelligence system monitoring seven platform surfaces — Shopify Agentic Storefronts, Google\u2019s Universal Commerce Protocol, Meta and Instagram commerce, TikTok Shop, Amazon Seller Central, and Walmart Marketplace — alongside twenty named competitors including GETIDA, Helium 10, Jungle Scout, Rithum, Linnworks, and Pacvue. Every finding is scored for impact and mapped to a specific product line so nothing lands as trivia. Outputs a colour-coded Excel tracker with a historical changelog plus a styled HTML brief covering what changed, who moved first, which acquisition surfaces opened, and three prioritised experiments with hypotheses and success metrics.',
    changed:
      'Converts a recurring day of manual research into an automated weekly deliverable, and produces a running historical record of platform and competitor movement that did not previously exist.',
    stack: ['Claude', 'Automated web research', 'Python', 'openpyxl', 'Structured HTML reporting', 'Scheduled execution'],
    metrics: [
      { label: 'Platform surfaces monitored', value: '7' },
      { label: 'Competitors tracked', value: '20' },
    ],
  },

  // ─────────────────────────────────────────────────────────────
  // TIER 2 — Cards
  // ─────────────────────────────────────────────────────────────
  {
    slug: 'partner-enablement-portal',
    title: 'Partner Enablement Portal',
    org: 'Threecolts',
    tier: 2,
    group: 'Revenue Systems & Forecasting',
    status: 'Built',
    role: 'Designed and built solo',
    problem:
      'Partners sign after getting excited about the revenue share, then go quiet and never actually introduce anyone. Time-to-first-referral ran around ninety days, and the standard response — more check-in calls — treats the symptom.',
    built:
      'A partner portal that does the operational work on the partner\u2019s behalf so the friction between intent and action approaches zero. Eight sections: a personalised dashboard, a seven-milestone onboarding timeline, a twelve-asset pitch toolkit, copy-to-clipboard email templates, a LinkedIn post library, a co-marketing calendar, deal registration, and a tier and revenue dashboard. Behind it, a full Next.js App Router architecture across thirteen routes with a Supabase schema, row-level security policies, and Resend notifications.',
    changed:
      'Designed against a target of cutting time-to-first-referral from roughly ninety days to fourteen. Built as a working prototype with the production architecture specced end to end.',
    stack: ['React', 'Next.js', 'Recharts', 'Supabase / PostgreSQL', 'Row-level security', 'Resend'],
    note: 'Design target, not a measured result.',
  },
  {
    slug: 'prospecting-command-center',
    title: 'Prospecting Command Center',
    org: 'Threecolts',
    tier: 2,
    group: 'Revenue Systems & Forecasting',
    status: 'Built',
    role: 'Designed and built solo',
    problem:
      'Outbound ran across four disconnected systems. Reps spent their day switching tabs and hand-carrying data between tools instead of having conversations.',
    built:
      'A React operations dashboard consolidating Salesforce, Apollo, LinkedIn Sales Navigator, and Dripify into a single workflow, with a Boolean search builder, CRM lead scoring, and automated data enrichment.',
    changed:
      'Consolidated four systems into one workflow, removing the manual handoffs between them.',
    stack: ['React', 'Supabase', 'Salesforce', 'Apollo API', 'LinkedIn Sales Navigator', 'Dripify'],
  },
  {
    slug: 'voadera-bd-crm',
    title: 'Business Development CRM & Forecasting Engine',
    org: 'Voadera',
    tier: 2,
    group: 'Revenue Systems & Forecasting',
    status: 'Live',
    role: 'Architected and administered',
    problem:
      'Lead and prospect data lived in spreadsheets disconnected from the company system of record. Outreach status, opportunity potential, and pipeline value were updated by hand and stale by the time anyone looked. Forecasting was an educated guess.',
    built:
      'Architected the business development CRM from scratch in Monday.com — a large lead and prospect database structured around BDR outreach tracking, opportunity scoring, and estimated pipeline ACV — then wired it into the company ERP through automations and a structured import/export process so pipeline status moved on a fast, largely automated cycle instead of manual re-entry. Layered a forecasting engine on top using Monte Carlo simulation to model the distribution of outcomes rather than a single number, with Bayesian updating to revise probabilities as deals moved.',
    changed:
      'Gave the BD function one source of truth connected to the system of record, and replaced gut-feel pipeline estimates with a probabilistic forecast carrying a real confidence range.',
    stack: ['Monday.com', 'ERP integration', 'Workflow automation', 'Monte Carlo simulation', 'Bayesian updating', 'Excel'],
    note: 'The only employer-scale systems build here with a live ERP integration.',
  },
  {
    slug: 'monday-partner-crm',
    title: 'Partner CRM',
    org: 'Threecolts',
    tier: 2,
    group: 'Revenue Systems & Forecasting',
    status: 'Live',
    role: 'Architected and implemented',
    problem:
      'A net-new channel program with no system of record, no funnel definition, and no way to see which partners were going cold.',
    built:
      'Four connected Monday.com boards — Agency Lead Pipeline, Active Partners, Outreach & Activities, and Partner Performance — with a ten-stage funnel, lead scoring, partner health scores, twelve automation recipes covering stale-lead alerts and stage-change logging, a KPI dashboard, and a fifty-seven agency import.',
    changed:
      'Gave a new channel program a working system of record and funnel definition from day one instead of improvising per partner.',
    stack: ['Monday.com', 'Workflow automation', 'Lead scoring', 'Excel'],
  },
  {
    slug: 'partner-health-slack',
    title: 'Partner Health Dashboard & Slack Workflow',
    org: 'Threecolts',
    tier: 2,
    group: 'Revenue Systems & Forecasting',
    status: 'In Progress',
    role: 'Designing and building',
    problem:
      'Partner health signals lived across disconnected systems. Nobody saw a partner going quiet until it was a churn conversation instead of a save.',
    built:
      'A dashboard surfacing partner health and engagement metrics in one view, wired into the partner Slack channel so status changes reach the team where they already work rather than waiting to be looked up.',
    changed:
      'Shifts partner management from reactive to monitored — the signal finds the team.',
    stack: ['React', 'Supabase', 'Slack API', 'Automated workflows'],
  },
  {
    slug: 'article-topic-classifier',
    title: 'Article & Topic Classifier',
    org: 'Marketplace Beta',
    tier: 2,
    group: 'AI Products & Pipelines',
    status: 'Live',
    role: 'Designed and built solo',
    problem:
      'An aggregation engine ingesting at volume is worthless if everything lands in one undifferentiated feed. Relevance has to be decided at ingest, not by the reader.',
    built:
      'A classification layer that categorises and tags incoming articles by topic and relevance and generates summaries automatically, routing content to the right destination and feeding the automated email sends. Built on Claude Haiku deliberately — classification is a high-volume, low-reasoning task where the cheaper, faster model is the correct engineering choice, and paying Sonnet rates for it would be a design error.',
    changed:
      'Lets the platform run continuously without a human reviewing every item, while keeping the feed coherent enough to be worth subscribing to.',
    stack: ['Claude Haiku', 'Supabase', 'Automated pipeline'],
  },
  {
    slug: 'pricescope',
    title: 'PriceScope',
    org: 'Marketplace Beta',
    tier: 2,
    group: 'AI Products & Pipelines',
    status: 'Built',
    role: 'Designed and built solo',
    aliases: ['AI Product Aggregator'],
    problem:
      'Resale pricing is fragmented across eBay, Facebook Marketplace, Craigslist, OfferUp, and Mercari, and no single view tells you what something is actually worth or which listing is genuinely underpriced.',
    built:
      'A cross-marketplace pricing intelligence tool with a working deal-scoring engine that ranks listings by standard deviations below the market average, sparkline trend charts, a price-distribution histogram with the deal zone highlighted, a filterable listings feed, and a tracker with threshold alerts. Runs on a simulated data layer designed to be swapped for live sources.',
    changed:
      'Demonstrates the statistical core of a pricing intelligence product without pretending the ingestion layer is solved.',
    stack: ['React', 'Statistical scoring', 'Recharts'],
    note: 'Semantic matching and duplicate detection are specced, not built. The working intelligence is statistical.',
  },
  {
    slug: 'agencyforecast',
    title: 'AgencyForecast',
    org: 'Marketplace Beta',
    tier: 2,
    group: 'AI Products & Pipelines',
    status: 'Built',
    role: 'Designed and built solo',
    problem:
      'Agencies model their clients\u2019 businesses constantly and their own almost never. The question of which lever actually moves agency profit usually gets answered by instinct.',
    built:
      'A six-tab business intelligence prototype modelling the agency itself: an adaptive forecast engine weighting trend, seasonality, momentum, and mean-reversion components with an adjustable horizon and a retrain step; a P&L waterfall and margin trend; an interactive growth-lever simulator with live projected revenue; a categorised growth playbook; and a market intelligence view.',
    changed:
      'Turns agency economics into something you can interrogate rather than argue about.',
    stack: ['React', 'Recharts', 'Weighted ensemble forecasting'],
    note: 'Heuristic weighted ensemble — not a trained machine learning model.',
  },
  {
    slug: 'fba-deal-analyzer',
    title: 'FBA Deal Analyzer Pro',
    org: 'Threecolts',
    tier: 2,
    group: 'Financial & Acquisition Analysis',
    status: 'Built',
    role: 'Designed and built solo',
    problem:
      'Evaluating an Amazon product opportunity means unit economics, multi-year projection, inventory planning, cash flow, and risk — normally across five disconnected spreadsheets.',
    built:
      'A seven-tab analysis tool: deal calculator covering COGS, margin, and wholesale pricing; five-year forecast; inventory planning with economic order quantity, reorder point, and safety stock on a seasonal schedule; a twenty-four month cash flow projection surfacing payback period and peak cash requirement; risk analysis scoring six weighted factors with NPV across three scenarios; a recovery audit module; and product comparison.',
    changed:
      'Collapses a multi-spreadsheet evaluation into one tool a seller or a rep can work through in a single sitting.',
    stack: ['Next.js', 'React', 'TypeScript', 'Financial modeling'],
  },
  {
    slug: 'acquisition-analyzer',
    title: 'Universal Business Acquisition Analyzer',
    org: 'BeaconPath Holdings',
    tier: 2,
    group: 'Financial & Acquisition Analysis',
    status: 'Built',
    role: 'Designed and built solo',
    aliases: ['BeaconPath Analyzer'],
    problem:
      'Evaluating acquisition targets means normalising inconsistent seller financials, testing valuation against comparable multiples, and modelling whether debt service actually works — repeated on every deal, by hand, in a different spreadsheet each time.',
    built:
      'A Python and Streamlit screening engine performing SDE normalisation, valuation multiple analysis, working capital modelling, and SBA 7(a) capital structure and debt service modelling, applying one consistent standard to every target.',
    changed:
      'Turns ad hoc deal review into a repeatable diligence process, supporting an active pipeline against a defined thesis: $350K–$550K SDE, $1.2M–$2M+ revenue, in logistics, trucking, manufacturing, and services.',
    stack: ['Python', 'Streamlit', 'pandas', 'Financial modeling'],
    // TODO: confirm hosting. Not present on the Vercel team account.
  },
  {
    slug: 'acquisition-deal-pipeline',
    title: 'Acquisition Deal Pipeline & Target Database',
    org: 'BeaconPath Holdings',
    tier: 2,
    group: 'Financial & Acquisition Analysis',
    status: 'Live',
    role: 'Designed and operating',
    aliases: ['ETA OS', 'AI Deal Intelligence Engine'],
    problem:
      'Acquisition deal flow arrives from brokers, marketplace listings, and direct outreach at once, every target at a different diligence stage with its own financials and seller conversations. A spreadsheet collapses around thirty targets.',
    built:
      'A structured relational pipeline across Notion and Airtable — target records carrying revenue, SDE, asking price, implied multiple, industry, source, diligence stage, seller contact history, and next action, with filtered views by stage and by fit against a defined acquisition thesis. Feeds the Streamlit analyzer for financial screening.',
    changed:
      'Turned scattered deal flow into a managed pipeline with a repeatable screening standard, so no target stalls silently.',
    stack: ['Notion', 'Airtable', 'Relational database design', 'Python', 'Streamlit'],
  },
  {
    slug: 'stellar-advisor',
    title: 'Stellar Advisor Platform',
    org: 'Independent',
    tier: 2,
    group: 'AI Products & Pipelines',
    status: 'Built',
    role: 'Designed and built solo',
    problem:
      'Amazon sellers looking for agency help have no reliable way to find one that fits, and good agencies waste enormous effort on leads that were never a match. Both sides are searching blind.',
    built:
      'A two-sided lead generation and matching platform connecting Amazon sellers with vetted agency partners — seller intake capturing category, revenue band, and service need, matched against agency profiles and specialisations. Built as a working prototype and deployed to preview.',
    changed:
      'Takes the matching problem I spent years solving manually inside agencies and makes it a product surface.',
    stack: ['HTML', 'JavaScript', 'Vercel'],
    repo: 'https://github.com/rydak81/Stellar-Advisor-Platform',
    note: 'Prototype. Deployed to preview, not production.',
  },
  {
    slug: 'leadprompter',
    title: 'LeadPrompter',
    org: 'Independent',
    tier: 2,
    group: 'Revenue Systems & Forecasting',
    status: 'Built',
    role: 'Designed and built solo',
    problem:
      'LinkedIn Sales Navigator rewards precise Boolean queries and almost nobody writes them well, so reps default to broad searches and work bad lists.',
    built:
      'A tool that generates Boolean search strings for Sales Navigator from a described target profile, so prospecting starts from a tight list instead of a broad one.',
    changed:
      'Moves list quality upstream — the cheapest possible place to fix a pipeline.',
    stack: ['JavaScript', 'Boolean query generation'],
    repo: 'https://github.com/rydak81/leadprompter-salesnavsearch',
  },
  {
    slug: 'carrier-spend-analysis',
    title: 'Carrier & Logistics Spend Analysis',
    org: 'Threecolts',
    tier: 2,
    group: 'Financial & Acquisition Analysis',
    status: 'Analysis',
    role: 'Analysis and modeling',
    problem:
      'A high-volume shipper suspected carrier overspend but had no way to size it from raw invoice data.',
    built:
      'Line-level analysis of ninety days of UPS invoices, isolating late-delivery penalties, accessorial patterns, and service-level mix against roughly $263K of quarterly carrier spend.',
    changed:
      'Identified approximately $70K of annualised late-fee exposure as a specific, recoverable figure rather than a suspicion.',
    stack: ['Python', 'pandas', 'Excel', 'Invoice analysis'],
    metrics: [
      { label: '90-day carrier spend analysed', value: '~$263K' },
      { label: 'Annualised late-fee exposure identified', value: '~$70K' },
    ],
  },

  // ─────────────────────────────────────────────────────────────
  // TIER 3 — Line items
  // ─────────────────────────────────────────────────────────────
  {
    slug: '1p-market-strategy',
    title: '1P Market Strategy Report',
    org: 'Threecolts',
    tier: 3,
    group: 'Strategy & Enablement',
    status: 'Analysis',
    role: 'Research and analysis',
    problem: 'The target segment was set by convention rather than analysis, leaving a material adjacent market unaddressed.',
    built: 'An AI-accelerated market analysis identifying enterprise Vendor Central (1P) agencies as an underpenetrated segment, with the positioning and go-to-market case to pursue them.',
    changed: 'Findings repositioned the ICP and redirected outbound targeting and messaging.',
    stack: ['Claude', 'Market research synthesis', 'Competitive analysis'],
  },
  {
    slug: 'partner-enablement-system',
    title: 'Partner Enablement System',
    org: 'Threecolts',
    tier: 3,
    group: 'Strategy & Enablement',
    status: 'Live',
    role: 'Built and deployed',
    problem: 'A new channel program with no enablement assets, no outreach standard, and no onboarding path — every partner conversation starting from a blank page.',
    built: 'The CedCommerce partner enablement deck, a master multi-channel outreach playbook covering email, LinkedIn, text, and phone, segment-specific Dripify sequences, and programmatically generated PPTX decks for internal all-hands.',
    changed: 'Gave a net-new channel program a repeatable enablement and outreach standard from day one.',
    stack: ['Claude', 'Python', 'python-pptx', 'Dripify'],
  },
  {
    slug: 'ai-all-hands-case-study',
    title: 'Company AI All-Hands Case Study',
    org: 'Threecolts',
    tier: 3,
    group: 'Strategy & Enablement',
    status: 'Analysis',
    role: 'Selected to present',
    problem: 'Organisational AI adoption stalls when it stays abstract. People need to see a real system built by a colleague, not a vendor demo.',
    built: 'Presented Marketplace Beta as the company case study at the AI all-hands — walking through the multi-model pipeline architecture, the model-tier selection logic, and how the same approach transfers to internal work.',
    changed: 'Turned an individual build into an organisational reference point for what applied AI looks like inside a commercial function.',
    stack: ['Internal enablement', 'Technical communication'],
  },

  // ─────────────────────────────────────────────────────────────
  // TODO — live on Vercel, needs identification before publishing
  // v0-partnership-intelligence-hub  (LIVE, most recently updated)
  // v0-opportunity-estimator-app
  // v0-3trecovery-wizard
  // v0-partner-landing-page
  // vehicle-fishstick
  // agentmail-template-starkhq
  // ─────────────────────────────────────────────────────────────
];

export const tier1 = projects.filter((p) => p.tier === 1);
export const tier2 = projects.filter((p) => p.tier === 2);
export const tier3 = projects.filter((p) => p.tier === 3);

export const groups: Group[] = [
  'Revenue Systems & Forecasting',
  'AI Products & Pipelines',
  'Financial & Acquisition Analysis',
  'Strategy & Enablement',
];

export const byGroup = (g: Group) => projects.filter((p) => p.group === g);
export const bySlug = (slug: string) => projects.find((p) => p.slug === slug);

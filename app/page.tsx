import Link from 'next/link';
import CareerTrace, { type TraceChapter } from '@/components/CareerTrace';
import CorrelationExplorer from '@/components/CorrelationExplorer';
import DeferredMount from '@/components/DeferredMount';
import HeroMosaic from '@/components/HeroMosaic';
import OperatingLoop from '@/components/OperatingLoop';
import ProfileCard from '@/components/ProfileCard';
import RoleLens, { type LensProject } from '@/components/RoleLens';
import SalesMotion from '@/components/SalesMotion';
import { published, tier1, tier2, tier3, groups, byGroup, type Project } from '@/lib/projects';
import { accentFor } from '@/lib/accents';
import {
  careerResults,
  chapters,
  evidenceFor,
  lookingFor,
  mission,
  profile,
  recordStrip,
  stats,
} from '@/lib/career';

/** The compact slice of lib/projects.ts the Role Lens renders from. */
const LENS_DATA: LensProject[] = published.map((p) => ({
  slug: p.slug,
  title: p.title,
  org: p.org,
  status: p.status,
  problem: p.problem,
  stack: p.stack,
}));

/* Same derivation as /about — the trace reads its dots out of
   lib/projects.ts, so both pages draw the identical chart. */
const TRACE: TraceChapter[] = chapters.map((c) => ({
  id: c.id,
  label: c.label,
  title: c.title,
  org: c.org,
  period: c.period,
  mandate: c.mandate,
  build: c.build,
  lesson: c.lesson,
  projects: evidenceFor(c).map((p) => ({
    slug: p.slug,
    title: p.title,
    status: p.status,
  })),
}));

const EMAIL = profile.email;
const LINKEDIN = profile.linkedin;
const GITHUB = profile.github;

export default function Home() {
  return (
    /*
      Full-bleed. The width constraint moved down into each section's
      .shell so background graphics (hero glow, grid, panel washes) can
      reach the viewport edges instead of stopping at a centred column.

      Section order is the pitch order, and it inverted with the
      repositioning. It used to run commercial-first — the record, then the
      sales motion, then the career, and only then the models — on the
      reasoning that a business development hiring manager needs to know I
      carry a number before they care that I can derive a copula.

      That is still true of a business development hiring manager, and it
      is exactly backwards for everyone else reading this. So the loop now
      leads: what the work is, then the shelf it produced, then the live
      models, then the career that paid for all of it. The sales motion
      survives further down as one chapter of that career rather than as
      the frame the whole site hangs on.
    */
    <main className="overflow-x-clip">
      <Hero />
      <Record />
      <HeroMosaic />
      <Loop />
      <Proof />
      <RoleLens data={LENS_DATA}>
        <SelectedWork />
        <EverythingElse />
      </RoleLens>
      <div className="band py-24 md:py-32">
        <Method />
        <Stack />
      </div>
      <Career />
      <Motion />
      <ThroughLine />
      <Looking />
      <Contact />
      <Footer />
    </main>
  );
}

/* ─────────────────────────── hero ─────────────────────────── */

function Hero() {
  return (
    /*
      The hero is the one full-bleed dark surface on the page, and every
      other dark surface on the site — the nav above it, the closing band
      at the foot — is the same mesh. `on-dark` redefines the colour tokens
      for this subtree rather than restyling each element, so `text-fg-2`
      still means "the quieter body colour" here; it just resolves to white
      at 76% instead of navy.
    */
    <header className="on-dark bg-mesh relative overflow-hidden pt-16 pb-16 md:pt-24 md:pb-24">
      {/* A faint plotting grid over the mesh: the surface reads as a space
          you could put a chart on, which is what the work is. */}
      <div
        aria-hidden
        className="hero-grid pointer-events-none absolute inset-0"
      />
      {/*
        Two columns from lg up: the pitch on the left, the identity card on
        the right. Below lg it stacks under the copy rather than competing
        with the headline for the first screen.
      */}
      <div className="shell relative grid items-start gap-12 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-16">
        <div>
          <p className="rise glass-dark inline-flex w-fit items-center gap-2.5 rounded-full px-4 py-1.5 text-sm font-medium text-white/85">
            <span aria-hidden className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full rounded-full bg-[oklch(0.72_0.17_50)] opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[oklch(0.72_0.17_50)]" />
            </span>
            Greenville, SC · Revenue operations, analytics &amp; systems
          </p>
          {/*
            Fluid display size via clamp() rather than a single md: jump —
            at 800 weight a fixed size crowds the shell padding at
            mid-range widths. text-balance handles the line breaks.
          */}
          <h1 className="rise rise-1 mt-7 max-w-[20ch] text-balance text-[clamp(2.5rem,6.6vw,4.75rem)] leading-[1.04] text-white">
            I build the systems that{' '}
            <span className="text-gradient-brand">find the revenue.</span>
          </h1>
          <p className="rise rise-2 mt-8 max-w-2xl text-pretty text-lg leading-relaxed text-white/75">
            {/* One job: say what the work is, and say why the commercial
                record is the reason to trust it rather than a separate
                career that happens to sit on the same résumé. */}
            Ingestion and data pipelines, performance dashboards, forecast
            and simulation engines, and the tooling that acts on what they
            surface — built against a live operation, most of it while I was
            carrying the number it served. Twenty years in B2B revenue is
            why the models are built around the operator’s economics rather
            than a textbook’s.
          </p>
          <div className="rise rise-3 mt-10 flex flex-wrap items-center gap-x-3 gap-y-3">
            <a
              href="#loop"
              className="glow-brand rounded-chip bg-signal-cta px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            >
              See how the loop runs
            </a>
            <a
              href={`mailto:${EMAIL}`}
              className="glass-dark rounded-chip px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/15"
            >
              Get in touch
            </a>
            <Link
              href="/about"
              className="label rounded-chip px-3 py-3 text-sm text-white/65 underline decoration-white/30 underline-offset-4 transition-colors hover:text-white/90"
            >
              Full profile &amp; résumé
            </Link>
          </div>
          <p className="rise rise-3 mt-7 max-w-xl text-sm leading-relaxed text-white/60">
            Every model on this site runs live in your browser rather than
            being pictured. The claims that no project can evidence are
            marked as claims.
          </p>
        </div>

        <div className="rise rise-2 w-full max-w-sm lg:max-w-none">
          <ProfileCard />
        </div>
      </div>
    </header>
  );
}

/* ─────────────────────────── the record ─────────────────────────── */

/**
 * The headline numbers, immediately under the hero — the moment a hiring
 * manager decides whether to keep scrolling. Commercial figures come from
 * `careerResults` and carry the role that produced them; the systems count
 * is derived from lib/projects.ts so it cannot be inflated by hand.
 */
function Record() {
  return (
    /*
      Pulled up so the slab straddles the edge of the mesh hero. A white
      card overlapping a dark band is the strongest "this is an instrument"
      cue the page has, and it costs one negative margin — the hero's own
      bottom padding leaves the clearance for it.
    */
    <section
      id="record"
      className="shell relative z-10 -mt-10 pb-20 md:-mt-14 md:pb-28"
    >
      <dl className="grid-lines stagger grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
        {recordStrip().map((r, i) => (
          <div key={r.label} className="cell p-5">
            {/*
              On paper the default state of a number is navy ink, not
              colour — the same restraint the analytics app shows, where a
              stat tile takes a tone only when the tone means something.
              The first cell is the exception and earns it under the
              palette rule: a count of systems deployed and reachable is
              the most literally verified figure on the page.

              A word-length value ("Millions") overflows a two-up cell at
              375px where "80%+" does not, so long values step down one
              size rather than wrapping mid-word.
            */}
            <dd
              className={`num font-semibold ${i === 0 ? 'text-signal' : 'text-fg'} ${
                r.value.length > 5 ? 'text-2xl' : 'text-3xl'
              }`}
            >
              {r.value}
            </dd>
            <dt className="mt-2 text-xs font-medium leading-snug text-fg-2">
              {r.label}
            </dt>
            {/* Provenance. Hidden on a phone, where six cells with three
                lines each push the whole first screen off. */}
            <p className="mt-2 hidden text-[11px] leading-snug text-fg-3 md:block">
              {r.note}
            </p>
          </div>
        ))}
      </dl>
    </section>
  );
}

/* ─────────────────────────── the loop ─────────────────────────── */

function Loop() {
  return (
    /* Banded: this is the argument the page is built around, and giving it
       its own ground is what stops the scroll from reading as one long
       column of identical sections. */
    <div className="band py-24 md:py-32">
      <section id="loop" className="shell fade-in">
        <SectionHead
          eyebrow="How I work"
          title="Instrument it, find what is underperforming, prove why, then ship the fix"
          lede="Every tool on this site came out of a specific point in a real operation where something was unmeasured, slow, or wrong. This is the loop they sit in — the job at each stage first, what most teams do instead second, and the systems underneath it third."
        />
        <div className="mt-9">
          <OperatingLoop />
        </div>
      </section>
    </div>
  );
}

/* ──────────────────── the commercial motion ──────────────────── */

/**
 * The sales motion, kept but demoted.
 *
 * This used to be the spine of the page, directly under the record. It now
 * sits below the career trace as one chapter of that career: the same six
 * stages, the same systems hung off them, introduced as the commercial
 * half of the loop above rather than as the frame the whole site hangs on.
 * Nothing was deleted — a hiring manager for a business development or
 * partnerships role still gets the section they came for, further down the
 * page than they used to.
 */
function Motion() {
  return (
    <section id="motion" className="shell fade-in pb-24 md:pb-32">
      <SectionHead
        eyebrow="The commercial half"
        title="And the revenue motion the loop was built inside"
        lede="The loop above is not abstract — it ran inside a quota. This is the commercial motion it served, stage by stage, with the same systems mapped against it. It is also the part of the record that transfers directly to a business development, partnerships, or sales leadership role."
      />
      <div className="mt-9">
        <SalesMotion />
      </div>
    </section>
  );
}

/* ─────────────────────────── the career ─────────────────────────── */

function Career() {
  return (
    <section id="career" className="shell fade-in pb-24 md:pb-32">
      <SectionHead
        eyebrow="The record — live, from the work data"
        title="Two tracks, twenty years, one of them starting empty"
        lede="The top line is the commercial job and it never breaks — every chapter carried a number. The bottom line is one dot per system on the shelf, read out of the same file that renders the work below. Pick a chapter."
      />
      <div className="stage mt-9">
        <div className="stage-frame">
          <DeferredMount minHeight={760}>
            <CareerTrace chapters={TRACE} />
          </DeferredMount>
        </div>
      </div>
      <p className="mt-6 text-sm text-fg-3">
        The full profile, capability ledger, and printable résumé live on the{' '}
        <Link
          href="/about"
          className="text-model underline decoration-model-dim underline-offset-4 transition-colors hover:decoration-model"
        >
          about page
        </Link>
        .
      </p>
    </section>
  );
}

/* ───────────────────── the signature element ───────────────────── */

function Proof() {
  return (
    <section className="shell fade-in pb-24 md:pb-32">
      <SectionHead
        eyebrow="One of them, running right here"
        title="The forecast I built because mine was lying to me about risk"
        lede="Standard pipeline forecasting treats every deal as independent. They aren't — quarter-end pressure, budget cycles, and shared activation capacity make them move together, which is why a confident-looking number understates real risk in both directions. This is the model from my own forecast engine, running in your browser. Drag the correlation."
      />
      <div className="stage mt-9">
        <div className="stage-frame">
          <DeferredMount minHeight={620}>
            <CorrelationExplorer />
          </DeferredMount>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────── method ─────────────────────────── */

const STEPS: [string, string][] = [
  [
    'Find the friction',
    'Sitting inside the revenue motion, not adjacent to it. I feel the problem before anyone files a ticket about it.',
  ],
  [
    'Structure the solution',
    'Define the job to be done, the data required, and where AI does the work versus where a human decides.',
  ],
  [
    'Build it',
    'Next.js, React, Supabase, Python. Multi-model pipelines with model tier matched to task and cost.',
  ],
  [
    'Ship and iterate',
    'In front of real users on a cadence — then improve it based on what actually gets used, or shut it down.',
  ],
];

function Method() {
  return (
    <section id="method" className="shell fade-in pb-16 md:pb-20">
      {/* Secondary by design. "How I work" above is the loop; this is how
          an individual system inside it actually gets built, which matters
          to a technical interviewer and to nobody else on the first pass. */}
      <SectionHead
        eyebrow="Build method"
        title="And how each one actually got built"
      />
      <ol className="grid-lines mt-9 grid md:grid-cols-4">
        {STEPS.map(([title, body], i) => (
          <li key={title} className="cell p-5">
            <span className="num text-xs font-semibold text-model">
              {String(i + 1).padStart(2, '0')}
            </span>
            {/* No font-medium here — a utility class outranks the element-level
                h3 weight rule and would silently pin this back to 500. */}
            <h3 className="mt-3 text-base">{title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-fg-2">
              {body}
            </p>
          </li>
        ))}
      </ol>
    </section>
  );
}

/* ────────────────────────── selected work ────────────────────────── */

function SelectedWork() {
  return (
    <section className="shell fade-in pb-24 md:pb-32">
      <SectionHead
        eyebrow="Selected work"
        title="The five that changed how the number got hit"
        lede="Status labels mean what they say. Live is deployed and reachable. Built runs but isn't hosted. Nothing here is inflated to the next tier up — including the case study where the finding was that my own first estimate was 2.5× too high."
      />
      <div className="mt-9 flex flex-col gap-4">
        {tier1.map((p) => (
          <FeatureCard key={p.slug} p={p} />
        ))}
      </div>
    </section>
  );
}

function FeatureCard({ p }: { p: Project }) {
  /*
    Accent is present only for projects whose running UI I could actually
    sample (see lib/accents.ts). Everything else renders in the house
    palette — the absence is deliberate, not an oversight.
  */
  const accent = accentFor(p.slug);

  return (
    <article
      className={`panel card-lift relative overflow-hidden p-6 md:p-9 ${
        accent ? 'card-accent' : ''
      }`}
      style={
        accent
          ? ({
              '--accent': accent.tint,
              '--accent-raw': accent.raw,
            } as React.CSSProperties)
          : undefined
      }
    >
      <div className="relative flex flex-wrap items-center gap-3">
        <StatusBadge status={p.status} />
        <span className="eyebrow">{p.org}</span>
      </div>
      <h3
        className="relative mt-4 text-balance text-2xl tracking-[-0.02em] md:text-3xl"
      >
        <Link
          href={`/projects/${p.slug}`}
          className="transition-colors hover:text-signal"
        >
          {p.title}
        </Link>
      </h3>
      <p className="relative mt-4 max-w-3xl text-pretty leading-relaxed text-fg-2">
        {p.problem}
      </p>

      {p.metrics && (
        <dl
          className={`grid-lines relative mt-6 grid ${metricCols(
            p.metrics.length
          )}`}
        >
          {p.metrics.map((m) => (
            <div key={m.label} className="cell px-4 py-3.5">
              <dd className="num text-xl text-signal md:text-2xl">{m.value}</dd>
              <dt className="mt-1 text-[11px] leading-snug text-fg-3">
                {m.label}
              </dt>
            </div>
          ))}
        </dl>
      )}

      <div className="relative mt-6 flex flex-wrap gap-1.5">
        {p.stack.map((s) => (
          <Tag key={s}>{s}</Tag>
        ))}
      </div>

      <div className="relative mt-6 flex flex-wrap items-center gap-x-5 gap-y-3 text-sm">
        <Link
          href={`/projects/${p.slug}`}
          className="rounded-card border border-line-bright px-4 py-2 transition-colors hover:border-signal hover:text-signal"
        >
          Read the case study
        </Link>
        {p.url && (
          <a
            href={p.url}
            className="num accent-link text-model underline decoration-model-dim underline-offset-4 transition-colors hover:decoration-model"
          >
            {p.url.replace('https://', '')} &#8599;
          </a>
        )}
        {p.repo && (
          <a
            href={p.repo}
            className="num text-model underline decoration-model-dim underline-offset-4 transition-colors hover:decoration-model"
          >
            source &#8599;
          </a>
        )}
      </div>

      {p.note && (
        <p className="relative mt-4 text-sm leading-relaxed text-fg-3">
          {p.note}
        </p>
      )}
    </article>
  );
}

/* ───────────────────────── everything else ───────────────────────── */

function EverythingElse() {
  return (
    <section className="shell fade-in pb-24 md:pb-32">
      <SectionHead eyebrow="Everything else" title="The rest of the shelf" />
      <div className="mt-9 space-y-12">
        {groups.map((g) => {
          const items = byGroup(g).filter((p) => p.tier === 2);
          if (!items.length) return null;
          return (
            <div key={g}>
              <h3 className="eyebrow mb-3">
                {g}
              </h3>
              <div className="grid-lines grid md:grid-cols-2">
                {items.map((p) => {
                  const accent = accentFor(p.slug);
                  return (
                  <article
                    key={p.slug}
                    className={`cell relative overflow-hidden p-5 ${
                      accent ? 'card-accent' : ''
                    }`}
                    style={
                      accent
                        ? ({
                            '--accent': accent.tint,
                            '--accent-raw': accent.raw,
                          } as React.CSSProperties)
                        : undefined
                    }
                  >
                    <div className="relative flex flex-wrap items-center gap-2.5">
                      <StatusBadge status={p.status} small />
                      <span className="eyebrow">{p.org}</span>
                    </div>
                    <h4 className="relative mt-3 text-lg">
                      <Link
                        href={`/projects/${p.slug}`}
                        className="transition-colors hover:text-signal"
                      >
                        {p.title}
                      </Link>
                    </h4>
                    <p className="relative mt-2 text-sm leading-relaxed text-fg-2">
                      {p.problem}
                    </p>
                    <div className="relative mt-4 flex flex-wrap gap-1.5">
                      {p.stack.slice(0, 5).map((s) => (
                        <Tag key={s}>{s}</Tag>
                      ))}
                    </div>
                  </article>
                  );
                })}
              </div>
            </div>
          );
        })}

        <div>
          <h3 className="eyebrow mb-3">
            Strategy &amp; enablement
          </h3>
          <ul className="grid-lines grid">
            {tier3.map((p) => (
              <li
                key={p.slug}
                className="cell flex flex-wrap items-baseline gap-x-4 gap-y-1 px-5 py-4"
              >
                <span className="font-bold tracking-[-0.015em]">{p.title}</span>
                <span className="text-sm text-fg-3">{p.org}</span>
                <span className="flex-1 basis-full text-sm text-fg-2 md:basis-auto">
                  {p.changed}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────── stack ─────────────────────────── */

const STACK: [string, string[]][] = [
  [
    'Quantitative',
    ['Monte Carlo simulation', 'Gaussian copula modeling', 'Bayesian updating (conjugate priors)', 'OLS regression', 'Bayesian shrinkage', 'Sensitivity analysis', 'Kalman filtering (graduate coursework)'],
  ],
  [
    'AI',
    ['Claude Sonnet', 'Claude Haiku', 'DALL·E 3', 'Multi-model orchestration', 'Model-tier selection by task and cost', 'Prompt engineering and evaluation'],
  ],
  ['Frontend', ['Next.js', 'React', 'TypeScript', 'Tailwind CSS', 'shadcn/ui', 'Recharts']],
  ['Backend &amp; data', ['Supabase / PostgreSQL', 'Python', 'pandas', 'NumPy', 'SciPy', 'Streamlit', 'REST APIs', 'Scheduled cron', 'openpyxl', 'python-pptx']],
  ['Infrastructure', ['Vercel', 'Vercel AI Gateway', 'GitHub', 'Resend', 'Slack API']],
  [
    'Revenue stack',
    ['Monday.com (architected at two companies)', 'Salesforce', 'Apollo', 'Sales Navigator', 'Dripify', 'Notion', 'Airtable', 'ERP integration'],
  ],
  [
    'Domain',
    ['Amazon 1P / 3P / FBA', 'Vendor Central', 'Walmart Marketplace', 'TikTok Shop', 'Marketplace recovery', 'Carrier spend', 'Agency operations', 'Channel partnerships'],
  ],
];

function Stack() {
  return (
    <section id="stack" className="shell fade-in">
      <SectionHead eyebrow="Stack" title="What I actually work in" />
      <dl className="panel mt-9 divide-y divide-line">
        {STACK.map(([label, items]) => (
          <div
            key={label}
            className="grid gap-3 p-5 md:grid-cols-[180px_1fr] md:gap-8"
          >
            <dt className="eyebrow pt-1">{label.replace('&amp;', '&')}</dt>
            <dd className="flex flex-wrap gap-1.5">
              {items.map((i) => (
                <Tag key={i}>{i}</Tag>
              ))}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

/* ───────────────────────── through line ───────────────────────── */

function ThroughLine() {
  return (
    /* The panel is the visual object here, so the shell wraps it rather
       than being applied to it — otherwise the shell's padding would sit
       inside the card's own border. */
    <div className="shell">
      <section className="fade-in panel relative overflow-hidden px-6 py-16 md:px-12 md:py-20">
      {/* Copy comes from lib/career.ts so the home page and /about make the
          same argument in the same words — one file to change, not two. */}
      <div className="relative">
        <p className="eyebrow">{mission.eyebrow}</p>
        <p className="mt-7 max-w-4xl text-pretty text-2xl leading-relaxed md:text-3xl">
          {mission.title}
        </p>
        {/* Two-up rather than three-up: four columns at this measure
            crushed the lines, and the 2×2 keeps the second paragraph on
            the first row where it gets read. That one carries the accent
            rail — it is the three specific times the honest answer cost
            something, which is the only real evidence that the honesty
            here is not decorative. */}
        <div className="mt-8 grid max-w-5xl gap-6 md:grid-cols-2">
          {mission.body.map((para, i) => (
            <p
              key={para.slice(0, 32)}
              className={
                i === 1
                  ? 'text-pretty border-l-2 border-signal-dim pl-4 text-sm leading-relaxed text-fg'
                  : 'text-pretty text-sm leading-relaxed text-fg-2'
              }
            >
              {para}
            </p>
          ))}
        </div>
        <div className="mt-9 flex flex-wrap items-center gap-x-3 gap-y-3">
          <Link
            href="/about"
            className="cell rounded-chip border border-line-bright px-5 py-2.5 text-sm font-semibold text-fg transition-colors hover:border-model hover:text-model"
          >
            Full profile &amp; résumé
          </Link>
          <span className="text-sm text-fg-3">
            the whole record, a capability ledger, and a version that prints
          </span>
        </div>
      </div>
      </section>
    </div>
  );
}

/* ────────────────────── what I'm looking for ────────────────────── */

function Looking() {
  return (
    <section id="looking" className="shell fade-in pt-24 md:pt-32">
      <SectionHead
        eyebrow="What I'm looking for"
        title="Specific enough to disqualify a bad fit"
        lede="Being vague here wastes both of our time. If three of these four columns are wrong for your role, it is probably not the role."
      />
      <div className="grid-lines mt-9 grid sm:grid-cols-2 lg:grid-cols-4">
        {lookingFor.map((col) => (
          <div key={col.label} className="cell p-5">
            <h3 className="eyebrow">{col.label}</h3>
            <ul className="mt-3 space-y-2">
              {col.lines.map((line) => (
                <li
                  key={line}
                  className="border-l border-line-bright pl-3 text-sm leading-relaxed text-fg-2"
                >
                  {line}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ─────────────────────────── contact ─────────────────────────── */

/**
 * The close. A page built to generate inbound should end by asking for the
 * meeting, not by trailing off into three plain links — so this is a real
 * panel with the availability status on it, one primary action, and the
 * alternatives underneath.
 */
function Contact() {
  return (
    /*
      The closing band, on the same mesh as the hero. The page opens and
      shuts on brand colour and everything between them is the work — the
      analytics app's structure, and the reason a visitor who scrolls the
      whole thing never loses the thread back to the top.
    */
    <div className="band-dark on-dark bg-mesh relative overflow-hidden py-24 md:py-32">
      <div
        aria-hidden
        className="hero-grid pointer-events-none absolute inset-0"
      />
      <section className="shell relative text-center">
        <div className="mx-auto max-w-3xl">
          <span className="glass-dark label inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-[11px] text-white/85">
            <span
              aria-hidden
              className="inline-block h-1.5 w-1.5 rounded-full bg-[oklch(0.72_0.17_50)]"
            />
            {profile.availability.line}
          </span>

          <h2 className="mt-7 text-balance text-4xl tracking-[-0.03em] text-white md:text-5xl">
            Show me the data and the decision hanging on it.
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-pretty leading-relaxed text-white/75">
            {/* Titles in the order the site now argues them, and the domain
                line kept — twenty years of marketplace knowledge is the
                thing that is genuinely hard to hire for. */}
            Revenue operations, performance and data analysis, or a
            commercial role with real ownership of the systems behind it —
            particularly at companies building for commerce, retail, or
            logistics, where the domain knowledge is worth something on day
            one.
          </p>

          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <a
              href={`mailto:${EMAIL}`}
              className="glow-brand rounded-chip bg-signal-cta px-7 py-3.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            >
              Email me
            </a>
            <a
              href={LINKEDIN}
              className="glass-dark rounded-chip px-7 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-white/15"
            >
              Connect on LinkedIn
            </a>
          </div>

          <p className="mt-8 text-sm text-white/65">
            Or paste a job description into the{' '}
            <a
              href="#work"
              className="text-white underline decoration-white/40 underline-offset-4 transition-colors hover:decoration-white"
            >
              Role Lens
            </a>{' '}
            above and it will reorder the whole shelf against that role before
            we ever speak.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-7 gap-y-2 text-sm">
            <a
              href={`mailto:${EMAIL}`}
              className="num text-white/60 underline decoration-white/25 underline-offset-4 transition-colors hover:text-white/85"
            >
              {EMAIL}
            </a>
            <a
              href={GITHUB}
              className="num text-white/60 underline decoration-white/25 underline-offset-4 transition-colors hover:text-white/85"
            >
              {GITHUB.replace('https://', '')}
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}

function Footer() {
  return (
    /* Border sits on the full-bleed element so the rule spans the whole
       viewport; the text stays inside the shell. */
    <footer className="border-t border-line">
      <div className="shell py-8 text-xs leading-relaxed text-fg-3">
        Ryan Dacus · Greenville, SC · Built with Next.js on Vercel · Every
        status label on this page means exactly what it says.
      </div>
    </footer>
  );
}

/* ─────────────────────────── shared ─────────────────────────── */

function SectionHead({
  eyebrow,
  title,
  lede,
}: {
  eyebrow: string;
  title: string;
  lede?: string;
}) {
  return (
    <div>
      <div className="rule mb-8" />
      <p className="eyebrow">{eyebrow}</p>
      <h2
        className="mt-4 max-w-3xl text-balance text-3xl tracking-[-0.025em] md:text-4xl"
      >
        {title}
      </h2>
      {lede && (
        <p className="mt-5 max-w-2xl text-pretty leading-relaxed text-fg-2">
          {lede}
        </p>
      )}
    </div>
  );
}

/**
 * Metric strips are hairline grids, so an unfilled cell reads as a dead
 * panel. Only ever open as many columns as there are metrics.
 */
function metricCols(n: number) {
  if (n <= 1) return '';
  if (n === 2) return 'sm:grid-cols-2';
  if (n === 3) return 'sm:grid-cols-2 lg:grid-cols-3';
  return 'sm:grid-cols-2 lg:grid-cols-4';
}

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="label rounded-chip border border-line bg-surface-2 px-2 py-1 text-[11px] text-fg-2">
      {children}
    </span>
  );
}

function StatusBadge({
  status,
  small,
}: {
  status: Project['status'];
  small?: boolean;
}) {
  const live = status === 'Live';
  return (
    <span
      className="label inline-flex items-center gap-1.5 rounded-chip border px-2 py-0.5 text-[10px] uppercase tracking-wider"
      style={{
        color: live ? 'var(--color-signal)' : 'var(--color-fg-2)',
        borderColor: live ? 'var(--color-signal-dim)' : 'var(--color-line-bright)',
        background: live
          ? 'color-mix(in srgb, var(--color-signal) 10%, transparent)'
          : 'var(--color-surface-2)',
        fontSize: small ? '9px' : undefined,
      }}
    >
      {live && (
        <span
          className="inline-block h-1.5 w-1.5 rounded-full"
          style={{ background: 'var(--color-signal)' }}
        />
      )}
      {status}
    </span>
  );
}

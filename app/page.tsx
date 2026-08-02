import Link from 'next/link';
import CorrelationExplorer from '@/components/CorrelationExplorer';
import DeferredMount from '@/components/DeferredMount';
import HeroMosaic from '@/components/HeroMosaic';
import RoleLens, { type LensProject } from '@/components/RoleLens';
import { published, tier1, tier2, tier3, groups, byGroup, type Project } from '@/lib/projects';
import { accentFor } from '@/lib/accents';

/** The compact slice of lib/projects.ts the Role Lens renders from. */
const LENS_DATA: LensProject[] = published.map((p) => ({
  slug: p.slug,
  title: p.title,
  org: p.org,
  status: p.status,
  problem: p.problem,
  stack: p.stack,
}));

const EMAIL = 'ryandacus@gmail.com';
const LINKEDIN = 'https://linkedin.com/in/ryandacus-sbc';
const GITHUB = 'https://github.com/rydak81';

export default function Home() {
  return (
    /*
      Full-bleed. The width constraint moved down into each section's
      .shell so background graphics (hero glow, grid, panel washes) can
      reach the viewport edges instead of stopping at a centred column.
    */
    <main className="overflow-x-clip">
      <Hero />
      <HeroMosaic />
      <Proof />
      <Method />
      <RoleLens data={LENS_DATA}>
        <SelectedWork />
        <EverythingElse />
      </RoleLens>
      <Stack />
      <ThroughLine />
      <Contact />
      <Footer />
    </main>
  );
}

/* ─────────────────────────── hero ─────────────────────────── */

function Hero() {
  return (
    <header className="relative overflow-x-clip pt-20 pb-16 md:pt-32 md:pb-24">
      {/* Both layers are inset-0 on a full-bleed header, so they now span
          the entire viewport width rather than a centred column. */}
      <div
        aria-hidden
        className="hero-glow pointer-events-none absolute inset-x-0 -top-24 bottom-0"
      />
      <div
        aria-hidden
        className="hero-grid pointer-events-none absolute inset-x-0 -top-10 bottom-0"
      />
      <div className="shell relative">
        <p className="rise eyebrow">Greenville, SC · Partnerships &amp; revenue systems</p>
        {/*
          Fluid display size via clamp() rather than a single md: jump —
          at 900 weight a fixed 4.25rem crowded the shell padding at
          mid-range widths (~800px). text-balance handles the line breaks,
          so the old hard <br /> is gone; it was forcing a bad break once
          the type got heavier.
        */}
        <h1 className="rise rise-1 mt-7 max-w-[19ch] text-balance text-[clamp(2.5rem,7vw,5rem)] leading-[1.03]">
          I sell technology I actually know how to build.
        </h1>
        <p className="rise rise-2 mt-8 max-w-2xl text-pretty text-lg leading-relaxed text-fg-2">
          Twenty years in e-commerce revenue — Amazon seller, founding sales hire,
          partnerships lead. Somewhere in that run I stopped filing requests for
          the tools I needed and started building them. Everything below came out
          of a problem I hit inside my own work.
        </p>
        <div className="rise rise-3 mt-10 flex flex-wrap items-center gap-x-3 gap-y-3">
          <a
            href="#work"
            className="rounded-card bg-signal px-6 py-3 text-sm font-bold text-ink shadow-[0_8px_24px_-14px_rgba(255,191,92,0.5)] transition-opacity hover:opacity-90"
          >
            See the work
          </a>
          <a
            href={`mailto:${EMAIL}`}
            className="cell rounded-card border border-line-bright px-6 py-3 text-sm font-semibold text-fg transition-colors hover:border-fg-3"
          >
            Get in touch
          </a>
          <a
            href={GITHUB}
            className="num rounded-card px-3 py-3 text-sm text-fg-3 underline decoration-line-bright underline-offset-4 transition-colors hover:text-fg-2"
          >
            github.com/rydak81
          </a>
        </div>
      </div>
    </header>
  );
}

/* ───────────────────── the signature element ───────────────────── */

function Proof() {
  return (
    <section className="shell fade-in pb-24 md:pb-32">
      <SectionHead
        eyebrow="Live model — not a screenshot"
        title="Your pipeline forecast is lying to you about risk"
        lede="Standard forecasting treats every deal as independent. They aren't — quarter-end pressure, budget cycles, and shared activation capacity make them move together. This is the copula model from my forecasting engine, running in your browser."
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
    <section id="method" className="shell fade-in pb-24 md:pb-32">
      <SectionHead
        eyebrow="Method"
        title="How every one of these got built"
      />
      <ol className="grid-lines mt-9 grid md:grid-cols-4">
        {STEPS.map(([title, body], i) => (
          <li key={title} className="cell p-5">
            <span className="num text-xs text-signal">
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
        title="Five that carry the most weight"
        lede="Status labels mean what they say. Live is deployed and reachable. Built runs but isn't hosted. Nothing here is inflated to the next tier up."
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
      className={`panel relative overflow-hidden p-6 md:p-9 ${
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
    <section id="stack" className="shell fade-in pb-24 md:pb-32">
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
      <div
        aria-hidden
        className="hero-glow pointer-events-none absolute inset-0 opacity-70"
      />
      <div className="relative">
        <p className="eyebrow">The through line</p>
        <p
          className="mt-7 max-w-4xl text-pretty text-2xl leading-relaxed md:text-3xl"
        >
          None of these came from a roadmap, a ticket, or an assignment. Each one
          started the same way: I hit a problem inside my own revenue work and
          decided the cost of waiting was higher than the cost of building.
        </p>
        <p className="mt-6 max-w-3xl text-pretty leading-relaxed text-fg-2">
          That is the actual skill on offer — not React, and not any particular
          model. It&rsquo;s the judgment to recognise which problems are worth
          solving with software, the range to structure and ship the solution, and
          the commercial instinct to know when a spreadsheet was already the right
          answer. Twenty years carrying a number is what makes the first and third
          parts work. The building is what makes them count.
        </p>
      </div>
      </section>
    </div>
  );
}

/* ─────────────────────────── contact ─────────────────────────── */

function Contact() {
  return (
    <section className="shell fade-in py-24 md:py-32">
      <h2
        className="text-4xl tracking-[-0.03em] md:text-5xl"
      >
        Open to a conversation.
      </h2>
      <p className="mt-5 max-w-2xl text-pretty leading-relaxed text-fg-2">
        Partnerships and business development, go-to-market engineering,
        solutions consulting — particularly at companies building for commerce,
        retail, or logistics, where twenty years of domain knowledge is worth
        something on day one.
      </p>
      <div className="mt-8 flex flex-wrap gap-x-8 gap-y-3">
        <a
          href={`mailto:${EMAIL}`}
          className="num text-signal underline decoration-signal-dim underline-offset-4 transition-colors hover:decoration-signal"
        >
          {EMAIL}
        </a>
        <a
          href={LINKEDIN}
          className="num text-model underline decoration-model-dim underline-offset-4 transition-colors hover:decoration-model"
        >
          linkedin.com/in/ryandacus-sbc
        </a>
        <a
          href={GITHUB}
          className="num text-model underline decoration-model-dim underline-offset-4 transition-colors hover:decoration-model"
        >
          github.com/rydak81
        </a>
      </div>
    </section>
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

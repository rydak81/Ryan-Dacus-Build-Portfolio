import type { Metadata } from 'next';
import Link from 'next/link';
import CareerTrace, { type TraceChapter } from '@/components/CareerTrace';
import DeferredMount from '@/components/DeferredMount';
import PrintResume from '@/components/PrintResume';
import ProfileCard from '@/components/ProfileCard';
import {
  capabilities,
  careerResults,
  chapters,
  education,
  evidenceFor,
  lookingFor,
  mission,
  profile,
  resolveCapability,
  selectedResults,
  stats,
  type Proof,
} from '@/lib/career';

/** Public contact line. The phone is opt-in — see profile.publishPhone. */
const CONTACT_LINE = [
  profile.email,
  profile.publishPhone ? profile.phone : null,
  profile.linkedin.replace('https://', ''),
  profile.github.replace('https://', ''),
]
  .filter(Boolean)
  .join(' · ');

export const metadata: Metadata = {
  title: 'About Ryan Dacus — profile, career, and capability ledger',
  description:
    'Twenty years in e-commerce revenue and a portfolio of systems built rather than requested. The career trace, a capability ledger where every claim links to the project that proves it, and what I am looking for next.',
  alternates: { canonical: '/about' },
  openGraph: {
    title: 'Ryan Dacus — profile',
    description:
      'The career, the capability ledger, and what I am looking for next.',
    type: 'profile',
  },
};

/* The trace reads its dots straight out of lib/projects.ts via
   evidenceFor(), so the chart and the work shelf can never disagree. */
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

/**
 * Person schema. This is the page Google shows for a name search, and a
 * recruiter typing "Ryan Dacus" is the primary distribution channel after
 * LinkedIn. Every field here is already visible on the page — structured
 * data that asserts something the page does not say is a liability.
 */
const PERSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'Person',
  name: profile.name,
  description: profile.headline,
  email: `mailto:${profile.email}`,
  url: 'https://ryandacus.com/about',
  address: {
    '@type': 'PostalAddress',
    addressLocality: 'Greenville',
    addressRegion: 'SC',
    addressCountry: 'US',
  },
  sameAs: [profile.linkedin, profile.github],
  knowsAbout: capabilities.flatMap((g) =>
    g.items
      .filter((i) => resolveCapability(i).proof === 'shipped')
      .map((i) => i.name)
  ),
};

export default function AboutPage() {
  return (
    /* `doc` is the print hook: /about is the résumé, so the print rules in
       globals.css collapse this page's screen rhythm into document spacing
       rather than paginating eight-rem gaps. */
    <main className="doc overflow-x-clip">
      <script
        type="application/ld+json"
        // Serialised from a literal object above — no user input reaches this.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(PERSON_LD) }}
      />
      <ProfileHeader />
      <Mission />
      <Trace />
      <Ledger />
      <Results />
      <Looking />
      <ResumeSheet />
      <Contact />
    </main>
  );
}

/* ─────────────────────────── header ─────────────────────────── */

function ProfileHeader() {
  return (
    <header className="relative overflow-x-clip pt-16 pb-14 md:pt-24 md:pb-20">
      <div
        aria-hidden
        className="hero-glow pointer-events-none absolute inset-x-0 -top-24 bottom-0 print:hidden"
      />
      <div
        aria-hidden
        className="hero-grid pointer-events-none absolute inset-x-0 -top-10 bottom-0 print:hidden"
      />
      <div className="shell relative grid gap-10 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
        <div>
          <h1 className="rise mt-6 max-w-[16ch] text-balance text-[clamp(2.5rem,6vw,4.25rem)] leading-[1.04]">
            {profile.name}
          </h1>
          <p className="rise rise-1 mt-6 max-w-2xl text-pretty text-lg leading-relaxed text-fg-2">
            {profile.headline}
          </p>
          <p className="rise rise-2 mt-4 text-sm text-fg-3">
            {profile.location}
          </p>

          <div className="rise rise-3 mt-8 flex flex-wrap items-center gap-x-3 gap-y-3 print:hidden">
            <a
              href={`mailto:${profile.email}`}
              className="rounded-card bg-signal px-6 py-3 text-sm font-bold text-ink shadow-[0_8px_24px_-14px_rgba(255,191,92,0.5)] transition-opacity hover:opacity-90"
            >
              Get in touch
            </a>
            <Link
              href="/#work"
              className="cell rounded-card border border-line-bright px-6 py-3 text-sm font-semibold text-fg transition-colors hover:border-fg-3"
            >
              See the work
            </Link>
            <PrintResume className="label rounded-card px-3 py-3 text-sm text-fg-3 underline decoration-line-bright underline-offset-4 transition-colors hover:text-fg-2" />
          </div>

          {/* Plain text in print, where a mailto: is useless. */}
          <p className="num hidden text-sm print:mt-4 print:block">
            {CONTACT_LINE}
          </p>
        </div>

        {/* The same identity card the home page hero uses, so both entry
            points introduce Ryan identically. Hidden in print, where the
            plain contact line above already carries everything on it. */}
        <div className="w-full max-w-sm print:hidden md:w-[320px]">
          <ProfileCard />
        </div>
      </div>
    </header>
  );
}

/* ─────────────────────────── mission ─────────────────────────── */

function Mission() {
  return (
    <div className="shell">
      <section className="fade-in panel relative overflow-hidden px-6 py-12 md:px-12 md:py-16">
        <div
          aria-hidden
          className="hero-glow pointer-events-none absolute inset-0 opacity-70 print:hidden"
        />
        <div className="relative">
          <p className="eyebrow">{mission.eyebrow}</p>
          <h2 className="mt-6 max-w-4xl text-balance text-2xl leading-snug md:text-3xl">
            {mission.title}
          </h2>
          <div className="mt-7 grid max-w-5xl gap-5 md:grid-cols-3">
            {mission.body.map((para) => (
              <p key={para.slice(0, 32)} className="text-pretty text-sm leading-relaxed text-fg-2">
                {para}
              </p>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

/* ─────────────────────────── the trace ─────────────────────────── */

function Trace() {
  return (
    <section id="career" className="shell fade-in py-24 md:py-32 print:hidden">
      <SectionHead
        eyebrow="Career trace — live, from the work data"
        title="Two tracks, twenty years, one of them starting empty"
        lede="The top line is the commercial job and it never breaks. The bottom line is one dot per system on the shelf, read out of the same file that renders the work page. Pick a chapter."
      />
      <div className="stage mt-9">
        <div className="stage-frame">
          <DeferredMount minHeight={720}>
            <CareerTrace chapters={TRACE} />
          </DeferredMount>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────── ledger ─────────────────────────── */

const PROOF_COPY: Record<Proof, string> = {
  shipped: 'Proven by something on this site you can open',
  working: 'Done for real in the roles below — no repo to point at',
  studied: 'Coursework or reading — stated as such',
};

function Ledger() {
  return (
    <section id="capabilities" className="shell fade-in pb-24 md:pb-32">
      <SectionHead
        eyebrow="Capability ledger"
        title="Every claim says what kind of proof it has"
        lede="A skills list nobody can check is decoration. Commercial work is proven by the record; software is proven by something you can open, and those lines cite it. A claim of “shipped” that cites no Live or Built project is demoted in code, not by good intentions."
      />

      <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-xs text-fg-3">
        {(Object.keys(PROOF_COPY) as Proof[]).map((p) => (
          <li key={p} className="flex items-center gap-2">
            <span
              aria-hidden
              className="inline-block h-2 w-2 rounded-full"
              style={{
                background:
                  p === 'shipped' ? 'var(--color-signal)' : 'transparent',
                boxShadow: `inset 0 0 0 1.5px ${
                  p === 'shipped'
                    ? 'var(--color-signal)'
                    : p === 'working'
                      ? 'var(--color-model)'
                      : 'var(--color-fg-3)'
                }`,
              }}
            />
            <span className="label uppercase tracking-wider">{p}</span>
            <span>— {PROOF_COPY[p]}</span>
          </li>
        ))}
      </ul>

      <div className="mt-8 space-y-10">
        {capabilities.map((group) => (
          <div key={group.label}>
            <h3 className="eyebrow mb-3">{group.label}</h3>
            <ul className="grid-lines grid md:grid-cols-2">
              {group.items.map((item, i) => {
                const c = resolveCapability(item);
                /* An unfilled hairline cell reads as a dead panel — the
                   same reason metricCols() exists on the home page. An odd
                   final item takes the full row instead of leaving one. */
                const orphan =
                  group.items.length % 2 === 1 && i === group.items.length - 1;
                return (
                  <li
                    key={c.name}
                    className={`cell p-5 ${orphan ? 'md:col-span-2' : ''}`}
                  >
                    <div className="flex items-start gap-2.5">
                      <span
                        aria-hidden
                        className="mt-1.5 inline-block h-2 w-2 shrink-0 rounded-full"
                        style={{
                          background:
                            c.proof === 'shipped'
                              ? 'var(--color-signal)'
                              : 'transparent',
                          boxShadow: `inset 0 0 0 1.5px ${
                            c.proof === 'shipped'
                              ? 'var(--color-signal)'
                              : c.proof === 'working'
                                ? 'var(--color-model)'
                                : 'var(--color-fg-3)'
                          }`,
                        }}
                      />
                      <h4
                        className={`text-base ${
                          c.proof === 'shipped' ? 'text-fg' : 'text-fg-2'
                        }`}
                      >
                        {c.name}
                        <span className="sr-only"> — {PROOF_COPY[c.proof]}</span>
                      </h4>
                    </div>

                    {c.evidence.length > 0 ? (
                      <ul className="mt-3 flex flex-wrap gap-1.5">
                        {c.evidence.map((p) => (
                          <li key={p.slug}>
                            <Link
                              href={`/projects/${p.slug}`}
                              className="label rounded-chip border border-line bg-surface-2 px-2 py-1 text-[11px] text-fg-2 transition-colors hover:border-line-bright hover:text-fg"
                            >
                              {p.title}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      /*
                        Was a blanket "no shipped evidence on this site",
                        which read as a demerit on exactly the commercial
                        claims that matter most to the roles being targeted.
                        The absence of a repo is not a weakness for "led a
                        team to quota" — it is the wrong kind of proof, and
                        the label now says which kind applies.
                      */
                      <p className="mt-3 text-[11px] uppercase tracking-wider text-fg-3">
                        {c.proof === 'studied'
                          ? 'Not used in production'
                          : 'Evidenced by the record, not by a repo'}
                      </p>
                    )}

                    {c.note && (
                      <p className="mt-3 text-sm leading-relaxed text-fg-3">
                        {c.note}
                      </p>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ─────────────────────────── results ─────────────────────────── */

function Results() {
  const results = selectedResults();
  if (!results.length) return null;

  return (
    <section className="shell fade-in pb-24 md:pb-32">
      <SectionHead
        eyebrow="Selected results"
        title="Numbers I can defend in a room"
        lede="The commercial figures are carried by the role that produced them. The rest are read from the project that produced them rather than retyped — including the one where the finding was that my own first estimate was wrong."
      />

      <p className="eyebrow mt-9">From the roles</p>
      <dl className="grid-lines mt-3 grid sm:grid-cols-3">
        {careerResults.map((r) => (
          <div key={r.label} className="cell p-5">
            <dd className="num text-2xl text-signal">{r.value}</dd>
            <dt className="mt-2 text-sm leading-snug text-fg-2">{r.label}</dt>
            <p className="label mt-3 text-[11px] text-fg-3">{r.chapter}</p>
          </div>
        ))}
      </dl>

      <p className="eyebrow mt-10">From the work</p>
      <dl className="grid-lines mt-3 grid sm:grid-cols-2 lg:grid-cols-4">
        {results.map((r) => (
          <div key={`${r.project.slug}-${r.label}`} className="cell p-5">
            <dd className="num text-2xl text-signal">{r.value}</dd>
            <dt className="mt-2 text-sm leading-snug text-fg-2">{r.label}</dt>
            <Link
              href={`/projects/${r.project.slug}`}
              className="label mt-3 inline-block text-[11px] text-fg-3 underline decoration-line-bright underline-offset-4 transition-colors hover:text-fg-2"
            >
              {r.project.title}
            </Link>
          </div>
        ))}
      </dl>
    </section>
  );
}

/* ─────────────────────── what I'm looking for ─────────────────────── */

function Looking() {
  return (
    <section id="looking" className="shell fade-in pb-24 md:pb-32">
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

/* ─────────────────────────── résumé sheet ─────────────────────────── */

/**
 * The plain version, on screen and in print. There is deliberately no PDF
 * checked into the repo: the browser's print dialog renders this section
 * from the same data as the rest of the page, so the document a recruiter
 * saves cannot disagree with the site it came from.
 */
function ResumeSheet() {
  return (
    <section id="resume" className="shell fade-in pb-24 md:pb-32">
      <div className="print:hidden">
        <SectionHead
          eyebrow="Résumé"
          title="The same career, in plain form"
          lede="For anyone who wants to skim rather than click. This section is what prints — no PDF is checked in, because a PDF starts disagreeing with the site the first time either one is edited."
        />
        <div className="mt-7">
          <PrintResume className="cell rounded-card border border-line-bright px-5 py-2.5 text-sm font-semibold text-fg transition-colors hover:border-signal hover:text-signal" />
        </div>
      </div>

      <div className="mt-9 space-y-8 print:mt-0">
        {chapters.map((c) => {
          const shipped = evidenceFor(c).filter(
            (p) => p.status === 'Live' || p.status === 'Built'
          );
          return (
            <article
              key={c.id}
              className="border-t border-line pt-6 first:border-t-0 first:pt-0"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
                <h3 className="text-lg tracking-[-0.015em]">
                  {c.org} — {c.title}
                </h3>
                {c.period && (
                  <span className="num text-sm text-fg-3">{c.period}</span>
                )}
              </div>
              {(c.context || c.location) && (
                <p className="mt-1.5 flex flex-wrap gap-x-3 text-sm text-fg-3">
                  {c.context && <span>{c.context}</span>}
                  {c.location && <span>{c.location}</span>}
                </p>
              )}
              <ul className="mt-4 space-y-2.5">
                {c.bullets.map((b) => (
                  <Bullet key={b.slice(0, 40)}>{b}</Bullet>
                ))}
              </ul>
              {shipped.length > 0 && (
                <p className="mt-3 text-sm leading-relaxed text-fg-3">
                  <span className="label">Shipped, and on this site:</span>{' '}
                  {shipped.map((p) => p.title).join(' · ')}
                </p>
              )}
            </article>
          );
        })}

        {education.length > 0 && (
          <article className="border-t border-line pt-6">
            <h3 className="text-lg tracking-[-0.015em]">
              Education and continued development
            </h3>
            <ul className="mt-4 space-y-3">
              {education.map((e) => (
                <li key={e.credential} className="flex gap-3">
                  <span
                    aria-hidden
                    className="mt-2 h-1 w-1 shrink-0 rounded-full bg-signal-dim"
                  />
                  <div>
                    <p className="text-sm leading-relaxed text-fg">
                      {e.credential}
                    </p>
                    <p className="text-sm leading-relaxed text-fg-3">
                      {e.org}
                      {e.note ? ` — ${e.note}` : ''}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </article>
        )}
      </div>
    </section>
  );
}

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex gap-3 text-sm leading-relaxed text-fg-2">
      <span aria-hidden className="mt-2 h-1 w-1 shrink-0 rounded-full bg-signal-dim" />
      <span className="text-pretty">{children}</span>
    </li>
  );
}

/* ─────────────────────────── contact ─────────────────────────── */

function Contact() {
  return (
    <section className="shell fade-in border-t border-line py-20 md:py-24">
      <h2 className="text-3xl tracking-[-0.03em] md:text-4xl">
        Open to a conversation.
      </h2>
      <p className="mt-5 max-w-2xl text-pretty leading-relaxed text-fg-2">
        If any of the above lines up with what you are hiring for, the
        fastest way to test it is to send me the job description — the{' '}
        <Link
          href="/#work"
          className="text-model underline decoration-model-dim underline-offset-4 hover:decoration-model"
        >
          Role Lens
        </Link>{' '}
        on the work page will reorder the whole shelf against it before we
        ever speak.
      </p>
      <div className="mt-8 flex flex-wrap gap-x-8 gap-y-3">
        <a
          href={`mailto:${profile.email}`}
          className="num text-signal underline decoration-signal-dim underline-offset-4 transition-colors hover:decoration-signal"
        >
          {profile.email}
        </a>
        <a
          href={profile.linkedin}
          className="num text-model underline decoration-model-dim underline-offset-4 transition-colors hover:decoration-model"
        >
          {profile.linkedin.replace('https://', '')}
        </a>
        <a
          href={profile.github}
          className="num text-model underline decoration-model-dim underline-offset-4 transition-colors hover:decoration-model"
        >
          {profile.github.replace('https://', '')}
        </a>
      </div>
    </section>
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
      <h2 className="mt-4 max-w-3xl text-balance text-3xl tracking-[-0.025em] md:text-4xl">
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

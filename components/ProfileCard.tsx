import Image from 'next/image';
import { currentChapter, openTo, profile } from '@/lib/career';

/**
 * The identity card — the thing a LinkedIn profile leads with and this site
 * did not have: a face, a status, a location, and a way to make contact,
 * all in one object above the fold.
 *
 * Shared by the home page hero and /about so there is one definition of
 * how Ryan is introduced. Everything renders from lib/career.ts.
 */
export default function ProfileCard() {
  return (
    <aside className="panel relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px"
        style={{
          background:
            'linear-gradient(90deg, transparent, var(--color-signal), transparent)',
        }}
      />

      <Portrait />

      <div className="p-5">
        <AvailabilityChip />

        <p className="mt-4 text-lg font-bold tracking-[-0.02em]">
          {profile.name}
        </p>
        <p className="mt-1 text-sm leading-snug text-fg-3">
          Business development · Partnerships · Sales leadership
        </p>
        <p className="mt-3 flex items-center gap-1.5 text-sm text-fg-2">
          <PinIcon />
          {profile.location}
        </p>

        {/*
          Deliberately not a stat block. The record strip immediately below
          the hero already carries the numbers, and repeating them here put
          the same five figures on screen twice. This is what a LinkedIn
          card actually leads with instead: what I do now, and what I am
          open to. "Now" is read from the career chapters, so it updates
          itself when the next role is added.
        */}
        <dl className="mt-5 space-y-3 border-t border-line pt-4">
          <div>
            <dt className="eyebrow text-[10px]">Now</dt>
            <dd className="mt-1 text-sm leading-snug text-fg-2">
              {currentChapter.title} · {currentChapter.org}
            </dd>
          </div>
          <div>
            <dt className="eyebrow text-[10px]">Open to</dt>
            <dd className="mt-1 text-sm leading-snug text-fg-2">{openTo}</dd>
          </div>
        </dl>

        <div className="mt-5 flex flex-col gap-2 border-t border-line pt-4 text-sm">
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
      </div>
    </aside>
  );
}

/**
 * A portrait if one is configured, otherwise the site's own bar mark at
 * scale. The fallback is designed rather than apologetic — an empty grey
 * avatar circle would read as an unfinished page, which is the opposite of
 * what this card is for.
 */
function Portrait() {
  if (profile.portrait) {
    return (
      <Image
        src={profile.portrait}
        alt={`${profile.name}, portrait`}
        width={640}
        height={640}
        priority
        className="aspect-square w-full border-b border-line object-cover"
      />
    );
  }
  return (
    <div
      aria-hidden
      className="identity-mark flex aspect-[16/9] items-center justify-center border-b border-line"
    >
      <span className="flex items-end gap-[6px]">
        <span className="block h-9 w-[9px] rounded-[2px] bg-model-dim" />
        <span className="block h-16 w-[9px] rounded-[2px] bg-model" />
        <span className="block h-24 w-[9px] rounded-[2px] bg-signal" />
      </span>
    </div>
  );
}

function AvailabilityChip() {
  const { open, line } = profile.availability;
  return (
    <span
      className="label inline-flex items-center gap-2 rounded-chip border px-2.5 py-1 text-[11px] leading-snug"
      style={{
        color: open ? 'var(--color-signal)' : 'var(--color-fg-2)',
        borderColor: open
          ? 'var(--color-signal-dim)'
          : 'var(--color-line-bright)',
        background: open
          ? 'color-mix(in srgb, var(--color-signal) 10%, transparent)'
          : 'var(--color-surface-2)',
      }}
    >
      {open && (
        <span
          aria-hidden
          className="inline-block h-1.5 w-1.5 shrink-0 rounded-full"
          style={{ background: 'var(--color-signal)' }}
        />
      )}
      {line}
    </span>
  );
}


function PinIcon() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden
      className="shrink-0 text-fg-3"
    >
      <path
        d="M8 1.6a4.6 4.6 0 0 0-4.6 4.6c0 3.45 4.6 8.2 4.6 8.2s4.6-4.75 4.6-8.2A4.6 4.6 0 0 0 8 1.6Z"
        stroke="currentColor"
        strokeWidth="1.3"
      />
      <circle cx="8" cy="6.2" r="1.6" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  );
}

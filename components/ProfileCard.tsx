import Image from 'next/image';
import { currentChapter, openTo, profile } from '@/lib/career';

/**
 * The identity card — the thing a LinkedIn profile leads with and this site
 * did not have: a face, a status, a location, and a way to make contact,
 * all in one object above the fold.
 *
 * The portrait is full-bleed and dissolves into the card through a scrim,
 * with the name and title set over it, rather than sitting as a framed
 * picture with a caption underneath. That is the whole difference between
 * this and an avatar: the image is the card, not an element on it.
 *
 * Shared by the home page hero and /about so both entry points introduce
 * Ryan identically. Everything renders from lib/career.ts.
 */
export default function ProfileCard() {
  return (
    <div className="profile-halo">
      <aside className="profile-card overflow-hidden">
        {/* Warm hairline along the very top — the same "measured, verified"
            accent the rest of the site reserves for true things. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 z-20 h-px"
          style={{
            background:
              'linear-gradient(90deg, transparent, var(--color-signal-fill), transparent)',
          }}
        />

        <header className="profile-frame relative">
          <Portrait />

          {/* Fades the image into the card colour. Tall enough that the name
              below has a dark bed to sit on regardless of what the bottom of
              the picture happens to contain. */}
          <div
            aria-hidden
            className="profile-scrim pointer-events-none absolute inset-x-0 bottom-0 h-3/5"
          />

          <div className="absolute left-4 right-4 top-4 z-10">
            <AvailabilityChip />
          </div>

          <div className="absolute inset-x-0 bottom-0 z-10 p-5">
            <p className="text-xl font-bold tracking-[-0.025em] text-fg">
              {profile.name}
            </p>
            <p className="mt-1 text-sm leading-snug text-fg-2">
              Revenue systems · Analytics · Business development
            </p>
            <p className="mt-2 flex items-center gap-1.5 text-sm text-fg-3">
              <PinIcon />
              {profile.location}
            </p>
          </div>
        </header>

        <div className="px-5 pb-5">
          {/*
            Deliberately not a stat block. The record strip immediately below
            the hero already carries the numbers, and repeating them here put
            the same five figures on screen twice. This is what a LinkedIn
            card actually leads with instead: what I do now, and what I am
            open to. "Now" is read from the career chapters, so it updates
            itself when the next role is added.
          */}
          <dl className="space-y-3">
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
    </div>
  );
}

/**
 * A portrait if one is configured, otherwise the site's own bar mark at
 * scale. The fallback is designed rather than apologetic — an empty grey
 * avatar circle would read as an unfinished page, which is the opposite of
 * what this card is for.
 *
 * 4:5 rather than square: the taller frame reads editorial instead of
 * profile-picture, and it gives the scrim room to work without covering
 * the subject's face.
 */
function Portrait() {
  if (profile.portrait) {
    return (
      <Image
        src={profile.portrait}
        alt={`${profile.name}, illustrated portrait`}
        width={800}
        height={1000}
        priority
        sizes="(min-width: 1024px) 340px, 384px"
        className="aspect-[4/5] w-full object-cover"
      />
    );
  }
  return (
    <div
      aria-hidden
      /* Centred in the upper 60% — the name plate owns the bottom of the
         frame, and at items-end the mark collided with it. */
      className="identity-mark flex aspect-[4/5] items-center justify-center pb-[38%]"
    >
      <span className="flex items-end gap-[7px]">
        <span className="block h-10 w-[10px] rounded-[2px] bg-model-dim" />
        <span className="block h-20 w-[10px] rounded-[2px] bg-model" />
        <span className="block h-32 w-[10px] rounded-[2px] bg-signal" />
      </span>
    </div>
  );
}

function AvailabilityChip() {
  const { open, line } = profile.availability;
  return (
    <span
      className="label inline-flex items-center gap-2 rounded-chip border px-2.5 py-1 text-[11px] leading-snug backdrop-blur-sm"
      style={{
        color: open ? 'var(--color-signal)' : 'var(--color-fg-2)',
        borderColor: open
          ? 'var(--color-signal-dim)'
          : 'var(--color-line-bright)',
        /* Opaque rather than a tint: this chip sits over a picture, so it
           needs its own ground to stay legible whatever is behind it. */
        background: 'color-mix(in srgb, var(--color-ink) 74%, transparent)',
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

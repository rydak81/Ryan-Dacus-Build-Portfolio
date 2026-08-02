import Image from 'next/image';
import { shots, type Shot } from '@/lib/screenshots';
import { accentFor } from '@/lib/accents';

/**
 * HeroMosaic
 * A band of shipped-product screenshots sitting directly below the hero
 * copy, each in minimal browser chrome, tilted and layered for depth.
 *
 * Why a band and not a bleed behind the headline: the brief allows either,
 * and the band wins on the two constraints that actually matter. The hero
 * text can never lose contrast to an image it does not overlap, and the
 * mobile rule ("never behind text") becomes structural rather than
 * something enforced with a media query I could get wrong later.
 *
 * Depth is built from three stacked treatments — scale, brightness, and a
 * small blur — keyed off each shot's `depth`. Nothing here uses a
 * backdrop-filter, and the blur is applied to already-composited images at
 * fixed radii, so it costs one paint and does not touch Lighthouse.
 *
 * Renders null on an empty manifest. No skeleton, no placeholder frame —
 * an empty hero is correct, a hero full of fake screenshots is not.
 */
export default function HeroMosaic() {
  if (shots.length === 0) return null;

  return (
    <section
      aria-labelledby="mosaic-label"
      className="relative pb-20 md:pb-28"
    >
      <div
        aria-hidden
        className="mosaic-wash pointer-events-none absolute -inset-x-24 -top-16 bottom-0"
      />

      <p id="mosaic-label" className="eyebrow relative">
        Internal tools and shipped dashboards — the live models run below.
      </p>

      {/*
        Desktop: an overlapping, tilted stack. Mobile: the same frames in a
        single clean horizontally-scrolled band, untilted and unblurred.
        One DOM, two layouts — no duplicate markup to drift.
      */}
      <div className="mosaic relative mt-7">
        {shots.map((shot, i) => (
          <Frame key={shot.src} shot={shot} index={i} />
        ))}
      </div>
    </section>
  );
}

function Frame({ shot, index }: { shot: Shot; index: number }) {
  const accent = accentFor(shot.slug);

  return (
    <figure
      className="mosaic-frame"
      data-depth={shot.depth}
      style={
        {
          '--tilt': `${TILTS[index % TILTS.length]}deg`,
          '--float-delay': `${(index % 4) * 1.6}s`,
          '--accent': accent?.raw ?? 'var(--color-line-bright)',
        } as React.CSSProperties
      }
    >
      {/* Browser chrome. Decorative, so it is hidden from the a11y tree. */}
      <div aria-hidden className="mosaic-chrome">
        <span className="mosaic-dot" />
        <span className="mosaic-dot" />
        <span className="mosaic-dot" />
      </div>

      <div className="mosaic-shot">
        <Image
          src={shot.src}
          alt={shot.alt}
          width={shot.width}
          height={shot.height}
          /*
            Only the nearest, first frame is eager — it is the one most
            likely to be in the initial viewport and is the LCP candidate
            worth prioritising. Everything behind it loads lazily.
          */
          priority={index === 0}
          loading={index === 0 ? 'eager' : 'lazy'}
          /*
            Frames are ~78vw on a phone (one band, slight peek at the next),
            and cap out around 460px once the stack goes horizontal.
          */
          sizes="(max-width: 767px) 78vw, (max-width: 1279px) 40vw, 460px"
          className="block h-auto w-full"
        />
      </div>

      <figcaption className="sr-only">{shot.alt}</figcaption>
    </figure>
  );
}

/**
 * Tilt sequence, held to the 2–4° the brief asks for and alternating sign
 * so the row reads as a scatter rather than a lean.
 */
const TILTS = [-3, 2.2, -2.4, 3.4, -2] as const;

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

/**
 * Dark glass over everything, at every scroll position.
 *
 * The nav keeps the navy of the hero as the page scrolls onto the light
 * sections below it, so the brand colour never leaves the screen and the
 * wordmark never has to change colour halfway down the page. That is the
 * analytics app's header, and carrying it over is most of what makes the
 * two properties read as one product family.
 *
 * The `scrolled` state no longer switches the treatment on and off — it
 * only firms the glass up, so light content passing underneath never
 * shows through enough to hurt the wordmark.
 */

/*
   Ordered the way the page argues: the operating loop first, then the
   work it produced, then the record behind it, then the full profile.
   "The loop" replaced "How I sell" when the page spine changed — the
   sales motion is now one chapter of the career rather than the frame
   the whole site hangs on.
*/
const LINKS: [string, string][] = [
  ['The loop', '/#loop'],
  ['Work', '/#work'],
  ['Career', '/#career'],
  ['About', '/about'],
];

export default function SiteNav({ email }: { email: string }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div
      className="nav-shell on-dark sticky top-0 z-50"
      data-scrolled={scrolled ? 'true' : 'false'}
    >
      <nav
        aria-label="Primary"
        className="shell flex h-[72px] items-center justify-between gap-4"
      >
        <Link
          href="/"
          className="flex items-center gap-2.5 text-base font-extrabold tracking-[-0.02em] text-white"
        >
          {/* Three bars climbing: the recessive one, the model one, the
              verified one. The same mark the identity card renders at
              scale, and the site's palette rule in three objects. */}
          <span aria-hidden className="flex items-end gap-[2.5px]">
            <span className="block h-2 w-[3.5px] rounded-[1px] bg-white/35" />
            <span className="block h-3 w-[3.5px] rounded-[1px] bg-[oklch(0.72_0.14_268)]" />
            <span className="block h-[18px] w-[3.5px] rounded-[1px] bg-[oklch(0.72_0.17_50)]" />
          </span>
          Ryan Dacus
        </Link>

        <div className="flex items-center gap-1 sm:gap-2">
          {/*
            The anchors collapse on a phone, but About must not — it is a
            separate route, and without it the only way to reach the
            résumé on mobile was to scroll the entire home page.
          */}
          <ul className="flex items-center gap-1">
            {LINKS.map(([label, href]) => (
              <li key={label} className={href === '/about' ? '' : 'hidden sm:block'}>
                <Link
                  href={href}
                  className="rounded-chip px-3 py-1.5 text-sm font-medium text-white/70 transition-colors hover:bg-white/10 hover:text-white"
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>
          <a
            href={`mailto:${email}`}
            className="glow-brand ml-1 rounded-chip bg-signal-cta px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            Get in touch
          </a>
        </div>
      </nav>

      {/*
        Read-position hairline. Driven by a scroll timeline in globals.css —
        no listener, no state, and browsers without support just never draw
        it. Warm is legitimate here under the palette rule: it is measuring
        something real.
      */}
      <div
        aria-hidden
        className="scroll-progress absolute inset-x-0 bottom-0 h-px bg-[oklch(0.72_0.17_50)]"
      />
    </div>
  );
}

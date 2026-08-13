'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

/**
 * Slim sticky chrome. Transparent over the hero, glass once scrolled — the
 * only backdrop-filter on the site. Anchors are absolute (`/#method`) so the
 * same nav works from a case-study page.
 */

/*
   Ordered the way the page argues: the sales motion, then the record, then
   the work, then the full profile. "Method" and "Stack" came out — they are
   build-side sections, still reachable by scrolling, and giving them nav
   real estate made the site read as an engineer's portfolio in the first
   two seconds. About is a real route, not an anchor.
*/
const LINKS: [string, string][] = [
  ['How I sell', '/#motion'],
  ['Career', '/#career'],
  ['Work', '/#work'],
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
      className="nav-shell sticky top-0 z-50"
      data-scrolled={scrolled ? 'true' : 'false'}
    >
      <nav
        aria-label="Primary"
        className="shell flex h-16 items-center justify-between gap-4"
      >
        <Link
          href="/"
          className="flex items-center gap-2.5 text-[0.9375rem] font-bold tracking-[-0.02em] text-fg"
        >
          <span aria-hidden className="flex items-end gap-[2px]">
            <span className="block h-1.5 w-[3px] rounded-[1px] bg-model-dim" />
            <span className="block h-2.5 w-[3px] rounded-[1px] bg-model" />
            <span className="block h-4 w-[3px] rounded-[1px] bg-signal" />
          </span>
          Ryan Dacus
        </Link>

        <div className="flex items-center gap-1 sm:gap-2">
          {/*
            The anchors collapse on a phone, but About must not — it is a
            separate route, and without it the only way to reach the résumé
            on mobile was to scroll the entire home page to the footer.
          */}
          <ul className="flex items-center gap-1">
            {LINKS.map(([label, href]) => (
              <li key={label} className={href === '/about' ? '' : 'hidden sm:block'}>
                <Link
                  href={href}
                  className="rounded-chip px-3 py-1.5 text-sm font-semibold text-fg-2 transition-colors hover:bg-surface-2 hover:text-fg"
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>
          <a
            href={`mailto:${email}`}
            className="cell rounded-chip border border-line-bright px-3.5 py-1.5 text-sm font-semibold text-fg transition-colors hover:border-signal hover:text-signal"
          >
            Get in touch
          </a>
        </div>
      </nav>
    </div>
  );
}

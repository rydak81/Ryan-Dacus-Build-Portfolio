/**
 * lib/screenshots.ts
 * The hero mosaic manifest.
 *
 * Every frame in the hero montage is declared here and nowhere else. The
 * mosaic renders exactly what this array contains, in order, and renders
 * nothing at all when it is empty — so the hero stays correct and
 * shift-free until real screenshots land.
 *
 * RULES, and they are the point of this file:
 *
 * 1. `src` must be a real file already sitting in public/screenshots/.
 *    Nothing here is generated, sourced, or mocked up. A missing file is a
 *    missing frame, not a placeholder.
 *
 * 2. `alt` is short and factual and describes what is visibly on screen.
 *    No metrics, no outcomes, no claims. "Recovery forecast dashboard with
 *    credible intervals" — yes. "Dashboard that recovered $2M" — never.
 *
 * 3. `width` / `height` are the image's true intrinsic pixel dimensions.
 *    next/image needs them to reserve space, and a wrong number is a
 *    layout shift.
 *
 * 4. `depth` places the frame in the layered stack. 0 is nearest the
 *    viewer: sharp, full brightness. 2 is furthest: dimmed and softly
 *    blurred. This is the only thing that creates the sense of depth, so
 *    vary it — a row that is all depth 0 is just a row.
 *
 * 5. `slug` ties the frame to lib/projects.ts, which is where its accent
 *    colour comes from. It must match an existing project slug.
 *
 * To add frames: drop the PNGs into public/screenshots/, then append an
 * entry per image below. No other file needs to change.
 */

export interface Shot {
  /** Path under /public. */
  src: string;
  /** Short, factual, no claims. Describes what is on screen. */
  alt: string;
  /** True intrinsic pixel width. */
  width: number;
  /** True intrinsic pixel height. */
  height: number;
  /** 0 = nearest and sharpest, 2 = furthest, dimmed and blurred. */
  depth: 0 | 1 | 2;
  /** Must match a slug in lib/projects.ts. Drives the frame's accent. */
  slug: string;
}

/**
 * Empty until real screenshots are committed to public/screenshots/.
 * The mosaic is fully built and waiting — it renders as soon as this has
 * entries, and renders nothing while it does not.
 */
export const shots: Shot[] = [
  { src: '/screenshots/f1.png', alt: 'TEMP FIXTURE', width: 1280, height: 800, depth: 1, slug: 'marketplace-beta' },
  { src: '/screenshots/f2.png', alt: 'TEMP FIXTURE', width: 1280, height: 800, depth: 0, slug: '3t-recovery-wizard' },
  { src: '/screenshots/f3.png', alt: 'TEMP FIXTURE', width: 1280, height: 800, depth: 2, slug: 'qbr-funnel-command-center' },
];

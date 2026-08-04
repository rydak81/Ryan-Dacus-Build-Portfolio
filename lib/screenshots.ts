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
  /**
   * Set to 'light' for a predominantly white screenshot. The depth ladder is
   * calibrated for dark dashboards, so a white capture at the same depth
   * reads brighter than its darker neighbours and steals focus from the
   * centre frame. This applies extra damping. Omit for dark shots.
   */
  tone?: 'light';
}

/**
 * Live manifest — five frames spanning three different projects.
 *
 * WHY A MIX AND NOT FIVE OF ONE APP: five views of the same dashboard reads
 * as one screenshot taken five times. Three products — a Bayesian
 * forecasting model, a public marketplace-intelligence site, and a
 * production Postgres schema — reads as range, which is the point of a
 * portfolio hero.
 *
 * ORDERING IS DELIBERATE, on three axes:
 *
 * a) Composition. Frames render left-to-right, so depth runs 2 → 1 → 0 →
 *    1 → 2. The sharpest frame lands dead centre and the stack recedes
 *    symmetrically either side of it.
 *
 * b) Variety of surface. Adjacent frames never show the same kind of thing.
 *    The centre is a chart, flanked by a marketing site and a database
 *    schema, with a second chart and site at the edges — so no two
 *    neighbours look interchangeable at a glance.
 *
 * c) Legibility of former-employer branding. Two of the recovery-wizard
 *    screenshots have "Threecolts Fee" / "3T Fee" baked into the pixels,
 *    which cannot be edited out of a PNG. Those are parked at depth 2,
 *    where the ladder dims to 66% brightness and blurs 1.6px.
 *
 * The three new frames are CROPPED from larger captures — dead gradient,
 * console sidebar, and the v0 toolbar badge trimmed off — because each
 * frame renders only ~310-330px wide, so cropping is what makes the content
 * legible rather than a smudge. Widths/heights below are the true intrinsic
 * dimensions of the cropped files.
 */
export const shots: Shot[] = [
  {
    src: '/screenshots/lighthouse-analysis.png',
    alt: 'Recovery analysis view with a channel contribution bar chart',
    width: 1332,
    height: 770,
    /* Cropped to the channel-contribution chart. The full capture carried
       the app's fee-split panel; commercial terms stay off this site, so
       that region does not ship. */
    depth: 2,
    slug: '3t-recovery-wizard',
  },
  {
    src: '/screenshots/marketplacebeta-home.png',
    alt: 'MarketplaceBeta home page with a live news ticker and coverage statistics',
    width: 1600,
    height: 829,
    depth: 1,
    slug: 'marketplace-beta',
    // Light hero on a pale gradient.
    tone: 'light',
  },
  {
    src: '/screenshots/lighthouse-forecast.png',
    // Centre frame: strongest composition, and no former-employer label.
    alt: 'Multi-year recovery forecast with confidence bands and seasonality',
    width: 2380,
    height: 1474,
    depth: 0,
    slug: '3t-recovery-wizard',
  },
  {
    src: '/screenshots/supabase-schema.png',
    /*
      Slugged to the QBR command centre: the visible tables — prospects,
      quarterly_targets with target_acv, recommendations, and a
      model-version table — are that project's schema, and it is the
      Supabase build in the catalogue.

      The capture's own table names are Postgres identifiers baked into the
      PNG and cannot be edited out, so the alt text describes them in the
      site's vocabulary rather than quoting them verbatim.
    */
    alt: 'Postgres schema visualiser showing related account, prospect and quarterly target tables',
    width: 1600,
    height: 1000,
    depth: 1,
    slug: 'qbr-funnel-command-center',
    // Near-white schema canvas — the brightest of the five.
    tone: 'light',
  },
  {
    src: '/screenshots/marketplacebeta-newsletter.png',
    alt: 'Daily marketplace brief signup page with subscriber statistics and a subscribe form',
    width: 1542,
    height: 964,
    depth: 2,
    slug: 'marketplace-beta',
    // Split light/dark, but the left two-thirds is a white hero.
    tone: 'light',
  },
];

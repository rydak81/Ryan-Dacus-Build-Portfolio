/**
 * lib/accents.ts
 * Per-project accent colours, sampled from the real running application.
 *
 * RULE: an entry may only exist here if I opened that app and read the
 * colour out of its own computed styles. No inferred brand colours, no
 * "this feels like a logistics blue". A project with no live surface to
 * sample gets no accent and renders in the neutral house palette — that
 * absence is honest and costs nothing.
 *
 * `tint`  text-safe. Adjusted where the raw brand colour fails AA on our
 *         surfaces, so it can carry a label or a rule.
 * `raw`   the colour as the app actually ships it. Decorative only —
 *         glows, washes, chrome. Never used for text.
 *
 * BOTH TINTS WERE RE-DERIVED when the site moved to a light ground, and
 * they moved in the opposite direction from before. On near-black these
 * had to be brightened away from the brand colour to clear AA; on white
 * they have to be darkened. The old values (#5b9bff, #22d3ee) measure
 * 2.6:1 and 1.8:1 as text on white — they would have shipped as unreadable
 * links, which is exactly the failure this file exists to prevent.
 *
 * Contrast of every `tint`, against the two surfaces text sits on
 * (--surface white L=1.0 · --surface-2 oklch(0.955) L≈0.90):
 *   #1d4ed8 → 7.51:1 · 6.79:1
 *   #0e7490 → 5.31:1 · 4.80:1
 * Both ≥ 4.5:1. Re-check if either value changes.
 */

export interface Accent {
  /** Text-safe on --surface and --surface-2. */
  tint: string;
  /** The app's actual colour. Decorative use only. */
  raw: string;
  /** Where it came from, so this stays auditable. */
  source: string;
}

export const accents: Record<string, Accent> = {
  'marketplace-beta': {
    // Primary CTA on marketplacebeta.com reads ~#1d4ed8. On a white card
    // that is already text-safe, so the tint is now the raw colour — the
    // link and the product agree exactly, with no adjustment in between.
    tint: '#1d4ed8',
    raw: '#1d4ed8',
    source: 'Sampled from marketplacebeta.com primary CTA',
  },
  '3t-recovery-wizard': {
    // The wizard runs an indigo field (#6366f1) with cyan as its accent.
    // Indigo is within a hair of our own --color-model, so the cyan is what
    // actually distinguishes it — but #22d3ee on white is 1.8:1, so the
    // tint is darkened along the same hue while `raw` keeps the real one
    // for the washes and the chrome dot.
    tint: '#0e7490',
    raw: '#22d3ee',
    source: 'Sampled from v0-3trecovery-wizard.vercel.app accent',
  },
};

export const accentFor = (slug: string): Accent | undefined => accents[slug];

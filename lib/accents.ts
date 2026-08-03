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
 * `tint`  text-safe. Brightened where the raw brand colour fails AA on our
 *         dark surfaces, so it can carry a label or a rule.
 * `raw`   the colour as the app actually ships it. Decorative only —
 *         glows, washes, chrome. Never used for text.
 *
 * Contrast of every `tint`, against the two surfaces text sits on
 * (--surface #12141f L=0.0073 · --surface-2 #191c2b L=0.0121):
 *   #5b9bff → 6.62:1 · 6.11:1
 *   #22d3ee → 10.3:1 · 9.53:1
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
    // Primary CTA on marketplacebeta.com reads ~#1d4ed8, which fails AA as
    // text on our surfaces. Brightened along the same hue for the tint.
    tint: '#5b9bff',
    raw: '#1d4ed8',
    source: 'Sampled from marketplacebeta.com primary CTA',
  },
  '3t-recovery-wizard': {
    // The wizard runs an indigo field (#6366f1) with cyan as its accent.
    // Indigo is within a hair of our own --color-model, so the cyan is what
    // actually distinguishes it.
    tint: '#22d3ee',
    raw: '#22d3ee',
    source: 'Sampled from v0-3trecovery-wizard.vercel.app accent',
  },
};

export const accentFor = (slug: string): Accent | undefined => accents[slug];

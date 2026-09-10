import { ImageResponse } from 'next/og';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

/**
 * The LinkedIn share card. Same argument as the site, compressed to one
 * frame: the palette (ink, amber for true, indigo for modeled), the mono
 * eyebrow, the display headline, and the plotting grid. Fonts are checked
 * into app/og-fonts so the build never depends on the network.
 */

export const alt =
  'Ryan Dacus — I sell technology I know how to build.';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

/*
  The card stays dark, and that is not a leftover from the old build: the
  hero it advertises is a navy mesh, so a dark OG image is the honest
  preview of what a click actually lands on. What changed is the palette
  under it — the near-black indigo and amber became the mesh navy and the
  brand orange, matching `.bg-mesh` and `.on-dark` in globals.css.

  Hex rather than oklch: Satori renders this at build time and does not
  support oklch, so these are the sRGB equivalents of the tokens.
*/
const INK = '#131a3a';        // oklch(0.17 0.07 268) — the mesh base
const BLOOM = '#26346e';      // the blue bloom, used for the grid lines
const LINE = '#2f3c73';
const FG = '#ffffff';
const FG_2 = '#c3cae8';
const FG_3 = '#8f9bc4';
const SIGNAL = '#ffa95c';     // orange, lightened for a navy ground
const MODEL = '#a5aefc';      // royal blue, lightened the same way

export default async function OpengraphImage() {
  const [display, mono] = await Promise.all([
    readFile(join(process.cwd(), 'app/og-fonts/SpaceGrotesk-Medium.ttf')),
    readFile(join(process.cwd(), 'app/og-fonts/IBMPlexMono-Regular.ttf')),
  ]);

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: INK,
          backgroundImage: `linear-gradient(${BLOOM} 1px, transparent 1px), linear-gradient(90deg, ${BLOOM} 1px, transparent 1px)`,
          backgroundSize: '56px 56px',
          padding: '64px 72px',
          fontFamily: 'Space Grotesk',
        }}
      >
        {/* Top row: eyebrow + status */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontFamily: 'IBM Plex Mono',
            fontSize: 22,
            letterSpacing: '0.14em',
            color: FG_3,
          }}
        >
          <div style={{ display: 'flex' }}>
            GREENVILLE, SC · REVENUE OPS · ANALYTICS · SYSTEMS
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              color: SIGNAL,
              border: `1px solid ${SIGNAL}55`,
              padding: '8px 16px',
            }}
          >
            <div
              style={{
                width: 10,
                height: 10,
                borderRadius: 10,
                backgroundColor: SIGNAL,
                display: 'flex',
              }}
            />
            LIVE MODELS
          </div>
        </div>

        {/* Headline */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            marginTop: 76,
            fontSize: 66,
            lineHeight: 1.06,
            letterSpacing: '-0.02em',
            color: FG,
          }}
        >
          <div style={{ display: 'flex' }}>I build the systems</div>
          <div style={{ display: 'flex', color: SIGNAL }}>
            that find the revenue.
          </div>
        </div>

        {/* Sub line */}
        <div
          style={{
            display: 'flex',
            marginTop: 36,
            fontSize: 26,
            color: FG_2,
            fontFamily: 'IBM Plex Mono',
          }}
        >
          <span style={{ color: MODEL }}>Monte Carlo · Bayesian updating</span>
          <span style={{ color: FG_3, marginLeft: 16, marginRight: 16 }}>
            — running in your browser
          </span>
        </div>

        {/* Bottom rule + name */}
        <div
          style={{
            display: 'flex',
            marginTop: 'auto',
            paddingTop: 32,
            borderTop: `1px solid ${LINE}`,
            justifyContent: 'space-between',
            alignItems: 'baseline',
          }}
        >
          <div style={{ display: 'flex', fontSize: 34, color: FG }}>
            Ryan Dacus
          </div>
          <div
            style={{
              display: 'flex',
              fontFamily: 'IBM Plex Mono',
              fontSize: 24,
              color: FG_3,
            }}
          >
            ryandacus.com
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: 'Space Grotesk', data: display, weight: 500, style: 'normal' },
        { name: 'IBM Plex Mono', data: mono, weight: 400, style: 'normal' },
      ],
    }
  );
}

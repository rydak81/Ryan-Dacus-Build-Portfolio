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

const INK = '#0b0c14';
const SURFACE_2 = '#191c2b';
const LINE = '#252a3d';
const FG = '#e9ecf5';
const FG_2 = '#a0a7bd';
const FG_3 = '#7e87a3';
const SIGNAL = '#ffbf5c';
const MODEL = '#7c8cff';

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
          backgroundImage: `linear-gradient(${SURFACE_2} 1px, transparent 1px), linear-gradient(90deg, ${SURFACE_2} 1px, transparent 1px)`,
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
            GREENVILLE, SC · PARTNERSHIPS &amp; REVENUE SYSTEMS
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
          <div style={{ display: 'flex' }}>I sell technology</div>
          <div style={{ display: 'flex' }}>I know how to build.</div>
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

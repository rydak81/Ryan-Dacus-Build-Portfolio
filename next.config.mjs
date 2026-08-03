/**
 * next.config.mjs
 *
 * Two concerns: making sure the hero mosaic's screenshots are actually
 * optimised, and baseline security headers on the deployed site.
 */

/**
 * Baseline hardening. None of these are required for the app to run — the
 * v0 preview strips framing and CSP so the app can still render in an
 * iframe, and next-lite previews don't apply this block at all. They do
 * apply on the deployed site.
 *
 * X-Frame-Options is included deliberately: this site has no embeddable
 * surface and nothing here is meant to be framed elsewhere.
 *
 * CSP is report-only for now. It logs violations without breaking the live
 * site, which matters because Next emits inline hydration scripts that will
 * generate script-src reports. Tighten and switch to the enforcing header
 * once those reports are clean — report-only protects nothing until then.
 */
const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  {
    // Nothing here uses any of these.
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=()',
  },
  {
    key: 'Content-Security-Policy-Report-Only',
    value: [
      "default-src 'self'",
      "img-src 'self' data: blob:",
      "style-src 'self' 'unsafe-inline'",
      "script-src 'self' 'unsafe-inline'",
      "font-src 'self' data:",
      // The Role Lens calls Anthropic server-side, so no extra origin is
      // needed here. Add one only if a client-side fetch is ever introduced.
      "connect-src 'self'",
      "frame-ancestors 'self'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; '),
  },
];

const nextConfig = {
  images: {
    /*
      Widths the mosaic actually requests. Frames are ~78vw on a phone and
      cap near 460px on desktop, so generating anything above ~1080 for them
      is wasted work — but the list has to stay wide enough for any
      full-bleed image added later.
    */
    deviceSizes: [375, 640, 750, 828, 1080, 1200, 1920],
    imageSizes: [256, 384, 460, 640],
    // Screenshots are UI: flat colour, hard edges, text. AVIF holds those
    // far better than JPEG at the same weight.
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 2678400,
  },
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
  /*
    Four project slugs were renamed away from "partner" wording. These are
    permanent redirects so any link already shared — in a CV, an email, a
    LinkedIn post — still lands on the right page instead of a 404.

    Keep them indefinitely. They cost nothing, and an old URL may be sitting
    in someone's inbox.
  */
  async redirects() {
    return [
      ['partner-enablement-portal', 'channel-enablement-portal'],
      ['monday-partner-crm', 'monday-revenue-crm'],
      ['partner-health-slack', 'channel-health-slack'],
      ['partner-enablement-system', 'sales-enablement-system'],
    ].map(([from, to]) => ({
      source: `/projects/${from}`,
      destination: `/projects/${to}`,
      permanent: true,
    }));
  },
};

export default nextConfig;

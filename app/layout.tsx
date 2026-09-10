import type { Metadata, Viewport } from 'next';
import { JetBrains_Mono, Plus_Jakarta_Sans } from 'next/font/google';
import SiteNav from '@/components/SiteNav';
import './globals.css';

/*
  Plus Jakarta Sans for everything a person reads, JetBrains Mono for every
  figure — the pairing from the analytics app, brought over so the two
  properties read as one body of work. Jakarta is geometric enough to carry
  a 76px headline and quiet enough at 15px inside a dense capability table,
  and its wide counters are what keeps the small caveat copy legible. That
  copy — the notes stating what a claim does not cover — is the half of
  this site that must not get skipped.
*/
const sans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-jakarta',
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
});

/*
  Mono is reserved for genuine numerics — metric values, percentages, step
  indices, URLs. It is not used for eyebrows or body copy.
*/
const mono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-mono-num',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? 'https://ryandacus.com'
  ),
  /*
    Titled for the discipline rather than the job title. The previous
    version led with "business development, partnerships & sales
    leadership", which is accurate about the roles held and wrong about
    what the site is: a shelf of instrumentation, analysis, and the systems
    that act on what the analysis found. The commercial record is the
    evidence underneath that, not the label on it.
  */
  title: 'Ryan Dacus — Revenue operations, analytics & systems',
  description:
    'I build the systems that find revenue: ingestion and data pipelines, performance dashboards, forecast and simulation engines, and the CRM and enablement tooling that acts on what the analysis surfaces. Twenty years carrying a commercial number is why the models are built around the operator’s P&L rather than a textbook’s.',
  openGraph: {
    title: 'Ryan Dacus — Revenue operations, analytics & systems',
    description:
      'Instrument the revenue, find the low performers, prove why, and ship the path to fix it. Every model on this site runs live in the browser.',
    type: 'website',
  },
};

export const viewport: Viewport = {
  /* The first paint a visitor gets is the navy mesh hero, so the browser
     chrome should match it rather than the paper underneath. */
  themeColor: '#182046',
  colorScheme: 'light',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${sans.variable} ${mono.variable} bg-page`}
    >
      <body>
        <SiteNav email="ryandacus@gmail.com" />
        {children}
      </body>
    </html>
  );
}

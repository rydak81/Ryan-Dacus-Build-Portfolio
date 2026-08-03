import type { Metadata, Viewport } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import SiteNav from '@/components/SiteNav';
import './globals.css';

/*
  Inter, matching marketplacebeta.com — which runs Inter at 900 for display
  and 700 for headings. One family across display and body, differentiated
  by weight rather than by typeface, which is what makes it read as a
  product rather than as a document.
*/
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

/*
  Mono is now demoted to genuine numerics only — metric values, percentages,
  URLs. It is no longer used for eyebrows or body copy, which is what gave
  the page its dated teletype feel. JetBrains Mono has a taller x-height and
  far less typewriter character than IBM Plex Mono.
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
  title: 'Ryan Dacus — Revenue systems, forecasting, applied AI',
  description:
    'Twenty years in e-commerce revenue, and a working portfolio of the systems I built rather than waited for: AI pipelines, probabilistic forecasting engines, and partner infrastructure.',
  openGraph: {
    title: 'Ryan Dacus',
    description:
      'Revenue leader who ships the systems instead of waiting for them.',
    type: 'website',
  },
};

export const viewport: Viewport = {
  themeColor: '#0b0c14',
  colorScheme: 'dark',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${mono.variable} bg-ink`}
    >
      <body>
        <SiteNav email="ryandacus@gmail.com" />
        {children}
      </body>
    </html>
  );
}

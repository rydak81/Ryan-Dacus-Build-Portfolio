import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'JobSignal — Know which jobs are worth applying to',
    template: '%s · JobSignal',
  },
  description:
    'JobSignal verifies job listings, detects stale and repeatedly reposted positions, and shows you which opportunities are actually worth your time.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

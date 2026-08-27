import Link from 'next/link';

const NAV = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/jobs', label: 'Search' },
  { href: '/saved', label: 'Saved' },
  { href: '/applications', label: 'Applications' },
  { href: '/companies', label: 'Companies' },
  { href: '/profile', label: 'Profile' },
  { href: '/settings', label: 'Settings' },
];

export function AppShell({
  children,
  active,
  demo,
}: {
  children: React.ReactNode;
  active: string;
  demo?: boolean;
}) {
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 border-b border-line bg-surface/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-6 px-4">
          <Link href="/dashboard" className="flex items-center gap-2 font-semibold tracking-tight">
            <span className="flex h-6 w-6 items-center justify-center rounded bg-brand text-xs font-bold text-white">
              JS
            </span>
            JobSignal
          </Link>
          <nav className="flex items-center gap-1 overflow-x-auto text-sm">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-md px-3 py-1.5 whitespace-nowrap ${
                  active === item.href
                    ? 'bg-brand-soft font-medium text-brand'
                    : 'text-ink-2 hover:bg-surface-2 hover:text-ink'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          {demo && (
            <span className="ml-auto hidden rounded-md border border-warn-line bg-warn-soft px-2 py-0.5 text-xs font-medium text-warn sm:inline">
              Demo mode — seeded data
            </span>
          )}
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}

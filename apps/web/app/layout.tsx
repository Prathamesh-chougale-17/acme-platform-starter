import type { Metadata } from 'next';
import { IBM_Plex_Mono, Space_Grotesk } from 'next/font/google';
import Link from 'next/link';

import { canViewOperationalDashboards } from '@acme/auth';
import { APP_NAME } from '@acme/shared';
import '@acme/ui/globals.css';

import { HeaderMenu, type HeaderNavItem } from '@/components/header-menu';
import { QueryProvider } from '@/components/providers/query-provider';
import { getCurrentUser } from '@/lib/auth';

import './globals.css';

const displayFont = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-display',
});

const monoFont = IBM_Plex_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  weight: ['400', '500'],
});

export const metadata: Metadata = {
  title: `${APP_NAME} | Monorepo Starter`,
  description: 'Production-grade monorepo starter with Next.js, Hono, Drizzle, and observability.',
};

const navItems: HeaderNavItem[] = [
  { href: '/', label: 'Overview' },
  { href: '/health', label: 'Health', requiresPrivilege: true },
  { href: '/users', label: 'Users' },
  { href: '/api/v1/docs', label: 'API Docs', kind: 'link' },
];

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const currentUser = await getCurrentUser();
  const visibleNavItems = navItems.filter(
    (item) => !item.requiresPrivilege || canViewOperationalDashboards(currentUser?.role),
  );

  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={`${displayFont.variable} ${monoFont.variable} antialiased`}>
        <QueryProvider>
          <div className="app-shell">
            <div className="ambient ambient-one" />
            <div className="ambient ambient-two" />
            <div className="ambient ambient-three" />
            <header className="shell-header border-b border-white/10">
              <div className="shell-header__inner">
                <Link href="/" className="flex items-center gap-3 text-sm font-semibold text-white">
                  <span className="flex size-11 items-center justify-center rounded-2xl bg-cyan-400 text-slate-950 shadow-[0_12px_40px_rgba(34,211,238,0.35)]">
                    AC
                  </span>
                  <span className="text-base tracking-[0.16em] text-slate-100">{APP_NAME}</span>
                </Link>
                <HeaderMenu currentUser={currentUser} navItems={visibleNavItems} />
              </div>
            </header>
            <main className="shell-main">{children}</main>
          </div>
        </QueryProvider>
      </body>
    </html>
  );
}

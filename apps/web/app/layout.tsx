import type { Metadata, Route } from 'next';
import { IBM_Plex_Mono, Space_Grotesk } from 'next/font/google';
import Link from 'next/link';

import { canViewOperationalDashboards } from '@acme/auth';
import { APP_NAME } from '@acme/shared';
import { Button } from '@acme/ui';
import '@acme/ui/globals.css';

import { OrganizationSwitcher } from '@/components/organization-switcher';
import { SignOutButton } from '@/components/sign-out-button';
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

const navItems: Array<{ href: Route; label: string; requiresPrivilege?: boolean }> = [
  { href: '/', label: 'Overview' },
  { href: '/health', label: 'Health', requiresPrivilege: true },
  { href: '/users', label: 'Users' },
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
            <header className="border-b border-white/10">
              <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-5">
                <Link href="/" className="flex items-center gap-3 text-sm font-semibold text-white">
                  <span className="flex size-10 items-center justify-center rounded-2xl bg-cyan-400 text-slate-950">
                    AC
                  </span>
                  <span>{APP_NAME}</span>
                </Link>
                <nav className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 p-1">
                  {visibleNavItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="rounded-full px-4 py-2 text-sm text-slate-200 transition hover:bg-white/10 hover:text-white"
                    >
                      {item.label}
                    </Link>
                  ))}
                </nav>
                <div className="flex items-center gap-3">
                  {currentUser ? (
                    <>
                      {currentUser.organizations.length > 0 ? (
                        <OrganizationSwitcher
                          organizations={currentUser.organizations}
                          currentOrganizationId={currentUser.organization?.id ?? null}
                          currentOrganizationName={currentUser.organization?.name ?? null}
                        />
                      ) : null}
                      <div className="hidden rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200 md:block">
                        {currentUser.user.email}
                        {currentUser.role ? (
                          <span className="ml-2 text-xs uppercase tracking-[0.2em] text-cyan-300">
                            {currentUser.role}
                          </span>
                        ) : null}
                        {currentUser.organization ? (
                          <span className="ml-2 text-xs text-slate-400">
                            {currentUser.organization.name}
                          </span>
                        ) : currentUser.organizations.length > 0 ? (
                          <span className="ml-2 text-xs text-slate-400">No active workspace</span>
                        ) : null}
                      </div>
                      <SignOutButton />
                    </>
                  ) : (
                    <>
                      <Link href={'/sign-in' as never}>
                        <Button variant="secondary">Sign in</Button>
                      </Link>
                      <Link href={'/sign-up' as never}>
                        <Button>Create account</Button>
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </header>
            <main className="mx-auto w-full max-w-6xl px-6 py-12">{children}</main>
          </div>
        </QueryProvider>
      </body>
    </html>
  );
}

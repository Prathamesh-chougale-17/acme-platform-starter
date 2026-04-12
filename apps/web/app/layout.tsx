import type { Metadata, Route } from 'next';
import { IBM_Plex_Mono, Space_Grotesk } from 'next/font/google';
import Link from 'next/link';

import { APP_NAME } from '@acme/shared';

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

const navItems: Array<{ href: Route; label: string }> = [
  { href: '/', label: 'Overview' },
  { href: '/health', label: 'Health' },
  { href: '/users', label: 'Users' },
];

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${displayFont.variable} ${monoFont.variable} antialiased`}>
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
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="rounded-full px-4 py-2 text-sm text-slate-200 transition hover:bg-white/10 hover:text-white"
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
            </div>
          </header>
          <main className="mx-auto w-full max-w-6xl px-6 py-12">{children}</main>
        </div>
      </body>
    </html>
  );
}

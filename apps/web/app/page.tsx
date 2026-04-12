import type { Route } from 'next';
import Link from 'next/link';

import { Badge, Button, Card, CardDescription, CardTitle } from '@acme/ui';

import { publicEnv } from '@/lib/env';

const platformPillars: Array<{ title: string; description: string; href: Route }> = [
  {
    title: 'Typed frontend',
    description:
      'Next.js 16 App Router with shared contracts, ergonomic data access, and Sentry-ready boundaries.',
    href: '/health',
  },
  {
    title: 'Transport-safe API',
    description:
      'Hono routes stay thin while services and repositories handle validation, persistence, and observability.',
    href: '/users',
  },
  {
    title: 'Local platform ops',
    description:
      'Postgres, Prometheus, Loki, Tempo, Grafana, and an OTel Collector ship together via Docker Compose.',
    href: '/health',
  },
];

export default function HomePage() {
  return (
    <div className="space-y-10">
      <section className="grid gap-6 lg:grid-cols-[1.4fr_0.9fr]">
        <Card className="space-y-6 overflow-hidden">
          <Badge>Production Starter</Badge>
          <div className="space-y-4">
            <h1 className="max-w-3xl text-5xl font-semibold tracking-tight text-white md:text-6xl">
              Build SaaS-grade platforms without rebuilding the foundation every sprint.
            </h1>
            <p className="max-w-2xl text-lg leading-8 text-slate-300">
              Acme Platform ships the opinionated baseline: shared DTOs, observability plumbing,
              database access patterns, and a frontend shell that is ready for real feature work.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/health">
              <Button>Open health dashboard</Button>
            </Link>
            <Link href="/users">
              <Button variant="secondary">Open users workspace</Button>
            </Link>
          </div>
        </Card>
        <Card className="space-y-5">
          <CardTitle>Environment snapshot</CardTitle>
          <CardDescription>
            Safe values surfaced from validated frontend configuration.
          </CardDescription>
          <dl className="space-y-4 text-sm text-slate-200">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <dt className="text-xs uppercase tracking-[0.2em] text-slate-400">App env</dt>
              <dd className="mt-2 text-lg font-medium text-white">
                {publicEnv.NEXT_PUBLIC_APP_ENV}
              </dd>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <dt className="text-xs uppercase tracking-[0.2em] text-slate-400">API base URL</dt>
              <dd className="mt-2 break-all font-mono text-sm text-cyan-300">
                {publicEnv.NEXT_PUBLIC_API_BASE_URL}
              </dd>
            </div>
          </dl>
        </Card>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {platformPillars.map((pillar) => (
          <Card key={pillar.title} className="space-y-4">
            <CardTitle>{pillar.title}</CardTitle>
            <CardDescription>{pillar.description}</CardDescription>
            <Link href={pillar.href} className="text-sm font-semibold text-cyan-300">
              Explore →
            </Link>
          </Card>
        ))}
      </section>
    </div>
  );
}

import type { Route } from 'next';
import Link from 'next/link';

import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Separator,
} from '@acme/ui';

import { publicEnv } from '@/lib/env';

const DEPLOYMENT_API_ROUTE = '/api/v1';

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
        <Card className="overflow-hidden">
          <CardHeader className="gap-5">
            <Badge>Production Starter</Badge>
            <CardTitle className="max-w-3xl text-5xl tracking-tight text-white md:text-6xl">
              Build SaaS-grade platforms without rebuilding the foundation every sprint.
            </CardTitle>
            <CardDescription className="max-w-2xl text-lg leading-8 text-muted-foreground">
              Acme Platform ships the opinionated baseline: shared DTOs, observability plumbing,
              database access patterns, and a frontend shell that is ready for real feature work.
            </CardDescription>
          </CardHeader>
          <CardFooter className="flex flex-wrap gap-3">
            <Link href="/health">
              <Button>Open health dashboard</Button>
            </Link>
            <Link href="/users">
              <Button variant="secondary">Open users workspace</Button>
            </Link>
          </CardFooter>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Environment snapshot</CardTitle>
            <CardDescription>
              Safe values surfaced from validated frontend configuration.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 text-sm text-foreground">
            <div className="rounded-2xl border border-border/80 bg-background/35 p-4">
              <dt className="text-xs uppercase tracking-[0.2em] text-muted-foreground">App env</dt>
              <dd className="mt-2 text-lg font-medium text-white">
                {publicEnv.NEXT_PUBLIC_APP_ENV}
              </dd>
            </div>
            <Separator />
            <div className="rounded-2xl border border-border/80 bg-background/35 p-4">
              <dt className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                API access path
              </dt>
              <dd className="mt-2 break-all font-mono text-sm text-primary">
                {DEPLOYMENT_API_ROUTE}
              </dd>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {platformPillars.map((pillar) => (
          <Card key={pillar.title}>
            <CardHeader>
              <CardTitle>{pillar.title}</CardTitle>
              <CardDescription>{pillar.description}</CardDescription>
            </CardHeader>
            <CardFooter>
              <Link href={pillar.href} className="text-sm font-semibold text-primary">
                Explore →
              </Link>
            </CardFooter>
          </Card>
        ))}
      </section>
    </div>
  );
}

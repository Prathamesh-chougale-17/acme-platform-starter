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
    <div className="space-y-8">
      <section className="hero-panel shell-surface rounded-[2rem] px-6 py-10 md:px-10 md:py-12 lg:min-h-[32rem] lg:px-14 lg:py-14">
        <div className="grid gap-8 lg:min-h-[24rem] lg:grid-cols-[minmax(0,1.45fr)_minmax(22rem,0.8fr)] lg:items-end">
          <div className="relative z-10 flex flex-col justify-between gap-8">
            <div className="space-y-6">
              <Badge className="border-cyan-300/20 bg-cyan-300/10 text-cyan-100">
                Production Starter
              </Badge>
              <div className="space-y-5">
                <p className="text-sm uppercase tracking-[0.35em] text-cyan-200/75">
                  Platform Foundation
                </p>
                <h1 className="max-w-5xl text-5xl tracking-[-0.06em] text-white md:text-7xl lg:text-[5.5rem]">
                  Build internal tools and SaaS surfaces on a canvas that already knows how to
                  scale.
                </h1>
              </div>
              <p className="max-w-3xl text-lg leading-8 text-slate-300 md:text-xl">
                Shared contracts, typed APIs, observability, org-aware auth, and database plumbing
                are already in motion. What remains is the product you actually want to ship.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Link href="/users">
                <Button className="min-w-44">Open users workspace</Button>
              </Link>
              <Link href="/health">
                <Button variant="secondary" className="min-w-44">
                  Inspect health dashboard
                </Button>
              </Link>
            </div>
          </div>

          <div className="grid gap-4 self-stretch lg:grid-rows-[1.2fr_auto]">
            <Card className="shell-surface metric-tile rounded-[1.75rem] border-white/10 bg-white/[0.04]">
              <CardHeader className="gap-4">
                <CardDescription className="text-xs uppercase tracking-[0.3em] text-slate-400">
                  Environment snapshot
                </CardDescription>
                <CardTitle className="text-3xl text-white">
                  {publicEnv.NEXT_PUBLIC_APP_ENV}
                </CardTitle>
                <CardDescription className="max-w-sm text-sm leading-7 text-slate-300">
                  Frontend configuration is already validated and wired to the versioned app
                  surface.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3 text-sm text-slate-200">
                <div className="rounded-[1.25rem] border border-white/10 bg-slate-950/35 p-4">
                  <p className="text-[11px] uppercase tracking-[0.3em] text-slate-400">
                    API access path
                  </p>
                  <p className="mt-3 break-all font-mono text-sm text-cyan-200">
                    {DEPLOYMENT_API_ROUTE}
                  </p>
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              {platformPillars.slice(0, 2).map((pillar) => (
                <Card
                  key={pillar.title}
                  className="shell-surface metric-tile rounded-[1.5rem] border-white/10 bg-white/[0.04]"
                >
                  <CardHeader className="gap-3">
                    <CardDescription className="text-[11px] uppercase tracking-[0.3em] text-slate-400">
                      {pillar.title}
                    </CardDescription>
                    <CardDescription className="text-sm leading-7 text-slate-300">
                      {pillar.description}
                    </CardDescription>
                  </CardHeader>
                  <CardFooter>
                    <Link href={pillar.href} className="text-sm font-semibold text-cyan-200">
                      Explore →
                    </Link>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.1fr_1.1fr_0.8fr]">
        <Card className="shell-surface rounded-[1.75rem] border-white/10 bg-white/[0.04]">
          <CardHeader className="gap-4">
            <CardDescription className="text-xs uppercase tracking-[0.3em] text-slate-400">
              Typed frontend
            </CardDescription>
            <CardTitle className="text-2xl text-white">One contract, fewer seams</CardTitle>
            <CardDescription className="max-w-2xl text-base leading-8 text-slate-300">
              The web app speaks to the versioned Hono layer through shared DTOs, query helpers,
              and a same-origin shell that stays predictable in preview and production.
            </CardDescription>
          </CardHeader>
        </Card>

        <Card className="shell-surface rounded-[1.75rem] border-white/10 bg-white/[0.04]">
          <CardHeader className="gap-4">
            <CardDescription className="text-xs uppercase tracking-[0.3em] text-slate-400">
              Platform ops
            </CardDescription>
            <CardTitle className="text-2xl text-white">Observability is already in frame</CardTitle>
            <CardDescription className="max-w-2xl text-base leading-8 text-slate-300">
              Prometheus, Loki, Tempo, Grafana, and OpenTelemetry are part of the starter, so the
              first real feature ships with real diagnostics instead of placeholders.
            </CardDescription>
          </CardHeader>
        </Card>

        <Card className="shell-surface rounded-[1.75rem] border-white/10 bg-white/[0.04]">
          <CardHeader className="gap-4">
            <CardDescription className="text-xs uppercase tracking-[0.3em] text-slate-400">
              Runtime
            </CardDescription>
            <CardTitle className="text-2xl text-white">Ready for team workflows</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-slate-300">
            <div className="rounded-[1.25rem] border border-white/10 bg-slate-950/35 p-4">
              <p className="text-[11px] uppercase tracking-[0.3em] text-slate-400">Contracts</p>
              <p className="mt-2">Shared across web, API, and auth flows.</p>
            </div>
            <Separator />
            <div className="rounded-[1.25rem] border border-white/10 bg-slate-950/35 p-4">
              <p className="text-[11px] uppercase tracking-[0.3em] text-slate-400">Queues</p>
              <p className="mt-2">Invitation and webhook work can move off the request path.</p>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

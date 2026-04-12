'use client';

import {
  Alert,
  AlertDescription,
  AlertTitle,
  Badge,
  Button,
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Skeleton,
} from '@acme/ui';
import type { HealthDto } from '@acme/shared';

import { useHealthQuery } from '@/lib/queries';

const statusVariants: Record<
  HealthDto['checks']['api']['status'],
  'default' | 'secondary' | 'destructive'
> = {
  up: 'default',
  degraded: 'secondary',
  down: 'destructive',
};

const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : 'Unable to load backend health';

export function HealthDashboard({
  environment,
  apiAccessPath,
}: {
  environment: string;
  apiAccessPath: string;
}) {
  const healthQuery = useHealthQuery();
  const health = healthQuery.data;
  const hasBlockingError = healthQuery.isError && !health;
  const requestState = healthQuery.isPending
    ? 'Loading latest health payload'
    : hasBlockingError
      ? 'Failed to load payload'
      : healthQuery.isFetching
        ? 'Refreshing payload'
        : 'Live data loaded';

  return (
    <div className="space-y-8">
      <div className="flex items-end justify-between gap-4">
        <div className="space-y-3">
          <Badge>Health Dashboard</Badge>
          <h1 className="text-4xl font-semibold tracking-tight text-white">
            Platform telemetry view
          </h1>
          <p className="max-w-3xl text-base leading-7 text-slate-300">
            Inspect the API health contract, confirm environment wiring, and verify that local
            observability is ready before feature work starts.
          </p>
        </div>
        <Button variant="secondary" onClick={() => void healthQuery.refetch()}>
          {healthQuery.isFetching && !healthQuery.isPending ? 'Refreshing...' : 'Refresh'}
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Frontend env</CardTitle>
            <CardDescription>{environment}</CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Backend access path</CardTitle>
            <CardDescription className="font-mono text-primary">{apiAccessPath}</CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Request state</CardTitle>
            <CardDescription>{requestState}</CardDescription>
          </CardHeader>
        </Card>
      </div>

      {healthQuery.isPending ? (
        <div className="grid gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Card key={index}>
              <CardHeader>
                <Skeleton className="h-5 w-28" />
                <Skeleton className="h-4 w-48" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : hasBlockingError ? (
        <Alert variant="destructive">
          <AlertTitle>Backend unavailable</AlertTitle>
          <AlertDescription>{getErrorMessage(healthQuery.error)}</AlertDescription>
        </Alert>
      ) : health ? (
        <div className="grid gap-4 md:grid-cols-3">
          {Object.entries(health.checks).map(([key, value]) => (
            <Card key={key}>
              <CardHeader>
                <CardTitle className="capitalize">{key}</CardTitle>
                <CardAction>
                  <Badge variant={statusVariants[value.status]}>{value.status}</Badge>
                </CardAction>
                <CardDescription>{value.detail}</CardDescription>
              </CardHeader>
            </Card>
          ))}
          <Card className="md:col-span-3">
            <CardHeader>
              <CardTitle>Backend payload</CardTitle>
              <CardDescription>
                {health.service} • version {health.version} • uptime {health.uptimeSeconds}s
              </CardDescription>
            </CardHeader>
            <CardContent>
              <pre className="overflow-auto rounded-2xl border border-border/80 bg-background/35 p-4 text-xs text-foreground">
                {JSON.stringify(health, null, 2)}
              </pre>
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  );
}

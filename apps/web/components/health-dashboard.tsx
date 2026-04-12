'use client';

import { useEffect, useEffectEvent, useState } from 'react';

import { Badge, Button, Card, CardDescription, CardTitle } from '@acme/ui';
import type { HealthDto } from '@acme/shared';

import { apiClient } from '@/lib/api-client';

const statusClasses: Record<HealthDto['checks']['api']['status'], string> = {
  up: 'bg-emerald-400',
  degraded: 'bg-amber-400',
  down: 'bg-rose-400',
};

export function HealthDashboard({
  environment,
  apiBaseUrl,
}: {
  environment: string;
  apiBaseUrl: string;
}) {
  const [health, setHealth] = useState<HealthDto | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshHealth = useEffectEvent(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const next = await apiClient.getHealth();
      setHealth(next);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Unable to load backend health');
    } finally {
      setIsLoading(false);
    }
  });

  useEffect(() => {
    void refreshHealth();
  }, [refreshHealth]);

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
        <Button variant="secondary" onClick={() => void refreshHealth()}>
          Refresh
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="space-y-3">
          <CardTitle>Frontend env</CardTitle>
          <CardDescription>{environment}</CardDescription>
        </Card>
        <Card className="space-y-3">
          <CardTitle>Backend base URL</CardTitle>
          <CardDescription className="font-mono text-cyan-300">{apiBaseUrl}</CardDescription>
        </Card>
        <Card className="space-y-3">
          <CardTitle>Request state</CardTitle>
          <CardDescription>
            {isLoading
              ? 'Loading latest health payload'
              : error
                ? 'Failed to load payload'
                : 'Live data loaded'}
          </CardDescription>
        </Card>
      </div>

      {isLoading ? (
        <Card className="h-60 animate-pulse bg-white/5" />
      ) : error ? (
        <Card className="space-y-3 border-rose-400/30">
          <CardTitle>Backend unavailable</CardTitle>
          <CardDescription>{error}</CardDescription>
        </Card>
      ) : health ? (
        <div className="grid gap-4 md:grid-cols-3">
          {Object.entries(health.checks).map(([key, value]) => (
            <Card key={key} className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <CardTitle className="capitalize">{key}</CardTitle>
                <span
                  className={`inline-flex size-3 rounded-full ${statusClasses[value.status]}`}
                />
              </div>
              <CardDescription>{value.detail}</CardDescription>
            </Card>
          ))}
          <Card className="space-y-3 md:col-span-3">
            <CardTitle>Backend payload</CardTitle>
            <CardDescription>
              {health.service} • version {health.version} • uptime {health.uptimeSeconds}s
            </CardDescription>
            <pre className="overflow-auto rounded-2xl border border-white/10 bg-slate-950/80 p-4 text-xs text-slate-200">
              {JSON.stringify(health, null, 2)}
            </pre>
          </Card>
        </div>
      ) : null}
    </div>
  );
}

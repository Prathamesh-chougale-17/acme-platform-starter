'use client';

import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';

import { Button, Card, CardDescription, CardTitle } from '@acme/ui';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-2xl items-center justify-center px-6">
      <Card className="w-full space-y-4">
        <CardTitle>Something went wrong</CardTitle>
        <CardDescription>
          The web app hit an unexpected error while rendering this page. The failure is safe to
          retry and, when configured, will be captured by Sentry.
        </CardDescription>
        <Button onClick={reset}>Try again</Button>
      </Card>
    </div>
  );
}

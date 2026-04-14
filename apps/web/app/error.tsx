'use client';

import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';

import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@acme/ui';

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
    <div className="flex min-h-[60vh] w-full items-center justify-center">
      <Card className="shell-surface w-full rounded-[1.75rem] border-white/10 bg-white/[0.04]">
        <CardHeader>
          <CardTitle>Something went wrong</CardTitle>
          <CardDescription>
            The web app hit an unexpected error while rendering this page. The failure is safe to
            retry and, when configured, will be captured by Sentry.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Resetting will re-run the current route and fetch the latest server state.
        </CardContent>
        <CardFooter>
          <Button onClick={reset}>Try again</Button>
        </CardFooter>
      </Card>
    </div>
  );
}

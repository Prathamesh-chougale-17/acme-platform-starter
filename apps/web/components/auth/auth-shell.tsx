import Link from 'next/link';

import { APP_NAME } from '@acme/shared';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Separator } from '@acme/ui';

export function AuthShell({
  eyebrow,
  title,
  description,
  alternateHref,
  alternateLabel,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  alternateHref?: string;
  alternateLabel?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[0.95fr_1.15fr]">
      <Card>
        <CardHeader className="gap-4">
          <p className="text-xs uppercase tracking-[0.2em] text-primary">{eyebrow}</p>
          <CardTitle className="text-4xl tracking-tight text-white">{title}</CardTitle>
          <CardDescription className="text-base leading-7 text-muted-foreground">
            {description}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          <div className="rounded-3xl border border-border/80 bg-background/35 p-5 text-sm text-muted-foreground">
            <p className="font-semibold text-white">{APP_NAME}</p>
            <p className="mt-2">
              Database-backed sessions, organization RBAC, typed contracts, and the same auth system
              shared between Next.js and Hono.
            </p>
          </div>
          {alternateHref && alternateLabel ? (
            <>
              <Separator />
              <Link href={alternateHref as never} className="text-sm font-semibold text-primary">
                {alternateLabel}
              </Link>
            </>
          ) : null}
        </CardContent>
      </Card>
      <Card>
        <CardContent className="flex flex-col gap-5">{children}</CardContent>
      </Card>
    </div>
  );
}

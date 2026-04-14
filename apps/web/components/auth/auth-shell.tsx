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
    <div className="grid gap-6 xl:grid-cols-[minmax(20rem,0.95fr)_minmax(0,1.2fr)]">
      <Card className="shell-surface rounded-[1.75rem] border-white/10 bg-white/[0.04]">
        <CardHeader className="gap-4">
          <p className="text-xs uppercase tracking-[0.2em] text-primary">{eyebrow}</p>
          <CardTitle className="text-4xl tracking-tight text-white md:text-5xl">{title}</CardTitle>
          <CardDescription className="max-w-xl text-base leading-8 text-muted-foreground">
            {description}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          <div className="rounded-[1.5rem] border border-white/10 bg-slate-950/35 p-6 text-sm text-muted-foreground">
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
      <Card className="shell-surface rounded-[1.75rem] border-white/10 bg-white/[0.04]">
        <CardContent className="flex min-h-full flex-col gap-5 p-6 md:p-8">{children}</CardContent>
      </Card>
    </div>
  );
}

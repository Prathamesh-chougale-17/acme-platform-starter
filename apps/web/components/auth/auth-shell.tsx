import Link from 'next/link';

import { APP_NAME } from '@acme/shared';
import { Card } from '@acme/ui';

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
      <Card className="space-y-5">
        <p className="text-xs uppercase tracking-[0.2em] text-cyan-300">{eyebrow}</p>
        <h1 className="text-4xl font-semibold tracking-tight text-white">{title}</h1>
        <p className="text-base leading-7 text-slate-300">{description}</p>
        <div className="rounded-3xl border border-white/10 bg-white/5 p-5 text-sm text-slate-300">
          <p className="font-semibold text-white">{APP_NAME}</p>
          <p className="mt-2">
            Database-backed sessions, organization RBAC, typed contracts, and the same auth system
            shared between Next.js and Hono.
          </p>
        </div>
        {alternateHref && alternateLabel ? (
          <Link href={alternateHref as never} className="text-sm font-semibold text-cyan-300">
            {alternateLabel}
          </Link>
        ) : null}
      </Card>
      <Card className="space-y-5">{children}</Card>
    </div>
  );
}

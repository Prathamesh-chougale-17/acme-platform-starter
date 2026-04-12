import type { HTMLAttributes } from 'react';

import { cn } from './cn';

export const Card = ({ className, ...props }: HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      'rounded-3xl border border-white/10 bg-slate-950/60 p-6 shadow-[0_30px_80px_-40px_rgba(56,189,248,0.5)] backdrop-blur',
      className,
    )}
    {...(props as Record<string, unknown>)}
  />
);

export const CardTitle = ({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) => (
  <h2
    className={cn('text-xl font-semibold tracking-tight text-slate-50', className)}
    {...(props as Record<string, unknown>)}
  />
);

export const CardDescription = ({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) => (
  <p
    className={cn('text-sm leading-6 text-slate-300', className)}
    {...(props as Record<string, unknown>)}
  />
);

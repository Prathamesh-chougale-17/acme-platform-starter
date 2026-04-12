import type { HTMLAttributes } from 'react';

import { cn } from './cn';

export const Badge = ({ className, ...props }: HTMLAttributes<HTMLSpanElement>) => (
  <span
    className={cn(
      'inline-flex items-center rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-slate-200',
      className,
    )}
    {...(props as Record<string, unknown>)}
  />
);

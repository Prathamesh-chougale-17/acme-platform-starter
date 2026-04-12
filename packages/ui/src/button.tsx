import { forwardRef, type ButtonHTMLAttributes } from 'react';

import { cn } from './cn';

const buttonVariants = {
  primary:
    'bg-cyan-400 text-slate-950 shadow-lg shadow-cyan-500/20 hover:bg-cyan-300 focus-visible:ring-cyan-300',
  secondary:
    'bg-white/10 text-slate-100 ring-1 ring-inset ring-white/10 hover:bg-white/15 focus-visible:ring-white/40',
};

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof buttonVariants;
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        'inline-flex min-h-11 items-center justify-center rounded-full px-5 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 disabled:cursor-not-allowed disabled:opacity-60',
        buttonVariants[variant],
        className,
      )}
      {...(props as Record<string, unknown>)}
    />
  ),
);

Button.displayName = 'Button';

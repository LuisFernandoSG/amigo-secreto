import { forwardRef } from 'react';
import clsx from 'clsx';

const baseStyles =
  'inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold tracking-wide transition focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60';

const variants = {
  primary:
    'bg-brand-500 text-white shadow-lg shadow-brand-900/30 hover:bg-brand-400 focus-visible:ring-4 focus-visible:ring-brand-200/60',
  secondary:
    'bg-pine-600 text-white shadow-lg shadow-pine-900/40 hover:bg-pine-500 focus-visible:ring-4 focus-visible:ring-pine-200/60',
  danger:
    'bg-brand-800 text-white shadow-lg shadow-brand-950/40 hover:bg-brand-700 focus-visible:ring-4 focus-visible:ring-brand-200/60',
  ghost: 'text-white/80 hover:text-white hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-white/40'
};

export const Button = forwardRef(({ className, as: Component = 'button', variant = 'primary', ...props }, ref) => (
  <Component ref={ref} className={clsx(baseStyles, variants[variant], className)} {...props} />
));

Button.displayName = 'Button';

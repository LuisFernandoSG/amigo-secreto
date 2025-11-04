import { forwardRef } from 'react';
import clsx from 'clsx';

const baseStyles =
  'inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 font-semibold transition focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60';

const variants = {
  primary:
    'bg-brand-500 text-white shadow-lg shadow-brand-500/30 hover:bg-brand-400 focus-visible:ring-4 focus-visible:ring-brand-300/40',
  secondary:
    'bg-white/10 text-white hover:bg-white/15 focus-visible:ring-4 focus-visible:ring-white/20',
  ghost: 'text-brand-200 hover:text-white hover:bg-white/5 focus-visible:ring-2 focus-visible:ring-brand-300/50'
};

export const Button = forwardRef(({ className, as: Component = 'button', variant = 'primary', ...props }, ref) => (
  <Component ref={ref} className={clsx(baseStyles, variants[variant], className)} {...props} />
));

Button.displayName = 'Button';

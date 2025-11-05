import { forwardRef } from 'react';
import clsx from 'clsx';

const baseStyles =
  'inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold tracking-wide transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-holly-200/60 disabled:cursor-not-allowed disabled:opacity-60';

const variants = {
  primary: 'bg-berry-500 text-white shadow-sm shadow-berry-200/60 hover:bg-berry-400',
  secondary: 'bg-holly-500 text-white shadow-sm shadow-holly-200/70 hover:bg-holly-400',
  subtle: 'bg-white text-moss-900 shadow-sm hover:bg-snow-100',
  danger: 'bg-berry-700 text-white shadow-sm shadow-berry-200/80 hover:bg-berry-600',
  ghost: 'text-moss-700 hover:bg-snow-100'
};

export const Button = forwardRef(({ className, as: Component = 'button', variant = 'primary', ...props }, ref) => (
  <Component ref={ref} className={clsx(baseStyles, variants[variant], className)} {...props} />
));

Button.displayName = 'Button';
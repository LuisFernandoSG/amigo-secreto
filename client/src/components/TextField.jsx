import { forwardRef } from 'react';
import clsx from 'clsx';

export const TextField = forwardRef(({ label, helperText, error, className, ...props }, ref) => (
  <label className={clsx('flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-white/75', className)}>
    <span>{label}</span>
    <input
      ref={ref}
      className={clsx(
        'w-full rounded-2xl border border-white/20 bg-white/5 px-4 py-3 text-base text-white placeholder:text-white/50 focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-200/50',
        error && 'border-brand-400 focus:border-brand-400 focus:ring-brand-400/40'
      )}
      {...props}
    />
    {helperText ? <span className="text-[11px] font-normal text-white/70">{helperText}</span> : null}
    {error ? <span className="text-[11px] font-normal text-brand-200">{error}</span> : null}
  </label>
));

TextField.displayName = 'TextField';

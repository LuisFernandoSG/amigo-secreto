import { forwardRef } from 'react';
import clsx from 'clsx';

export const TextField = forwardRef(({ label, helperText, error, className, ...props }, ref) => (
  <label className={clsx('flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-moss-600', className)}>
    <span>{label}</span>
    <input
      ref={ref}
      className={clsx(
        'w-full rounded-2xl border border-holly-100 bg-white/90 px-4 py-3 text-base text-moss-900 placeholder:text-moss-400 shadow-sm focus:border-holly-400 focus:outline-none focus:ring-2 focus:ring-holly-200/70',
        error && 'border-berry-400 focus:border-berry-400 focus:ring-berry-200/60'
      )}
      {...props}
    />
    {helperText ? <span className="text-[11px] font-normal text-moss-500">{helperText}</span> : null}
    {error ? <span className="text-[11px] font-normal text-berry-500">{error}</span> : null}
  </label>
));

TextField.displayName = 'TextField';
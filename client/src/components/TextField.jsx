import { forwardRef } from 'react';
import clsx from 'clsx';

export const TextField = forwardRef(({ label, helperText, error, className, ...props }, ref) => (
  <label className={clsx('flex flex-col gap-1 text-sm font-medium text-slate-200', className)}>
    <span>{label}</span>
    <input
      ref={ref}
      className={clsx(
        'w-full rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-base text-white placeholder:text-white/40 focus:border-brand-400 focus:outline-none',
        error && 'border-red-400 focus:border-red-400'
      )}
      {...props}
    />
    {helperText ? <span className="text-xs font-normal text-slate-400">{helperText}</span> : null}
    {error ? <span className="text-xs font-normal text-red-300">{error}</span> : null}
  </label>
));

TextField.displayName = 'TextField';

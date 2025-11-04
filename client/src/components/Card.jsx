import clsx from 'clsx';

export const Card = ({ title, description, actions, children, className }) => (
  <section
    className={clsx(
      'flex w-full flex-col gap-4 rounded-2xl border border-white/10 bg-white/5 p-6 shadow-lg shadow-black/30 backdrop-blur',
      className
    )}
  >
    <header className="flex flex-col gap-2">
      {title ? <h2 className="text-xl font-semibold text-white">{title}</h2> : null}
      {description ? <p className="text-sm text-slate-300">{description}</p> : null}
    </header>
    <div className="flex flex-col gap-4">{children}</div>
    {actions ? <footer className="flex flex-wrap gap-2">{actions}</footer> : null}
  </section>
);

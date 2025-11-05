import clsx from 'clsx';

export const Card = ({ title, description, actions, children, className }) => (
  <section
    className={clsx(
      'relative flex w-full flex-col gap-4 overflow-hidden rounded-3xl border border-snow-200 bg-white/80 p-6 text-moss-900 shadow-lg shadow-snow-200/70 backdrop-blur-sm',
      className
    )}
  >
    <div
      aria-hidden
      className="pointer-events-none absolute -top-16 right-0 h-32 w-32 rounded-full bg-gradient-to-br from-berry-100/70 to-transparent"
    />
    <div
      aria-hidden
      className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-white to-transparent"
    />
    <div className="relative flex flex-col gap-4">
      {(title || description) && (
        <header className="flex flex-col gap-1">
          {title ? <h2 className="text-lg font-semibold text-moss-900">{title}</h2> : null}
          {description ? <p className="text-sm text-moss-600">{description}</p> : null}
        </header>
      )}
      <div className="flex flex-col gap-4">{children}</div>
      {actions ? <footer className="flex flex-wrap gap-2">{actions}</footer> : null}
    </div>
  </section>
);
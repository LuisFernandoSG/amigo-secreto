import clsx from 'clsx';
import { Button } from './Button.jsx';

const isAmazonLink = (url = '') => /amazon\./i.test(url);

export const WishlistItem = ({ item, onRemove }) => {
  const amazonLink = isAmazonLink(item.url);

  return (
    <article className="relative flex flex-col gap-3 overflow-hidden rounded-2xl border border-snow-200 bg-white/90 p-4 shadow-sm shadow-snow-300/70">
      <div
        aria-hidden
        className="pointer-events-none absolute -left-12 top-0 h-24 w-24 rounded-full bg-gradient-to-br from-berry-100/60 to-transparent"
      />
      <div className="relative flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h4 className="text-base font-semibold text-moss-900">{item.title}</h4>
          {item.note ? <p className="text-sm text-moss-600">{item.note}</p> : null}
        </div>
        {onRemove ? (
          <Button variant="ghost" onClick={() => onRemove(item.id)} className="text-xs uppercase tracking-wide">
            Quitar
          </Button>
        ) : null}
      </div>
      <a
        className={clsx(
          'relative inline-flex w-max items-center gap-2 rounded-full px-3 py-1 text-sm font-semibold transition',
          amazonLink ? 'bg-berry-100 text-berry-700 hover:bg-berry-200' : 'bg-holly-100 text-holly-700 hover:bg-holly-200'
        )}
        href={item.url}
        target="_blank"
        rel="noreferrer"
      >
        {amazonLink ? 'Ver en Amazon' : 'Ver producto'}
        <span aria-hidden>↗</span>
      </a>
      {/* {item.imageUrl ? (
        <img
          src={item.imageUrl}
          alt={item.title}
          className="h-32 w-full rounded-xl object-cover shadow-inner shadow-snow-300"
          loading="lazy"
          referrerPolicy="no-referrer"
        />
      ) : (
        <div className="flex h-32 w-full items-center justify-center rounded-xl border border-dashed border-holly-200/70 bg-snow-50 text-4xl">
          🎁
        </div>
      )} */}
    </article>
  );
};
import { Button } from './Button.jsx';

export const WishlistItem = ({ item, onRemove }) => (
  <article className="relative flex flex-col gap-3 overflow-hidden rounded-2xl border border-white/20 bg-white/10 p-4 shadow-[0_10px_30px_-20px_rgba(0,0,0,0.75)]">
    <div
      aria-hidden
      className="pointer-events-none absolute -left-12 top-0 h-24 w-24 rounded-full bg-gradient-to-br from-pine-300/25 to-transparent"
    />
    <div className="relative flex items-start justify-between gap-3">
      <div>
        <h4 className="text-base font-semibold text-white">{item.title}</h4>
        {item.note ? <p className="text-sm text-white/80">{item.note}</p> : null}
      </div>
      {onRemove ? (
        <Button variant="ghost" onClick={() => onRemove(item.id)} className="text-xs uppercase tracking-wide">
          Quitar
        </Button>
      ) : null}
    </div>
    <a
      className="relative inline-flex w-max items-center gap-2 rounded-full bg-brand-500/15 px-3 py-1 text-sm font-semibold text-brand-100 transition hover:bg-brand-500/25"
      href={item.url}
      target="_blank"
      rel="noreferrer"
    >
      Ver en Amazon
      <span aria-hidden>↗</span>
    </a>
    {item.imageUrl ? (
      <img src={item.imageUrl} alt={item.title} className="h-32 w-full rounded-xl object-cover shadow-inner shadow-black/30" />
    ) : null}
  </article>
);

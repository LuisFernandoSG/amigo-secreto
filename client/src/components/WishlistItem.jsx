import { Button } from './Button.jsx';

export const WishlistItem = ({ item, onRemove }) => (
  <article className="flex flex-col gap-3 rounded-xl border border-white/10 bg-white/5 p-4">
    <div className="flex items-start justify-between gap-3">
      <div>
        <h4 className="text-lg font-semibold text-white">{item.title}</h4>
        {item.note ? <p className="text-sm text-slate-300">{item.note}</p> : null}
      </div>
      {onRemove ? (
        <Button variant="ghost" onClick={() => onRemove(item._id)} className="text-sm">
          Quitar
        </Button>
      ) : null}
    </div>
    <a
      className="inline-flex items-center gap-2 text-sm font-semibold text-brand-200 hover:text-brand-100"
      href={item.url}
      target="_blank"
      rel="noreferrer"
    >
      Ver en Amazon
      <span aria-hidden>↗</span>
    </a>
    {item.imageUrl ? (
      <img src={item.imageUrl} alt={item.title} className="h-32 w-full rounded-lg object-cover" />
    ) : null}
  </article>
);

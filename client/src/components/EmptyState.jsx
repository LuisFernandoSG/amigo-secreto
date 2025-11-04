export const EmptyState = ({ title, message, icon }) => (
  <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-white/10 bg-white/5 p-6 text-center text-slate-300">
    {icon ? <div className="text-4xl">{icon}</div> : null}
    <h3 className="text-lg font-semibold text-white">{title}</h3>
    <p className="text-sm text-slate-400">{message}</p>
  </div>
);

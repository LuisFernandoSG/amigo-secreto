export const EmptyState = ({ title, message, icon }) => (
  <div className="flex flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-white/40 bg-white/5 p-6 text-center text-white/80">
    {icon ? <div className="text-4xl">{icon}</div> : null}
    <h3 className="text-base font-semibold text-white">{title}</h3>
    <p className="text-sm text-white/70">{message}</p>
  </div>
);

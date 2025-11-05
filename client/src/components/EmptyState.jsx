export const EmptyState = ({ title, message, icon }) => (
  <div className="flex flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-holly-200/60 bg-snow-50/80 p-6 text-center text-moss-600">
    {icon ? <div className="text-4xl">{icon}</div> : null}
    <h3 className="text-base font-semibold text-moss-800">{title}</h3>
    <p className="text-sm text-moss-600">{message}</p>
  </div>
);
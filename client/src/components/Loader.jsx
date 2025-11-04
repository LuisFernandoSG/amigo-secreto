export const Loader = ({ label = 'Cargando…' }) => (
  <div className="flex items-center justify-center gap-3 text-sm text-slate-300">
    <svg className="h-5 w-5 animate-spin text-brand-300" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-10" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-80"
        d="M4 12a8 8 0 018-8"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
      />
    </svg>
    <span>{label}</span>
  </div>
);

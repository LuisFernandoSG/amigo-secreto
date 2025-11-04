import { Button } from '../components/Button.jsx';

export const NotFoundPage = () => (
  <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center text-slate-300">
    <span className="text-6xl">🎅</span>
    <h2 className="text-3xl font-semibold text-white">Esta página se fue de vacaciones</h2>
    <p className="max-w-md text-sm">
      Parece que el enlace que abriste ya no existe. Revisa el código del grupo o vuelve al inicio para crear uno nuevo.
    </p>
    <Button as="a" href="/" className="mt-2">
      Volver al inicio
    </Button>
  </div>
);

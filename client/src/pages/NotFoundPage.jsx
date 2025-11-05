import { Button } from '../components/Button.jsx';

export const NotFoundPage = () => (
  <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center text-moss-600">
    <span className="text-6xl">🎅</span>
    <h2 className="text-2xl font-semibold text-moss-900">Esta página se fue de vacaciones</h2>
    <p className="max-w-md text-sm text-moss-600">
      Parece que el enlace que abriste ya no existe. Revisa el código del grupo o vuelve al inicio para crear uno nuevo.
    </p>
    <Button as="a" href="/" className="mt-2">
      Volver al inicio
    </Button>
  </div>
);
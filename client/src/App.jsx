import { Navigate, Route, Routes } from 'react-router-dom';
import { LandingPage } from './pages/LandingPage.jsx';
import { GroupHostPage } from './pages/GroupHostPage.jsx';
import { ParticipantPage } from './pages/ParticipantPage.jsx';
import { NotFoundPage } from './pages/NotFoundPage.jsx';

const Layout = ({ children }) => (
  <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-[#04140d] via-[#0b2318] to-[#041009] text-white">
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0"
      style={{
        backgroundImage:
          'radial-gradient(circle at 20% 20%, rgba(255,255,255,0.18), transparent 55%), radial-gradient(circle at 80% 10%, rgba(248,113,113,0.16), transparent 50%), radial-gradient(circle at 50% 90%, rgba(74,222,128,0.2), transparent 55%)'
      }}
    />
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 opacity-30 mix-blend-screen"
      style={{
        backgroundImage: 'radial-gradient(rgba(255,255,255,0.3) 1px, transparent 1px)',
        backgroundSize: '26px 26px'
      }}
    />
    <div className="relative mx-auto flex min-h-screen w-full max-w-3xl flex-col px-4 py-8 sm:px-6">
      <header className="relative z-10 mb-6 flex flex-col items-center gap-3 text-center">
        <div className="flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.35em] text-white/80">
          <span aria-hidden>🎅</span>
          <span>Intercambio navideño</span>
        </div>
        <h1 className="text-3xl font-extrabold leading-tight text-white drop-shadow-[0_0_20px_rgba(248,113,113,0.35)] sm:text-4xl">
          Navidad entre amigos
        </h1>
        <p className="max-w-xl text-sm text-white/80">
          Organiza el intercambio, comparte listas de deseos y mantén la magia de la sorpresa desde cualquier celular.
        </p>
      </header>
      <main className="relative z-10 flex flex-1 flex-col gap-6 pb-12">{children}</main>
      <footer className="relative z-10 mt-6 text-center text-xs text-white/65">
        Hecho con cariño navideño 🎁
      </footer>
    </div>
  </div>
);

const App = () => (
  <Layout>
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/grupos/:code" element={<GroupHostPage />} />
      <Route path="/grupos/:code/participantes/:participantId" element={<ParticipantPage />} />
      <Route path="/404" element={<NotFoundPage />} />
      <Route path="*" element={<Navigate to="/404" replace />} />
    </Routes>
  </Layout>
);

export default App;

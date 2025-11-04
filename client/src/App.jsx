import { Navigate, Route, Routes } from 'react-router-dom';
import { LandingPage } from './pages/LandingPage.jsx';
import { GroupHostPage } from './pages/GroupHostPage.jsx';
import { ParticipantPage } from './pages/ParticipantPage.jsx';
import { NotFoundPage } from './pages/NotFoundPage.jsx';

const Layout = ({ children }) => (
  <div className="flex min-h-screen flex-col bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white">
    <header className="border-b border-white/5 bg-slate-950/80">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
        <div className="flex flex-col">
          <span className="text-sm uppercase tracking-widest text-brand-300">Navidad entre Amigos</span>
          <h1 className="text-xl font-bold">Intercambios mágicos sin complicaciones</h1>
        </div>
        <img src="https://em-content.zobj.net/source/telegram/358/christmas-tree_1f384.png" alt="Arbolito" className="h-12 w-12" />
      </div>
    </header>
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-6 py-10">{children}</main>
    <footer className="border-t border-white/5 bg-slate-950/60">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-6 py-6 text-sm text-slate-400 sm:flex-row sm:items-center sm:justify-between">
        <span>Construido con React + Tailwind + MongoDB</span>
        <span>Comparte la magia 🎁</span>
      </div>
    </footer>
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

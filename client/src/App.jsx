import { Navigate, Route, Routes } from 'react-router-dom';
import { LandingPage } from './pages/LandingPage.jsx';
import { GroupHostPage } from './pages/GroupHostPage.jsx';
import { ParticipantPage } from './pages/ParticipantPage.jsx';
import { NotFoundPage } from './pages/NotFoundPage.jsx';

const Layout = ({ children }) => (
  <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-snow-50 via-white to-holly-50 text-moss-900">
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 opacity-70"
      style={{
        backgroundImage:
          'radial-gradient(circle at 10% 10%, rgba(255,182,193,0.25), transparent 55%), radial-gradient(circle at 85% 15%, rgba(148,190,143,0.3), transparent 50%), radial-gradient(circle at 15% 80%, rgba(255,212,150,0.25), transparent 60%)'
      }}
    />
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0"
      style={{
        backgroundImage:
          'url("data:image/svg+xml,%3Csvg width=\'160\' height=\'160\' viewBox=\'0 0 160 160\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'%23e0f4e5\' fill-opacity=\'0.35\'%3E%3Ccircle cx=\'10\' cy=\'10\' r=\'2\'/%3E%3Ccircle cx=\'90\' cy=\'50\' r=\'2\'/%3E%3Ccircle cx=\'140\' cy=\'120\' r=\'2\'/%3E%3C/g%3E%3C/svg%3E")',
        backgroundSize: '160px 160px'
      }}
    />
    <div className="relative mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-6 px-4 pb-12 pt-10 sm:px-6">
      <header className="relative z-10 flex flex-col items-center gap-4 text-center">
        <div className="flex items-center gap-2 rounded-full bg-white/70 px-4 py-1 text-[11px] font-semibold uppercase tracking-[0.32em] text-holly-600 shadow-sm">
          <span aria-hidden>🎄</span>
          <span>Intercambio navideño</span>
        </div>
        <h1 className="text-3xl font-black leading-tight text-moss-900 sm:text-4xl">NAVIDAD EN FAMILIA</h1>
        <p className="max-w-2xl text-sm text-moss-700 sm:text-base">
          Organiza, comparte y sorprende con una experiencia pensada para celulares: listas privadas, deseos inspiradores y muchos destellos navideños.
        </p>
      </header>
      <main className="relative z-10 flex flex-1 flex-col gap-8 pb-6">{children}</main>
      <footer className="relative z-10 mt-auto text-center text-xs text-moss-600">
        Hecho con cariño navideño 🎁
      </footer>
      <div className="pointer-events-none absolute -left-14 top-20 hidden h-44 w-44 rounded-full bg-gradient-to-br from-berry-200 via-berry-100 to-transparent opacity-70 sm:block" />
      <div className="pointer-events-none absolute -right-10 bottom-16 hidden h-36 w-36 rounded-full bg-gradient-to-tr from-holly-200 via-white to-transparent opacity-80 sm:block" />
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
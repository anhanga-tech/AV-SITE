import React, { Suspense, lazy } from 'react';
import { LazyMotion, domAnimation } from 'framer-motion';
import { BrowserRouter, MemoryRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/react';
import Header from './components/Header';
import Footer from './components/Footer';
import AIChat from './components/AIChat';
import ContactModal from './components/ContactModal';
import { ClientOnly } from './components/ClientOnly';
import ScrollToTop from './components/ScrollToTop';
import BackToTop from './components/ui/BackToTop';
import { HeadContext, type HeadManager } from './lib/head';

// Pages
import Home from './pages/Home';
const BlogList = lazy(() => import('./pages/BlogList'));
const BlogPost = lazy(() => import('./pages/BlogPost'));
const BlogRedirect = lazy(() => import('./pages/BlogRedirect'));
const Terms = lazy(() => import('./pages/Terms'));
const Privacy = lazy(() => import('./pages/Privacy'));
const About = lazy(() => import('./pages/About'));
const SiteMap = lazy(() => import('./pages/SiteMap'));
const NotFound = lazy(() => import('./pages/NotFound'));
const BetoCarreroLanding = lazy(() => import('./pages/landings/BetoCarreroLanding'));
const LollapaloozaLanding = lazy(() => import('./pages/landings/LollapaloozaLanding'));
const OrlandoLanding = lazy(() => import('./pages/landings/OrlandoLanding'));
const MelhorIdadeLanding = lazy(() => import('./pages/landings/MelhorIdadeLanding'));
const BrazilPromotionDayLanding = lazy(() => import('./pages/landings/BrazilPromotionDayLanding'));
const ConsultoriaDeViagemLanding = lazy(() => import('./pages/landings/ConsultoriaDeViagemLanding'));
const ViagensParaExecutivosLanding = lazy(() => import('./pages/landings/ViagensParaExecutivosLanding'));
const CuradoriaCruzeirosBrasilLanding = lazy(() => import('./pages/landings/CuradoriaCruzeirosBrasilLanding'));
const KeystaticPage = lazy(() => import('./pages/KeystaticPage'));
const NPS = lazy(() => import('./pages/NPS'));
const QuizAnhangaLanding = lazy(() => import('./pages/landings/QuizAnhangaLanding'));

const MainRouteFallback: React.FC = () => <section className="min-h-[40vh] bg-white" aria-hidden="true" />;
const LandingRouteFallback: React.FC = () => <div className="min-h-screen bg-white" aria-hidden="true" />;

const ClientFeatures: React.FC = () => (
  <ClientOnly>
    <AIChat />
    <ContactModal />
    <BackToTop />
    <Analytics />
    <SpeedInsights />
  </ClientOnly>
);

const MainSiteShell: React.FC = () => {
  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Header />
      <main id="main-content" className="flex-grow">
        <Suspense fallback={<MainRouteFallback />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/blog" element={<BlogList />} />
            <Route path="/blog/:slug" element={<BlogPost />} />
            <Route path="/old-blog" element={<BlogRedirect />} />
            <Route path="/old-blog/:slug" element={<BlogRedirect />} />
            <Route path="/termos-de-uso" element={<Terms />} />
            <Route path="/politica-privacidade" element={<Privacy />} />
            <Route path="/sobre" element={<About />} />
            <Route path="/mapa-do-site" element={<SiteMap />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </main>
      <Footer />
    </div>
  );
};

const AppLayout: React.FC<{ includeClientFeatures: boolean }> = ({ includeClientFeatures }) => {
  return (
    <>
      <ScrollToTop />
      <Suspense fallback={<LandingRouteFallback />}>
        <Routes>
          {/* Admin Keystatic — fora do layout principal, antes de todas as outras rotas */}
          <Route path="/keystatic/*" element={<KeystaticPage />} />
          <Route path="/beto-carrero" element={<BetoCarreroLanding />} />
          <Route path="/lollapalooza" element={<LollapaloozaLanding />} />
          <Route path="/lollapalooza-2026" element={<Navigate to="/lollapalooza" replace />} />
          <Route path="/orlando" element={<OrlandoLanding />} />
          <Route path="/melhor-idade" element={<MelhorIdadeLanding />} />
          <Route path="/brazil-promotion-day" element={<BrazilPromotionDayLanding />} />
          <Route path="/consultoria-de-viagem" element={<ConsultoriaDeViagemLanding />} />
          <Route path="/viagens-para-executivos" element={<ViagensParaExecutivosLanding />} />
          <Route path="/curadoria-cruzeiros-brasil" element={<CuradoriaCruzeirosBrasilLanding />} />
          <Route path="/nps" element={<NPS />} />
          <Route path="/quiz" element={<QuizAnhangaLanding />} />
          <Route path="/*" element={<MainSiteShell />} />
        </Routes>
      </Suspense>
      {includeClientFeatures ? (
        <ClientFeatures />
      ) : null}
    </>
  );
};

interface AppProps {
  router?: 'browser' | 'memory';
  initialEntries?: string[];
  headManager?: HeadManager | null;
  includeClientFeatures?: boolean;
}

function App({
  router = 'browser',
  initialEntries = ['/'],
  headManager = null,
  includeClientFeatures = true
}: AppProps) {
  const routerNode = router === 'memory' ? (
    <MemoryRouter initialEntries={initialEntries}>
      <AppLayout includeClientFeatures={includeClientFeatures} />
    </MemoryRouter>
  ) : (
    <BrowserRouter>
      <AppLayout includeClientFeatures={includeClientFeatures} />
    </BrowserRouter>
  );

  return (
    <HeadContext.Provider value={headManager}>
      <LazyMotion features={domAnimation}>
        {routerNode}
      </LazyMotion>
    </HeadContext.Provider>
  );
}

export default App;

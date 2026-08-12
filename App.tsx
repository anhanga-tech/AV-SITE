import React, { Suspense, lazy } from 'react';
import { LazyMotion, domAnimation } from 'framer-motion';
import { BrowserRouter, MemoryRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import Header from './components/Header/Header';
import Footer from './components/Footer';
import AIChat from './components/AIChat';
import ContactModal from './components/ContactModal';
import { ClientOnly } from './components/ClientOnly';
import ChunkErrorBoundary from './components/ChunkErrorBoundary';
import ScrollToTop from './components/ScrollToTop';
import BackToTop from './components/ui/BackToTop';
import CookieConsentBanner from './components/CookieConsentBanner';
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
const ParquesBrasil = lazy(() => import('./pages/ParquesBrasil'));
const ExclusaoDados = lazy(() => import('./pages/ExclusaoDados'));
const NotFound = lazy(() => import('./pages/NotFound'));
const BetoCarreroLanding = lazy(() => import('./pages/landings/BetoCarreroLanding'));
const HopiHariLanding = lazy(() => import('./pages/landings/HopiHariLanding'));
const LollapaloozaLanding = lazy(() => import('./pages/landings/LollapaloozaLanding'));
const OrlandoLanding = lazy(() => import('./pages/landings/OrlandoLanding'));
const MelhorIdadeLanding = lazy(() => import('./pages/landings/MelhorIdadeLanding'));
const MelhorIdadePacotesLanding = lazy(() => import('./pages/landings/MelhorIdadePacotesLanding'));
const CorporativoLanding = lazy(() => import('./pages/landings/CorporativoLanding'));
const ConsultoriaDeViagemLanding = lazy(() => import('./pages/landings/ConsultoriaDeViagemLanding'));

const CruzeirosLanding = lazy(() => import('./pages/landings/CruzeirosLanding'));
const NpsPage = lazy(() => import('./pages/NpsPage'));
const QuizAnhangaLanding = lazy(() => import('./pages/landings/QuizAnhangaLanding'));
const LinksPage = lazy(() => import('./pages/LinksPage'));

const MainRouteFallback: React.FC = () => <section className="min-h-[40vh] bg-white" aria-hidden="true" />;
const LandingRouteFallback: React.FC = () => <div className="min-h-screen bg-white" aria-hidden="true" />;

// Rotas standalone (página de bio, etc.): sem nenhum overlay flutuante — nem AIChat, nem
// ContactModal, nem BackToTop. Esses FABs cobririam o conteúdo curado e os selos de confiança.
const STANDALONE_ROUTES = ['/links'];

// Landing pages de campanha (ver "Routing" no CLAUDE.md): já não renderizam Header/Footer,
// e o AIChat e o BackToTop também ficam de fora aqui. Cada uma tem seu próprio CTA de
// conversão; um segundo overlay flutuante competindo com ele dilui "um CTA dominante por
// tela" (PRODUCT.md) — e o FAB de "voltar ao topo" cobria conteúdo (FAQ, cards, CNPJ) na
// zona do polegar em mobile, exatamente o imóvel que o critique de /consultoria-de-viagem
// reservou à conversão. ContactModal continua montado — os CTAs dessas landings disparam
// openContactModal() e dependem dele.
//
// Fonte única: as rotas registradas em AppLayout (ver abaixo) são derivadas deste array,
// então cadastrar uma landing aqui basta para ela também renderizar — nenhuma segunda
// lista para manter sincronizada manualmente.
const LANDING_PAGES: { path: string; element: React.ReactElement }[] = [
  { path: '/beto-carrero', element: <BetoCarreroLanding /> },
  { path: '/hopi-hari', element: <HopiHariLanding /> },
  { path: '/lollapalooza', element: <LollapaloozaLanding /> },
  { path: '/orlando', element: <OrlandoLanding /> },
  { path: '/melhor-idade', element: <MelhorIdadeLanding /> },
  { path: '/melhor-idade/pacotes-pastore', element: <MelhorIdadePacotesLanding /> },
  { path: '/corporativo', element: <CorporativoLanding /> },
  { path: '/consultoria-de-viagem', element: <ConsultoriaDeViagemLanding /> },
  { path: '/cruzeiros', element: <CruzeirosLanding /> },
  { path: '/nps', element: <NpsPage /> },
  { path: '/quiz', element: <QuizAnhangaLanding /> },
];

const LANDING_PAGE_ROUTES = LANDING_PAGES.map(({ path }) => path);

const ClientFeatures: React.FC = () => {
  const { pathname } = useLocation();
  // Normaliza trailing slash e caixa antes de comparar: o React Router casa a rota com ou sem
  // a barra E de forma case-insensitive (/LINKS renderiza LinksPage), mas location.pathname
  // preserva ambos — sem normalizar, os overlays vazariam em /links/ ou /LINKS.
  const normalizedPath = (pathname === '/' ? '/' : pathname.replace(/\/$/, '')).toLowerCase();
  if (STANDALONE_ROUTES.includes(normalizedPath)) return null;
  const isLandingRoute = LANDING_PAGE_ROUTES.includes(normalizedPath);
  return (
    <ClientOnly>
      {isLandingRoute ? null : <AIChat />}
      <ContactModal />
      {isLandingRoute ? null : <BackToTop />}
    </ClientOnly>
  );
};

const MainSiteShell: React.FC = () => {
  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Header />
      <main id="main-content" className="flex-grow">
        <ChunkErrorBoundary>
        <Suspense fallback={<MainRouteFallback />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/blog" element={<BlogList />} />
            <Route path="/blog/:slug" element={<BlogPost />} />
            <Route path="/old-blog" element={<BlogRedirect />} />
            <Route path="/old-blog/:slug" element={<BlogRedirect />} />
            <Route path="/termos-de-uso" element={<Terms />} />
            <Route path="/politica-privacidade" element={<Privacy />} />
            <Route path="/exclusao-de-dados" element={<ExclusaoDados />} />
            <Route path="/sobre" element={<About />} />
            {/* Hub de conteúdo, não landing de campanha: fica no MainSiteShell
                para herdar Header, Footer e navegação interna — é por onde a
                busca orgânica chega e distribui para /beto-carrero. */}
            <Route path="/parques-brasil" element={<ParquesBrasil />} />
            <Route path="/mapa-do-site" element={<SiteMap />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
        </ChunkErrorBoundary>
      </main>
      <Footer />
    </div>
  );
};

const AppLayout: React.FC<{ includeClientFeatures: boolean }> = ({ includeClientFeatures }) => {
  return (
    <>
      {/* Primeiro na ordem do DOM: usuários de teclado/leitor de tela alcançam as
          preferências de cookies sem atravessar a página inteira (visual segue fixed no rodapé) */}
      <ClientOnly>
        <CookieConsentBanner />
      </ClientOnly>
      <ScrollToTop />
      <ChunkErrorBoundary>
      <Suspense fallback={<LandingRouteFallback />}>
        <Routes>
          {LANDING_PAGES.map(({ path, element }) => (
            <Route key={path} path={path} element={element} />
          ))}
          <Route path="/lollapalooza-2026" element={<Navigate to="/lollapalooza" replace />} />
          <Route path="/brazil-promotion-day" element={<Navigate to="/corporativo" replace />} />
          <Route path="/viagens-para-executivos" element={<Navigate to="/corporativo" replace />} />
          <Route path="/curadoria-cruzeiros-brasil" element={<Navigate to="/cruzeiros" replace />} />
          <Route path="/links" element={<LinksPage />} />
          <Route path="/*" element={<MainSiteShell />} />
        </Routes>
      </Suspense>
      </ChunkErrorBoundary>
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

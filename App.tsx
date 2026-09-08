import React, { Suspense, lazy } from 'react';
import { LazyMotion, domAnimation } from 'framer-motion';
import { BrowserRouter, MemoryRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import Header from './components/Header/Header';
import Footer from './components/Footer';
import ContactModal from './components/ContactModal';
import { ClientOnly } from './components/ClientOnly';
import ChunkErrorBoundary from './components/ChunkErrorBoundary';
import ScrollToTop from './components/ScrollToTop';
import { HeadContext, type HeadManager } from './lib/head';

// Pages
import Home from './pages/Home';

// Overlays de cliente puro que nunca renderizam durante SSR (ver `includeClientFeatures` e
// `ClientOnly` abaixo), então torná-los lazy não arrisca o HTML prerenderizado de nenhuma
// rota — diferente de Header/Footer/Home, que o `ssr.tsx` precisa resolver de forma síncrona
// (ver comentário em `ssr.tsx`). lazy() move o código deles para fora do chunk de entrada, que
// hoje é baixado por toda rota (incl. `/links` e as landings), mesmo as que nunca os montam.
// ContactModal NÃO entra aqui apesar de se qualificar por esse critério: toda rota já precisa
// dele hoje (ClientFeatures o monta incondicionalmente, e `pages/LinksPage.tsx` importa sua
// própria instância direto) — não haveria bytes a poupar. Torná-lo lazy só trocaria esse
// "grátis" por um risco real: seus CTAs abrem o modal via `window.dispatchEvent` num
// `CustomEvent('open-contact-modal')` (utils/contactForm.ts) que o componente escuta a partir
// do próprio mount — um clique rápido (o CTA "Fale Conosco" do Header é visível assim que a
// página carrega) antes do chunk resolver perderia o evento (comprovado com o CTA do Header
// em tests/e2e/contact-form.spec.ts — falhou lazy, sem consumidor para reemitir o evento).
const AIChat = lazy(() => import('./components/AIChat'));
const BackToTop = lazy(() => import('./components/ui/BackToTop'));
const CookieConsentBanner = lazy(() => import('./components/CookieConsentBanner'));

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

// Aliases de redirect (URL antiga de campanha continua válida e redireciona para a canônica).
// Fonte única: os <Navigate> no AppLayout são derivados deste array — cadastrar um alias aqui
// basta para ele redirecionar E ficar fora dos overlays (ClientFeatures retorna null: numa
// rota que redireciona em milissegundos não faz sentido disparar o fetch dos chunks de
// AIChat/BackToTop).
const REDIRECT_ALIASES: { path: string; to: string }[] = [
  { path: '/lollapalooza-2026', to: '/lollapalooza' },
  { path: '/brazil-promotion-day', to: '/corporativo' },
  { path: '/viagens-para-executivos', to: '/corporativo' },
  { path: '/curadoria-cruzeiros-brasil', to: '/cruzeiros' },
];

const REDIRECT_ALIAS_ROUTES = REDIRECT_ALIASES.map(({ path }) => path);

const ClientFeatures: React.FC = () => {
  const { pathname } = useLocation();
  // Normaliza trailing slash e caixa antes de comparar: o React Router casa a rota com ou sem
  // a barra E de forma case-insensitive (/LINKS renderiza LinksPage), mas location.pathname
  // preserva ambos — sem normalizar, os overlays vazariam em /links/ ou /LINKS.
  const normalizedPath = (pathname === '/' ? '/' : pathname.replace(/\/$/, '')).toLowerCase();
  if (STANDALONE_ROUTES.includes(normalizedPath)) return null;
  if (REDIRECT_ALIAS_ROUTES.includes(normalizedPath)) return null;
  const isLandingRoute = LANDING_PAGE_ROUTES.includes(normalizedPath);
  return (
    <ClientOnly>
      {/*
        ContactModal fica FORA dos ChunkErrorBoundary/Suspense dos overlays lazy: é um
        import estático cujo listener `open-contact-modal` precisa montar cedo (CTA do
        Header). Se AIChat/BackToTop falharem ou suspenderem, o modal não pode ser
        arrastado junto.
      */}
      <ContactModal />
      {isLandingRoute ? null : (
        <ChunkErrorBoundary fallback={null}>
          <Suspense fallback={null}>
            <AIChat />
          </Suspense>
        </ChunkErrorBoundary>
      )}
      {isLandingRoute ? null : (
        <ChunkErrorBoundary fallback={null}>
          <Suspense fallback={null}>
            <BackToTop />
          </Suspense>
        </ChunkErrorBoundary>
      )}
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
        <ChunkErrorBoundary fallback={null}>
          <Suspense fallback={null}>
            <CookieConsentBanner />
          </Suspense>
        </ChunkErrorBoundary>
      </ClientOnly>
      <ScrollToTop />
      <ChunkErrorBoundary>
      <Suspense fallback={<LandingRouteFallback />}>
        <Routes>
          {LANDING_PAGES.map(({ path, element }) => (
            <Route key={path} path={path} element={element} />
          ))}
          {REDIRECT_ALIASES.map(({ path, to }) => (
            <Route key={path} path={path} element={<Navigate to={to} replace />} />
          ))}
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

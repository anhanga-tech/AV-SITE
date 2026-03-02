import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/react';
import Header from './components/Header';
import Footer from './components/Footer';
import AIChat from './components/AIChat';
import ScrollToTop from './components/ScrollToTop';

// Pages
import Home from './pages/Home';
const BlogList = lazy(() => import('./pages/BlogList'));
const BlogPost = lazy(() => import('./pages/BlogPost'));
const BlogRedirect = lazy(() => import('./pages/BlogRedirect'));
const Terms = lazy(() => import('./pages/Terms'));
const Privacy = lazy(() => import('./pages/Privacy'));
const SiteMap = lazy(() => import('./pages/SiteMap'));
const BetoCarreroLanding = lazy(() => import('./pages/landings/BetoCarreroLanding'));
const LollapaloozaLanding = lazy(() => import('./pages/landings/LollapaloozaLanding'));
const OrlandoLanding = lazy(() => import('./pages/landings/OrlandoLanding'));

import { HelmetProvider, Helmet } from 'react-helmet-async';

const MainRouteFallback: React.FC = () => <section className="min-h-[40vh] bg-white" aria-hidden="true" />;
const LandingRouteFallback: React.FC = () => <div className="min-h-screen bg-white" aria-hidden="true" />;

const MainSiteShell: React.FC = () => {
  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Header />
      <main id="main-content" className="flex-grow">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/blog" element={<Suspense fallback={<MainRouteFallback />}><BlogList /></Suspense>} />
          <Route path="/blog/:slug" element={<Suspense fallback={<MainRouteFallback />}><BlogPost /></Suspense>} />
          <Route path="/old-blog" element={<Suspense fallback={<MainRouteFallback />}><BlogRedirect /></Suspense>} />
          <Route path="/old-blog/:slug" element={<Suspense fallback={<MainRouteFallback />}><BlogRedirect /></Suspense>} />
          <Route path="/termos-de-uso" element={<Suspense fallback={<MainRouteFallback />}><Terms /></Suspense>} />
          <Route path="/politica-privacidade" element={<Suspense fallback={<MainRouteFallback />}><Privacy /></Suspense>} />
          <Route path="/mapa-do-site" element={<Suspense fallback={<MainRouteFallback />}><SiteMap /></Suspense>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
};

function App() {
  return (
    <HelmetProvider>
      {/* Fallback global de SEO. Títulos de página devem sempre passar pelo componente <SEO>,
          que garante o sufixo "| Anhangá Viagens" e evita duplicação. */}
      <Helmet>
        <title>Anhangá Viagens | Roteiros Personalizados e Turismo de Experiência</title>
        <meta
          name="description"
          content="Agência de viagens boutique em São Paulo especializada em roteiros personalizados, festivais e experiências exclusivas."
        />

        {/* Open Graph (global fallback) */}
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Anhangá Viagens" />
        <meta property="og:title" content="Anhangá Viagens | Roteiros Personalizados e Turismo de Experiência" />
        <meta property="og:description" content="Agência de viagens boutique especializada em roteiros personalizados, festivais e experiências no Brasil e no mundo." />
        <meta property="og:image" content="https://www.anhanga.tur.br/og-image-1200x630.jpg" />

        {/* Twitter (global fallback) */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Anhangá Viagens | Roteiros Personalizados e Turismo de Experiência" />
        <meta name="twitter:description" content="Agência de viagens boutique especializada em roteiros personalizados, festivais e experiências no Brasil e no mundo." />
        <meta name="twitter:image" content="https://www.anhanga.tur.br/og-image-1200x630.jpg" />

        {/* NOTE: Do not set canonical/og:url globally here. They must be page-specific to avoid duplicate signals. */}
      </Helmet>
      <Router>
        <ScrollToTop />
        <Routes>
          <Route path="/beto-carrero" element={<Suspense fallback={<LandingRouteFallback />}><BetoCarreroLanding /></Suspense>} />
          <Route path="/lollapalooza-2026" element={<Suspense fallback={<LandingRouteFallback />}><LollapaloozaLanding /></Suspense>} />
          <Route path="/orlando" element={<Suspense fallback={<LandingRouteFallback />}><OrlandoLanding /></Suspense>} />
          <Route path="/*" element={<MainSiteShell />} />
        </Routes>
        <AIChat />
        <Analytics />
        <SpeedInsights />
      </Router>
    </HelmetProvider>
  );
}

export default App;

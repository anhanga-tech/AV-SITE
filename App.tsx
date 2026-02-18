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
const BlogRedirect = lazy(() => import('./pages/BlogRedirect'));
const Terms = lazy(() => import('./pages/Terms'));
const Privacy = lazy(() => import('./pages/Privacy'));
const SiteMap = lazy(() => import('./pages/SiteMap'));
const BetoCarreroLanding = lazy(() => import('./pages/landings/BetoCarreroLanding'));
const LollapaloozaLanding = lazy(() => import('./pages/landings/LollapaloozaLanding'));
const OrlandoLanding = lazy(() => import('./pages/landings/OrlandoLanding'));

import { HelmetProvider } from 'react-helmet-async';

const MainRouteFallback: React.FC = () => <section className="min-h-[40vh] bg-white" aria-hidden="true" />;
const LandingRouteFallback: React.FC = () => <div className="min-h-screen bg-white" aria-hidden="true" />;

const MainSiteShell: React.FC = () => {
  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Header />
      <main id="main-content" className="flex-grow">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/blog" element={<Suspense fallback={<MainRouteFallback />}><BlogRedirect /></Suspense>} />
          <Route path="/blog/:slug" element={<Suspense fallback={<MainRouteFallback />}><BlogRedirect /></Suspense>} />
          <Route path="/termos-de-uso" element={<Suspense fallback={<MainRouteFallback />}><Terms /></Suspense>} />
          <Route path="/politica-privacidade" element={<Suspense fallback={<MainRouteFallback />}><Privacy /></Suspense>} />
          <Route path="/mapa-do-site" element={<Suspense fallback={<MainRouteFallback />}><SiteMap /></Suspense>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Footer />
      <AIChat />
    </div>
  );
};

function App() {
  return (
    <HelmetProvider>
      <Router>
        <ScrollToTop />
        <Routes>
          <Route path="/beto-carrero" element={<Suspense fallback={<LandingRouteFallback />}><BetoCarreroLanding /></Suspense>} />
          <Route path="/lollapalooza-2026" element={<Suspense fallback={<LandingRouteFallback />}><LollapaloozaLanding /></Suspense>} />
          <Route path="/orlando" element={<Suspense fallback={<LandingRouteFallback />}><OrlandoLanding /></Suspense>} />
          <Route path="/*" element={<MainSiteShell />} />
        </Routes>
        <Analytics />
        <SpeedInsights />
      </Router>
    </HelmetProvider>
  );
}

export default App;

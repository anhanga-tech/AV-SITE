import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import AIChat from './components/AIChat';
import ScrollToTop from './components/ScrollToTop';

// Pages
import Home from './pages/Home';
import BlogList from './pages/BlogList';
import BlogPost from './pages/BlogPost';
import Terms from './pages/Terms';
import Privacy from './pages/Privacy';
import BetoCarreroLanding from './pages/landings/BetoCarreroLanding';
import LollapaloozaLanding from './pages/landings/LollapaloozaLanding';
import OrlandoLanding from './pages/landings/OrlandoLanding';

import { HelmetProvider } from 'react-helmet-async';

const MainSiteShell: React.FC = () => {
  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Header />
      <main className="flex-grow">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/blog" element={<BlogList />} />
          <Route path="/blog/:slug" element={<BlogPost />} />
          <Route path="/termos-de-uso" element={<Terms />} />
          <Route path="/politica-privacidade" element={<Privacy />} />
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
          <Route path="/beto-carrero" element={<BetoCarreroLanding />} />
          <Route path="/lollapalooza-2026" element={<LollapaloozaLanding />} />
          <Route path="/orlando" element={<OrlandoLanding />} />
          <Route path="/*" element={<MainSiteShell />} />
        </Routes>
      </Router>
    </HelmetProvider>
  );
}

export default App;

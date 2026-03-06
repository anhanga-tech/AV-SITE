import React, { Suspense, lazy } from 'react';
import Navbar from './Navbar';
import Hero from './Hero';
import LineupSection from './LineupSection';
import PackageFeatures from './PackageFeatures';
import WhyUs from './WhyUs';
import CTASection from './CTASection';
import Footer from './Footer';
import WhatsAppFloating from './WhatsAppFloating';

const VenueMap = lazy(() => import('./VenueMap'));

const VenueMapFallback: React.FC = () => (
  <section className="relative z-20 -mt-10 mb-10 px-4" aria-label="Mapa da localização e pontos de interesse">
    <div className="container mx-auto">
      <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100">
        <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_minmax(320px,42%)] p-6 md:p-8">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-anhanga-blue mb-3">
              Localizacao e referencias
            </p>
            <h3 className="text-2xl md:text-3xl font-black text-anhanga-darkBlue mb-3">
              Interlagos com acesso planejado
            </h3>
            <p className="text-gray-700 leading-relaxed">
              O Autodromo de Interlagos fica conectado a trem, aeroportos e bairros com boa rede hoteleira.
              No cliente, o mapa interativo carrega automaticamente com os pontos de apoio do festival.
            </p>
          </div>
          <div className="rounded-2xl bg-gradient-to-br from-anhanga-blue to-slate-900 min-h-[280px] flex items-center justify-center p-6 text-center">
            <p className="text-white/90 text-sm md:text-base leading-relaxed">
              Mapa interativo carregado no navegador para preservar performance e compatibilidade do prerender.
            </p>
          </div>
        </div>
      </div>
    </div>
  </section>
);

function LollapaloozaApp() {
  const shouldRenderInteractiveMap = typeof window !== 'undefined';

  return (
    <div className="landing-lollapalooza font-sans antialiased text-gray-800 bg-white selection:bg-anhanga-yellow selection:text-anhanga-darkBlue">
      <Navbar />
      <Hero />
      {shouldRenderInteractiveMap ? (
        <Suspense fallback={<VenueMapFallback />}>
          <VenueMap />
        </Suspense>
      ) : (
        <VenueMapFallback />
      )}
      <PackageFeatures />
      <LineupSection />
      <WhyUs />
      <CTASection />
      <Footer />
      <WhatsAppFloating />
    </div>
  );
}

export default LollapaloozaApp;

import React from 'react';
import { Link } from 'react-router-dom';
import BetoCarreroApp from '../../components/landings/beto-carrero/BetoCarreroApp';
import { Seo } from '../../components/Seo';
import { BreadcrumbSchema } from '../../components/schemas/BreadcrumbSchema';
import { FAQPageSchema } from '../../components/schemas/FAQPageSchema';
import { ServiceSchema } from '../../components/schemas/ServiceSchema';
import { openContactModal } from '../../utils/contactForm';
import { BETO_FAQ_ITEMS } from '../../components/landings/beto-carrero/betoFaqItems';

const BetoCarreroLanding: React.FC = () => {
  return (
    <>
      <Seo
        title="Pacote Beto Carrero World 2026"
        description="Garanta seu pacote para o Beto Carrero com hotel, passagens e ingressos. Planejamento completo para famílias com o suporte da Anhangá Viagens."
        canonical="https://www.anhanga.tur.br/beto-carrero/"
        noHreflang
      />
      <ServiceSchema
        name="Pacote Beto Carrero 2026"
        description="Planejamento de pacote para o Beto Carrero World com hotel, ingressos, transporte e suporte especializado."
        serviceUrl="https://www.anhanga.tur.br/beto-carrero/"
        serviceType="Pacote de viagem para parque temático"
        areaServed="São Paulo e Brasil"
      />
      {/* O hub /parques-brasil é o pai desta página na árvore do site — o
          breadcrumb precisa refletir isso, senão o par hub/filha declara
          hierarquias divergentes no JSON-LD. */}
      <BreadcrumbSchema
        items={[
          { name: 'Home', item: 'https://www.anhanga.tur.br/' },
          { name: 'Parques no Brasil', item: 'https://www.anhanga.tur.br/parques-brasil/' },
          { name: 'Pacote Beto Carrero', item: 'https://www.anhanga.tur.br/beto-carrero/' }
        ]}
      />
      <FAQPageSchema items={BETO_FAQ_ITEMS} />
      <div className="bg-brand-surface py-2 border-b border-zinc-100">
        <div className="container mx-auto px-6 flex flex-wrap items-center gap-x-5 gap-y-1">
          <Link to="/" className="text-sm font-medium text-zinc-500 hover:text-anhanga-action transition-colors flex items-center gap-1">
            ← Voltar para o site principal
          </Link>
          <Link to="/parques-brasil/" className="text-sm font-medium text-zinc-500 hover:text-anhanga-action transition-colors">
            Comparar com os outros parques do Brasil
          </Link>
        </div>
      </div>

      {/* React 19 native resource hints */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link
        href="https://fonts.googleapis.com/css2?family=Fredoka:wght@300;400;600;700&family=Nunito:wght@400;600;700;800&display=swap"
        rel="stylesheet"
      />

      <BetoCarreroApp />
      <section className="bg-brand-surface border-t border-brand-cyan/10 py-14">
        <div className="container mx-auto px-6 max-w-5xl">
          <h2 className="text-3xl md:text-4xl font-black text-brand-dark mb-4">Pacote Beto Carrero para viajar com tranquilidade</h2>
          <p className="text-zinc-700 text-lg leading-relaxed mb-5">
            Nosso <strong>pacote Beto Carrero</strong> é desenhado para quem quer curtir o parque sem dor de cabeça com reservas, horários e deslocamentos.
          </p>
          <p className="text-zinc-700 text-lg leading-relaxed mb-5">
            Você recebe planejamento completo com opções de hotel, logística e ingressos, além de orientação prática para aproveitar melhor cada dia de viagem em família.
          </p>
          <h3 className="text-xl md:text-2xl font-extrabold text-brand-dark mb-3">O que pode entrar no seu pacote</h3>
          <ul className="list-disc list-inside text-zinc-700 space-y-1 mb-6">
            <li>Hospedagem com localização estratégica</li>
            <li>Ingressos para o parque e upgrades opcionais</li>
            <li>Roteiro de atrações por perfil do grupo</li>
            <li>Suporte por WhatsApp durante a viagem</li>
          </ul>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                openContactModal({ source: 'beto-carrero' });
              }}
              className="btn-whatsapp btn-specialist px-5 py-3 rounded-full bg-brand-cyan text-white font-bold hover:bg-brand-cyan/90 transition-colors"
              data-tracking="footer-betocarrero"
              data-testid="cta-betocarrero-specialist"
            >
              Falar com especialista
            </button>
            <Link to="/orlando/" className="px-5 py-3 rounded-full bg-white border border-zinc-200 text-brand-dark font-semibold hover:border-brand-cyan/40 transition-colors">
              Ver pacotes para Orlando
            </Link>
            <Link to="/blog/" className="px-5 py-3 rounded-full bg-white border border-zinc-200 text-brand-dark font-semibold hover:border-brand-cyan/40 transition-colors">
              Ver dicas de planejamento
            </Link>
            <a href="https://www.betocarrero.com.br/" target="_blank" rel="noopener noreferrer" className="px-5 py-3 rounded-full bg-white border border-zinc-200 text-brand-dark font-semibold hover:border-brand-cyan/40 transition-colors">
              Site Oficial Beto Carrero
            </a>
          </div>
        </div>
      </section>
    </>
  );
};

export default BetoCarreroLanding;

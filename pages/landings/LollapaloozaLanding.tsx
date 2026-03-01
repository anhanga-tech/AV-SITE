import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { getWhatsAppLink } from '../../utils/whatsapp';
import { SEO } from '../../components/SEO';
import LollapaloozaApp from '../../components/landings/lollapalooza/LollapaloozaApp';
import { BreadcrumbSchema } from '../../components/schemas/BreadcrumbSchema';
import { FAQPageSchema } from '../../components/schemas/FAQPageSchema';
import { ServiceSchema } from '../../components/schemas/ServiceSchema';
import 'leaflet/dist/leaflet.css';
import './lollapalooza.css';

const LOLLAPALOOZA_FAQ_ITEMS = [
  {
    question: 'O pacote para Lollapalooza 2026 inclui hospedagem e transporte?',
    answer: 'Sim. Montamos pacote com hotel, deslocamento e suporte local, além de sugerir as melhores regiões para ficar perto do festival.'
  },
  {
    question: 'Vocês ajudam na logística do evento em São Paulo?',
    answer: 'Sim. Organizamos roteiro de chegada e saída, estratégias para os dias de show e recomendações para evitar custos e filas desnecessárias.'
  },
  {
    question: 'Posso personalizar o pacote para Lollapalooza com meu grupo?',
    answer: 'Pode. Ajustamos orçamento, tipo de hospedagem e dinâmica de viagem para grupos, casais e viajantes solo.'
  }
];

const LollapaloozaLanding: React.FC = () => {
  return (
    <>
      <SEO
        title="Pacotes Lollapalooza 2026: Viagem para o Festival em São Paulo"
        description="Garanta seu pacote para Lollapalooza 2026 with hotel, transporte e suporte especializado em São Paulo. Planejamento completo para curtir o festival sem preocupações."
        canonical="https://www.anhanga.tur.br/lollapalooza-2026"
        keywords="pacotes Lollapalooza 2026, viagem Lollapalooza São Paulo, hotel para Lollapalooza, pacote festival em São Paulo"
      />
      <ServiceSchema
        name="Pacotes para Lollapalooza 2026"
        description="Planejamento de viagem para o Lollapalooza 2026 com hospedagem, transporte e suporte especializado."
        serviceUrl="https://www.anhanga.tur.br/lollapalooza-2026"
        serviceType="Pacote de viagem para festival"
        areaServed="São Paulo e Brasil"
        keywords={['pacote Lollapalooza 2026', 'viagem para festival', 'hotel em São Paulo para evento']}
      />
      <BreadcrumbSchema
        items={[
          { name: 'Home', item: 'https://www.anhanga.tur.br/' },
          { name: 'Pacotes para Lollapalooza 2026', item: 'https://www.anhanga.tur.br/lollapalooza-2026' }
        ]}
      />
      <FAQPageSchema items={LOLLAPALOOZA_FAQ_ITEMS} />
      <Helmet defer={false}>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700;900&display=swap"
          rel="stylesheet"
        />
      </Helmet>
      <LollapaloozaApp />
      <section className="bg-[#fffdf5] border-t border-brand-cyan/10 py-14">
        <div className="container mx-auto px-6 max-w-5xl">
          <h2 className="text-3xl md:text-4xl font-black text-brand-dark mb-4">Pacotes para Lollapalooza 2026 com suporte real</h2>
          <p className="text-gray-700 text-lg leading-relaxed mb-5">
            Para quem quer curtir o festival sem caos, nossos <strong>pacotes para Lollapalooza 2026</strong> unem hospedagem estratégica, deslocamento inteligente e suporte para os dias de evento.
          </p>
          <p className="text-gray-700 text-lg leading-relaxed mb-5">
            Você viaja com roteiro claro, evita decisões de última hora e ganha mais tempo para aproveitar shows, ativações e experiências em São Paulo.
          </p>
          <h3 className="text-xl md:text-2xl font-extrabold text-brand-dark mb-3">O que pode estar no pacote</h3>
          <ul className="list-disc list-inside text-gray-700 space-y-1 mb-6">
            <li>Hospedagem próxima a rotas de acesso ao festival</li>
            <li>Transporte com melhor custo-benefício</li>
            <li>Planejamento diário para os três dias de evento</li>
            <li>Suporte rápido para ajustes durante a viagem</li>
          </ul>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={(e) => {
                e.preventDefault();
                window.dispatchEvent(new CustomEvent('toggle-ai-chat', {
                  detail: { message: "Olá! Gostaria de um orçamento personalizado para o Lollapalooza 2026." }
                }));
              }}
              className="btn-whatsapp btn-specialist px-5 py-3 rounded-full bg-brand-cyan text-white font-bold hover:bg-brand-cyan/90 transition-colors"
              data-tracking="cta-final-lollapalooza"
              data-testid="cta-lollapalooza-specialist"
            >
              Falar com especialista
            </button>
            <Link to="/orlando" className="px-5 py-3 rounded-full bg-white border border-gray-200 text-brand-dark font-semibold hover:border-brand-cyan/40 transition-colors">
              Ver pacotes para Orlando
            </Link>
            <a href="https://blog.anhanga.tur.br" className="px-5 py-3 rounded-full bg-white border border-gray-200 text-brand-dark font-semibold hover:border-brand-cyan/40 transition-colors">
              Ler guia de festivais
            </a>
          </div>
        </div>
      </section>
    </>
  );
};

export default LollapaloozaLanding;

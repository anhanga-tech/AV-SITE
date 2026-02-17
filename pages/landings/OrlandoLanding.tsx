import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { SEO } from '../../components/SEO';
import OrlandoApp from '../../components/landings/orlando/OrlandoApp';
import { BreadcrumbSchema } from '../../components/schemas/BreadcrumbSchema';
import { FAQPageSchema } from '../../components/schemas/FAQPageSchema';
import { ServiceSchema } from '../../components/schemas/ServiceSchema';
import './orlando.css';

const ORLANDO_FAQ_ITEMS = [
  {
    question: 'O pacote para Orlando inclui passagem, hotel e ingressos?',
    answer: 'Montamos pacotes completos ou parciais, incluindo aéreo, hospedagem, ingressos e suporte durante a viagem conforme seu perfil e orçamento.'
  },
  {
    question: 'Qual o melhor período para viajar para Orlando?',
    answer: 'Normalmente os melhores custos aparecem fora dos grandes feriados. Indicamos datas com melhor relação entre clima, fila nos parques e preço final.'
  },
  {
    question: 'A Anhangá ajuda com roteiro diário dos parques?',
    answer: 'Sim. Entregamos roteiro personalizado com prioridades de atrações, estratégias de fila e recomendações práticas para otimizar seu tempo.'
  }
];

const OrlandoLanding: React.FC = () => {
  return (
    <>
      <SEO
        title="Pacotes para Orlando com roteiro personalizado"
        description="Pacotes para Orlando com suporte de agência em São Paulo: aéreo, hotel, ingressos e roteiro personalizado para Disney e Universal."
        canonical="https://www.anhanga.tur.br/orlando"
        keywords="pacotes para Orlando, viagem para Orlando, roteiro Disney Orlando, pacote Universal Orlando, agência de viagens Orlando São Paulo"
      />
      <ServiceSchema
        name="Pacotes para Orlando personalizados"
        description="Planejamento de viagem para Orlando com suporte especializado, incluindo aéreo, hotel, ingressos e roteiro personalizado."
        serviceUrl="https://www.anhanga.tur.br/orlando"
        serviceType="Planejamento de viagem para Orlando"
        areaServed="São Paulo e Brasil"
        keywords={['pacotes para Orlando', 'roteiro Disney', 'viagem Universal']}
      />
      <BreadcrumbSchema
        items={[
          { name: 'Home', item: 'https://www.anhanga.tur.br/' },
          { name: 'Pacotes para Orlando', item: 'https://www.anhanga.tur.br/orlando' }
        ]}
      />
      <FAQPageSchema items={ORLANDO_FAQ_ITEMS} />
      <Helmet>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Outfit:wght@400;700;900&display=swap"
          rel="stylesheet"
        />
      </Helmet>
      <OrlandoApp />
      <section className="bg-[#fffdf5] border-t border-brand-cyan/10 py-14">
        <div className="container mx-auto px-6 max-w-5xl">
          <h2 className="text-3xl md:text-4xl font-black text-brand-dark mb-4">Pacote para Orlando sem improviso</h2>
          <p className="text-gray-700 text-lg leading-relaxed mb-5">
            Se você busca <strong>pacotes para Orlando</strong> com planejamento profissional, a Anhangá estrutura sua viagem com foco em custo-benefício, logística e experiência.
          </p>
          <p className="text-gray-700 text-lg leading-relaxed mb-5">
            Definimos roteiro de parques, hospedagem por região, estratégia de ingressos e suporte antes e durante a viagem para você evitar erros comuns e aproveitar melhor cada dia.
          </p>
          <h3 className="text-xl md:text-2xl font-extrabold text-brand-dark mb-3">O que você pode incluir no pacote</h3>
          <ul className="list-disc list-inside text-gray-700 space-y-1 mb-6">
            <li>Aéreo e hotel com perfil ideal para sua viagem</li>
            <li>Ingressos Disney e Universal com orientação de uso</li>
            <li>Roteiro diário personalizado por prioridade</li>
            <li>Suporte rápido por WhatsApp para ajustes</li>
          </ul>
          <div className="flex flex-wrap gap-3">
            <Link to="/" state={{ targetId: 'contato' }} className="px-5 py-3 rounded-full bg-brand-cyan text-white font-bold">
              Falar com especialista
            </Link>
            <Link to="/beto-carrero" className="px-5 py-3 rounded-full bg-white border border-gray-300 text-brand-dark font-semibold">
              Ver pacote Beto Carrero
            </Link>
            <a href="https://blog.anhanga.tur.br" className="px-5 py-3 rounded-full bg-white border border-gray-300 text-brand-dark font-semibold">
              Ler dicas no blog
            </a>
          </div>
        </div>
      </section>
    </>
  );
};

export default OrlandoLanding;

import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { getWhatsAppLink } from '../../utils/whatsapp';
import BetoCarreroApp from '../../components/landings/beto-carrero/BetoCarreroApp';
import { SEO } from '../../components/SEO';
import { LandingFAQ } from '../../components/LandingFAQ';
import { BreadcrumbSchema } from '../../components/schemas/BreadcrumbSchema';
import { FAQPageSchema } from '../../components/schemas/FAQPageSchema';
import { ServiceSchema } from '../../components/schemas/ServiceSchema';

const BETO_FAQ_ITEMS = [
  {
    question: 'Quanto custa em média um pacote para o Beto Carrero?',
    answer: 'O valor varia conforme a temporada e o tipo de hospedagem, mas pacotes personalizados que incluem hotel próximo e ingressos costumam começar em torno de R$ 1.200 a R$ 1.800 por pessoa, dependendo da origem e duração.'
  },
  {
    question: 'Qual a idade recomendada para visitar o parque?',
    answer: 'O Beto Carrero World possui atrações para todas as idades. Desde a área temática da Hot Wheels e Madagascar para os pequenos, até montanhas-russas radicais como a FireWhip para os mais velhos. É um destino perfeito para famílias com crianças de todas as faixas etárias.'
  },
  {
    question: 'Como funciona o estacionamento no Beto Carrero?',
    answer: 'O parque oferece um amplo estacionamento oficial pago e seguro. Para quem quer mais comodidade, nossos pacotes podem incluir transfers privativos ou coletivos saindo direto do hotel, eliminando preocupações com trânsito e vagas.'
  },
  {
    question: 'Qual a duração ideal para viajar ao Beto Carrero?',
    answer: 'Para aproveitar o parque com conforto e conhecer as principais atrações, recomendamos roteiros de 3 a 4 dias, permitindo pelo menos 2 dias inteiros dentro do parque.'
  }
];

const BetoCarreroLanding: React.FC = () => {
  return (
    <>
      <SEO
        title="Pacote Beto Carrero: Diversão para toda a Família"
        description="Pacote Beto Carrero personalizado com hotel, aéreo e ingresso. Planejamento completo para famílias com suporte especializado da Anhangá Viagens em São Paulo."
        canonical="https://www.anhanga.tur.br/beto-carrero"
        keywords="pacote Beto Carrero, viagem Beto Carrero, ingresso Beto Carrero, pacote família Beto Carrero, agência de viagens Beto Carrero"
      />
      <ServiceSchema
        name="Pacote Beto Carrero personalizado"
        description="Planejamento de pacote para Beto Carrero com hotel, ingressos, transporte e suporte especializado."
        serviceUrl="https://www.anhanga.tur.br/beto-carrero"
        serviceType="Pacote de viagem para parque temático"
        areaServed="São Paulo e Brasil"
        keywords={['pacote Beto Carrero', 'ingresso Beto Carrero', 'viagem em família']}
      />
      <BreadcrumbSchema
        items={[
          { name: 'Home', item: 'https://www.anhanga.tur.br/' },
          { name: 'Pacote Beto Carrero', item: 'https://www.anhanga.tur.br/beto-carrero' }
        ]}
      />
      <FAQPageSchema items={BETO_FAQ_ITEMS} />
      <Helmet>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Fredoka:wght@300;400;600;700&family=Nunito:wght@400;600;700;800&display=swap"
          rel="stylesheet"
        />
      </Helmet>
      <BetoCarreroApp />
      <LandingFAQ items={BETO_FAQ_ITEMS} />
      <section className="bg-[#fffdf5] border-t border-brand-cyan/10 py-14">
        <div className="container mx-auto px-6 max-w-5xl">
          <h2 className="text-3xl md:text-4xl font-black text-brand-dark mb-4">Pacote Beto Carrero para viajar com tranquilidade</h2>
          <p className="text-gray-700 text-lg leading-relaxed mb-5">
            Nosso <strong>pacote Beto Carrero</strong> é desenhado para quem quer curtir o parque sem dor de cabeça com reservas, horários e deslocamentos.
          </p>
          <p className="text-gray-700 text-lg leading-relaxed mb-5">
            Você recebe planejamento completo com opções de hotel, logística e ingressos, além de orientação prática para aproveitar melhor cada dia de viagem em família.
          </p>
          <h3 className="text-xl md:text-2xl font-extrabold text-brand-dark mb-3">O que pode entrar no seu pacote</h3>
          <ul className="list-disc list-inside text-gray-700 space-y-1 mb-6">
            <li>Hospedagem com localização estratégica</li>
            <li>Ingressos para o parque e upgrades opcionais</li>
            <li>Roteiro de atrações por perfil do grupo</li>
            <li>Suporte por WhatsApp durante a viagem</li>
          </ul>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={(e) => {
                e.preventDefault();
                window.dispatchEvent(new CustomEvent('toggle-ai-chat', {
                  detail: { message: "Olá! Gostaria de um orçamento personalizado para o Beto Carrero." }
                }));
              }}
              className="btn-whatsapp btn-specialist px-5 py-3 rounded-full bg-brand-cyan text-white font-bold hover:bg-brand-cyan/90 transition-colors"
              data-tracking="cta-final-betocarrero"
              data-testid="cta-betocarrero-specialist"
            >
              Falar com especialista
            </button>
            <Link to="/orlando" className="px-5 py-3 rounded-full bg-white border border-gray-200 text-brand-dark font-semibold hover:border-brand-cyan/40 transition-colors">
              Ver pacotes para Orlando
            </Link>
            <a href="https://blog.anhanga.tur.br" className="px-5 py-3 rounded-full bg-white border border-gray-200 text-brand-dark font-semibold hover:border-brand-cyan/40 transition-colors">
              Ver dicas de planejamento
            </a>
          </div>
        </div>
      </section>
    </>
  );
};

export default BetoCarreroLanding;

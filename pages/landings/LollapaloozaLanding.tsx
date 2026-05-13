import React from 'react';
import { SEO } from '../../components/SEO';
import { LandingFAQ } from '../../components/LandingFAQ';
import LollapaloozaApp from '../../components/landings/lollapalooza/LollapaloozaApp';
import { openContactModal } from '../../utils/contactForm';
import { WAITLIST_SECTION_ID } from '../../components/landings/lollapalooza/constants';
import { BreadcrumbSchema } from '../../components/schemas/BreadcrumbSchema';
import { FAQPageSchema } from '../../components/schemas/FAQPageSchema';
import { ServiceSchema } from '../../components/schemas/ServiceSchema';
import 'leaflet/dist/leaflet.css';
import './lollapalooza.css';

const LOLLAPALOOZA_FAQ_ITEMS = [
  {
    question: 'Os pacotes para o Lollapalooza 2026 estão esgotados?',
    answer: 'Sim. A campanha de pacotes 2026 foi encerrada com disponibilidade esgotada. Mantivemos esta página ativa para orientar quem pesquisou pela edição atual e abrir a lista de espera da edição 2027.'
  },
  {
    question: 'Como funciona a Lista de Espera Lolla 2027?',
    answer: 'Você deixa nome e e-mail nesta página e a Anhangá entra em contato quando a próxima campanha abrir. Isso ajuda a priorizar quem já demonstrou interesse na experiência do festival.'
  },
  {
    question: 'Qual a melhor região para se hospedar durante o festival?',
    answer: 'As regiões com acesso facilitado à Linha 9 - Esmeralda, além de bairros como Pinheiros e Vila Olímpia, seguem sendo as mais estratégicas para quem quer logística inteligente nos dias de evento.'
  },
  {
    question: 'Posso montar um pacote personalizado para 2027?',
    answer: 'Sim. A lista de espera serve justamente para identificar quem quer prioridade quando retomarmos orçamento, hospedagem e operação para a próxima edição do Lollapalooza.'
  }
];

const LollapaloozaLanding: React.FC = () => {
  return (
    <>
      <SEO
        title="Lollapalooza 2026 Esgotado | Lista de Espera 2027"
        description="A campanha do Lollapalooza 2026 foi encerrada com sucesso. Entre na lista de espera 2027 para receber prioridade quando os próximos pacotes abrirem."
        canonical="https://www.anhanga.tur.br/lollapalooza/"
        noHreflang
      />
      <ServiceSchema
        name="Lista de Espera Lollapalooza Brasil 2027"
        description="Página oficial da Anhangá para acompanhar a campanha esgotada do Lollapalooza 2026 e captar interessados na próxima edição."
        serviceUrl="https://www.anhanga.tur.br/lollapalooza/"
        serviceType="Lista de espera para pacote de viagem de festival"
        areaServed="São Paulo e Brasil"
        keywords={['lista de espera Lollapalooza 2027', 'viagem para festival', 'hotel em São Paulo para evento']}
      />
      <BreadcrumbSchema
        items={[
          { name: 'Home', item: 'https://www.anhanga.tur.br/' },
          { name: 'Lollapalooza Brasil', item: 'https://www.anhanga.tur.br/lollapalooza/' }
        ]}
      />
      <FAQPageSchema items={LOLLAPALOOZA_FAQ_ITEMS} />
      <div className="bg-[#fffdf5] py-2 border-b border-gray-100 relative z-[60]">
        <div className="container mx-auto px-6">
          <a href="https://www.anhanga.tur.br/" className="text-sm font-medium text-gray-500 hover:text-brand-cyan transition-colors flex items-center gap-1 font-sans">
            ← Voltar para o site principal
          </a>
        </div>
      </div>

      {/* React 19 native resource hints */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link
        href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700;900&display=swap"
        rel="stylesheet"
      />

      <LollapaloozaApp />
      <LandingFAQ items={LOLLAPALOOZA_FAQ_ITEMS} />
      <section className="bg-[#fffdf5] border-t border-brand-cyan/10 py-14">
        <div className="container mx-auto px-6 max-w-5xl">
          <h2 className="text-3xl md:text-4xl font-black text-brand-dark mb-4">2026 encerrou forte. 2027 já está no radar.</h2>
          <p className="text-gray-700 text-lg leading-relaxed mb-5">
            A página do <strong>Lollapalooza Brasil</strong> continua no ar porque a campanha 2026 foi um sucesso e segue relevante para quem pesquisa logística, hotel e planejamento de festival em São Paulo. Agora, o foco é transformar essa procura em prioridade para a próxima edição.
          </p>
          <p className="text-gray-700 text-lg leading-relaxed mb-5">
            Se você quer chegar antes da próxima abertura, entre na <strong>Lista de Espera Lolla 2027</strong>. A <strong>Anhangá Viagens</strong> é uma{' '}
            <a href="https://www.anhanga.tur.br/" className="text-brand-cyan font-semibold hover:underline">
              agência de viagens em São Paulo
            </a>{' '}
            com foco em atendimento consultivo e <strong>viagens personalizadas</strong> — do planejamento inicial ao suporte no destino.
          </p>
          <h3 className="text-xl md:text-2xl font-extrabold text-brand-dark mb-3">O que segue valendo para quem quer ir ao festival</h3>
          <ul className="list-disc list-inside text-gray-700 space-y-1 mb-6">
            <li>Hospedagem próxima a rotas de acesso ao festival</li>
            <li>Transporte com melhor custo-benefício (Linha 9 – Esmeralda ou Lolla Express)</li>
            <li>Planejamento diário para os três dias de evento</li>
            <li>Suporte rápido para ajustes durante a viagem</li>
            <li>Curadoria de restaurantes e experiências em São Paulo ao redor do festival</li>
          </ul>
          <p className="text-gray-700 text-lg leading-relaxed mb-6">
            Enquanto a próxima edição não abre, você também pode explorar outros roteiros da Anhangá e continuar pesquisando o festival com a referência desta landing evergreen.
          </p>
          <div className="flex flex-wrap gap-3">
            <a
              href={`#${WAITLIST_SECTION_ID}`}
              className="px-5 py-3 rounded-full bg-white border border-gray-200 text-brand-dark font-semibold hover:border-brand-cyan/40 transition-colors"
              data-tracking="footer-lollapalooza-waitlist"
            >
              Entrar na lista de espera 2027
            </a>
            <button
              onClick={(e) => {
                e.preventDefault();
                openContactModal({ source: 'lollapalooza' });
              }}
              className="btn-whatsapp btn-specialist px-5 py-3 rounded-full bg-brand-cyan text-white font-bold hover:bg-brand-cyan/90 transition-colors"
              data-tracking="footer-lollapalooza-whatsapp"
            >
              Falar com especialista
            </button>
            <a href="https://www.anhanga.tur.br/orlando/" className="px-5 py-3 rounded-full bg-white border border-gray-200 text-brand-dark font-semibold hover:border-brand-cyan/40 transition-colors">
              Ver pacotes para Orlando
            </a>
            <a href="https://www.anhanga.tur.br/" className="px-5 py-3 rounded-full bg-white border border-gray-200 text-brand-dark font-semibold hover:border-brand-cyan/40 transition-colors">
              Conhecer a Anhangá Viagens
            </a>
            <a href="/blog" className="px-5 py-3 rounded-full bg-white border border-gray-200 text-brand-dark font-semibold hover:border-brand-cyan/40 transition-colors">
              Ler guia de festivais
            </a>
          </div>
        </div>
      </section>
    </>
  );
};

export default LollapaloozaLanding;

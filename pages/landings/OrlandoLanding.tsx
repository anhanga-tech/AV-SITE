import React from 'react';
import { Link } from 'react-router-dom';
import { Seo } from '../../components/Seo';
import OrlandoApp from '../../components/landings/orlando/OrlandoApp';
import { ORLANDO_FAQ_ITEMS } from '../../components/landings/orlando/orlandoFaqItems';
import { BreadcrumbSchema } from '../../components/schemas/BreadcrumbSchema';
import { FAQPageSchema } from '../../components/schemas/FAQPageSchema';
import { ServiceSchema } from '../../components/schemas/ServiceSchema';
import { openContactModal } from '../../utils/contactForm';
import './orlando.css';

const OrlandoLanding: React.FC = () => {
  return (
    <>
      <Seo
        title="Pacotes para Orlando: Disney e Universal"
        description="Planeje sua viagem para Orlando com roteiro personalizado, ingressos e hospedagem. Atendimento especializado por agência de viagens em São Paulo."
        canonical="https://www.anhanga.tur.br/orlando/"
        noHreflang
      />
      <ServiceSchema
        name="Pacotes para Orlando 2026/2027"
        description="Planejamento de viagem para Orlando com suporte especializado, incluindo aéreo, hotel, ingressos e roteiro personalizado."
        serviceUrl="https://www.anhanga.tur.br/orlando/"
        serviceType="Planejamento de viagem para Orlando"
        areaServed="São Paulo e Brasil"
      />
      <BreadcrumbSchema
        items={[
          { name: 'Home', item: 'https://www.anhanga.tur.br/' },
          { name: 'Pacotes para Orlando', item: 'https://www.anhanga.tur.br/orlando/' }
        ]}
      />
      <FAQPageSchema items={ORLANDO_FAQ_ITEMS} />
      <div className="bg-brand-surface py-2 border-b border-zinc-100 relative z-[60]">
        <div className="container mx-auto px-6">
          <Link to="/" className="text-sm font-medium text-zinc-500 hover:text-anhanga-action transition-colors flex items-center gap-1 font-sans focus-visible:shadow-[inset_0_0_0_2px_theme(colors.anhanga.action)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-anhanga-action">
            ← Voltar para o site principal
          </Link>
        </div>
      </div>

      {/* React 19 native resource hints */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link
        href="https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Outfit:wght@400;700;900&display=swap"
        rel="stylesheet"
      />

      <OrlandoApp />
      <section className="bg-brand-surface border-t border-brand-cyan/10 py-14">
        <div className="container mx-auto px-6 max-w-5xl">
          <h2 className="text-3xl md:text-4xl font-black text-brand-dark mb-4">Pacotes para Orlando sem improviso</h2>
          <p className="text-zinc-700 text-lg leading-relaxed mb-5">
            Se você busca <strong>pacotes para Orlando</strong> com planejamento profissional, a Anhangá estrutura sua viagem com foco em custo-benefício, logística e experiência.
          </p>
          <p className="text-zinc-700 text-lg leading-relaxed mb-5">
            Definimos roteiro de parques, hospedagem por região, estratégia de ingressos e suporte antes e durante a viagem para você evitar erros comuns e aproveitar melhor cada dia de viagem.
          </p>
          <h3 className="text-xl md:text-2xl font-extrabold text-brand-dark mb-3">O que você pode incluir no pacote</h3>
          <ul className="list-disc list-inside text-zinc-700 space-y-1 mb-6">
            <li>Aéreo e hotel com perfil ideal para sua viagem</li>
            <li>Ingressos Disney e Universal com orientação de uso</li>
            <li>Roteiro diário personalizado por prioridade</li>
            <li>Suporte rápido por WhatsApp para ajustes</li>
          </ul>
          <div className="flex flex-wrap gap-3">
            {/* Texto Ardósia, não branco: o DESIGN.md registra que branco sobre
                Céu Vivo mede 2,8:1 — abaixo do piso de 4,5:1. E hover por
                brightness em vez de escurecer o fundo, que derruba o par. */}
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                openContactModal({ source: 'orlando' });
              }}
              className="btn-whatsapp btn-specialist px-5 py-3 rounded-full bg-anhanga-action text-anhanga-dark font-bold hover:brightness-105 transition-[filter] focus-visible:shadow-[inset_0_0_0_2px_theme(colors.anhanga.action)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-anhanga-action"
              data-tracking="footer-orlando"
              data-testid="cta-orlando-specialist"
            >
              Falar com especialista
            </button>
          </div>
        </div>
      </section>
    </>
  );
};

export default OrlandoLanding;

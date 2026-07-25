import React from 'react';
import { MotionConfig } from 'framer-motion';
import { Seo } from '@/components/Seo';
import { LandingFAQ } from '@/components/LandingFAQ';
import { BreadcrumbSchema } from '@/components/schemas/BreadcrumbSchema';
import { FAQPageSchema } from '@/components/schemas/FAQPageSchema';
import { ServiceSchema } from '@/components/schemas/ServiceSchema';
import { LandingNav } from '@/components/landings/shared/LandingNav';
import { LandingFooter } from '@/components/landings/shared/LandingFooter';
import {
  ConsultoriaAbout,
  ConsultoriaAudience,
  ConsultoriaBenefits,
  ConsultoriaFinalCta,
  ConsultoriaHero,
  ConsultoriaOtherServices,
  ConsultoriaProcess,
} from '@/components/landings/consultoria/ConsultoriaLandingSections';

const FAQ_ITEMS = [
  {
    question: 'O que é uma consultoria de viagem?',
    answer: 'É uma sessão com um consultor humano da Anhangá para entender seu perfil, destino e orçamento e montar o melhor roteiro — sem pacote pronto e sem improviso.'
  },
  {
    question: 'Quanto custa a consultoria?',
    // Sem "no momento": a ressalva plantava a dúvida que o hero ("Gratuito.")
    // trabalha para matar. Ver critique de /consultoria-de-viagem.
    answer: 'Nada. Você fala com um consultor gratuitamente, sem compromisso, e decide se quer fechar sua viagem com a Anhangá.'
  },
  {
    question: 'Vocês fazem viagens internacionais?',
    answer: 'Sim. A Anhangá Viagens planeja viagens internacionais para Europa, América do Norte, América do Sul, Ásia e Caribe, com foco em roteiros personalizados e suporte durante toda a viagem.'
  },
  {
    question: 'Qual o diferencial da Anhangá?',
    answer: 'Atendimento consultivo com consultor fixo do início ao fim, roteiro feito do zero para o seu perfil e suporte 24h via WhatsApp durante a viagem.'
  },
  {
    question: 'Qual o prazo para montar um roteiro?',
    answer: 'Entre 2 e 5 dias úteis após a conversa inicial, dependendo da complexidade do destino e do número de viajantes.'
  }
];

const ConsultoriaDeViagemLanding: React.FC = () => {
  return (
    <>
      {/*
        No-JS / pre-hydration fallback: framer-motion serializa os estilos
        `initial` (opacity:0) no HTML pré-renderizado. Sem JS a revelação
        nunca dispara e as seções ficariam em branco. Isso força visibilidade
        quando scripts estão desabilitados; com JS o seletor fica inerte e as
        entradas animam normalmente.
      */}
      <noscript>
        <style>{`[data-consultoria-landing] [style*="opacity"]{opacity:1!important}`}</style>
      </noscript>
      <MotionConfig reducedMotion="user">
      <div data-consultoria-landing className="bg-white min-h-screen font-sans">
        <Seo
          title="Consultoria de Viagem Sob Medida em SP — Anhangá Viagens"
          description="Planeje sua viagem com consultores humanos. Sem pacote pronto, sem improviso. Roteiro personalizado com suporte antes, durante e depois."
          canonical="https://www.anhanga.tur.br/consultoria-de-viagem/"
          noHreflang
        />
        <ServiceSchema
          name="Consultoria de Viagem Sob Medida"
          description="Planejamento personalizado de viagens com consultor humano, sem pacote pronto. Atendimento consultivo com suporte antes, durante e depois da viagem."
          serviceUrl="https://www.anhanga.tur.br/consultoria-de-viagem/"
          serviceType="Consultoria de Viagem"
          areaServed="São Paulo e Brasil"
        />
        <BreadcrumbSchema
          items={[
            { name: 'Home', item: 'https://www.anhanga.tur.br/' },
            { name: 'Consultoria de Viagem', item: 'https://www.anhanga.tur.br/consultoria-de-viagem/' }
          ]}
        />
        <FAQPageSchema items={FAQ_ITEMS} />

        <LandingNav source="consultoria-viagem" />
        <ConsultoriaHero />
        <ConsultoriaBenefits />
        <ConsultoriaAudience />
        <ConsultoriaProcess />
        <ConsultoriaAbout />
        <ConsultoriaFinalCta />
        <ConsultoriaOtherServices />
        <LandingFAQ
          items={FAQ_ITEMS}
          title="Dúvidas sobre consultoria de viagem"
          subtitle="Tire suas dúvidas sobre como funciona a consultoria personalizada da Anhangá."
        />
        <LandingFooter />
      </div>
      </MotionConfig>
    </>
  );
};

export default ConsultoriaDeViagemLanding;

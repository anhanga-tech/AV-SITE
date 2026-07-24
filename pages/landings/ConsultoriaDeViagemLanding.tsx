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
    question: 'O que é a consultoria de viagem da Anhangá?',
    answer: 'É uma sessão paga com um consultor humano para diagnosticar a sua viagem (destino, roteiro, milhas, orçamento) e te entregar um plano por escrito. Serve para quem está começando a planejar e para quem já comprou a viagem e quer aproveitá-la melhor.'
  },
  {
    question: 'Quanto custa?',
    answer: 'R$ 250 por uma sessão de 50 minutos, com o plano por escrito incluído. Se você seguir com a consultoria completa (o roteiro executado pela gente), esse valor é abatido.'
  },
  {
    question: 'Vocês não são uma agência? Por que a consultoria é paga?',
    answer: 'Somos. Organizar e emitir a sua viagem, o agenciamento, continua sendo uma conversa gratuita. A consultoria paga é para quando você quer o diagnóstico e o roteiro em si: passagem já emitida, milhas próprias, extensão de uma viagem de trabalho.'
  },
  {
    question: 'E se eu precisar remarcar ou não puder comparecer?',
    answer: 'Você pode remarcar uma vez até 24h antes, sem custo. Em caso de falta, o valor vira um crédito de 90 dias, usável numa nova sessão ou na consultoria completa.'
  },
  {
    question: 'Posso desistir e pedir reembolso?',
    answer: 'Pode. Se desistir em até 7 dias e antes de a sessão acontecer, devolvemos o valor. Depois disso, ou se a sessão já ocorreu, o valor fica como crédito.'
  },
  {
    question: 'A sessão é presencial?',
    answer: 'Não. É por videochamada, com link no e-mail de confirmação. Atendemos viajantes de todo o Brasil.'
  },
  {
    question: 'Em quanto tempo recebo o plano?',
    answer: 'Em até 48h úteis após a sessão.'
  },
  {
    question: 'Vocês fazem viagens internacionais?',
    answer: 'Sim. A Anhangá Viagens planeja viagens internacionais para Europa, América do Norte, América do Sul, Ásia e Caribe, com foco em roteiros personalizados e suporte durante toda a viagem.'
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
          title="Consultoria de Viagem com Especialista — Anhangá Viagens"
          description="Sessão de 50 min com um consultor para diagnosticar sua viagem: destino, roteiro, milhas, orçamento. Você sai com um plano por escrito. R$ 250, abatidos na consultoria completa."
          canonical="https://www.anhanga.tur.br/consultoria-de-viagem/"
          noHreflang
        />
        <ServiceSchema
          name="Consultoria de Viagem com Especialista"
          description="Sessão paga de diagnóstico de viagem com consultor humano: destino, roteiro, milhas e orçamento, com plano por escrito entregue em até 48h. Por videochamada, para viajantes de todo o Brasil."
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

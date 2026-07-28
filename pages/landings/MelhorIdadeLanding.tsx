import React from 'react';
import { Seo } from '@/components/Seo';
import { LandingFAQ } from '@/components/LandingFAQ';
import { BreadcrumbSchema } from '@/components/schemas/BreadcrumbSchema';
import { FAQPageSchema } from '@/components/schemas/FAQPageSchema';
import { ServiceSchema } from '@/components/schemas/ServiceSchema';
import {
  MelhorIdadeAdvisory,
  MelhorIdadeContent,
  MelhorIdadeFinalCta,
  MelhorIdadeHero,
  MelhorIdadeNav,
  MelhorIdadePillars,
  MelhorIdadeRhythm,
} from '@/components/landings/melhor-idade/MelhorIdadeLandingSections';

const MELHOR_IDADE_FAQ_ITEMS = [
  {
    question: 'O que define uma viagem para a melhor idade na Anhangá?',
    answer: 'Nossos roteiros focam em ritmo desacelerado, conforto extremo, hotéis com acessibilidade, suporte 24h e curadoria de experiências que valorizam a cultura e a gastronomia local, sem o estresse de deslocamentos exaustivos.'
  },
  {
    question: 'A agência oferece acompanhamento durante a viagem?',
    answer: 'Oferecemos suporte remoto 24h via WhatsApp para qualquer imprevisto. Para grupos específicos, podemos organizar guias acompanhantes especializados no público 50+ que cuidam de toda a logística e bem-estar do grupo.'
  },
  {
    question: 'Quais os destinos mais recomendados para o público 50+?',
    answer: 'Destinos como Portugal, Itália (especialmente Toscana), Gramado no Brasil, e cruzeiros de luxo são favoritos pela infraestrutura e riqueza cultural. Também adaptamos destinos como Orlando com foco em ritmo adequado e conforto.'
  },
  {
    question: 'Como funciona o atendimento personalizado?',
    answer: 'Realizamos uma conversa detalhada para entender preferências de mobilidade, restrições alimentares e interesses culturais. A partir disso, desenhamos um roteiro que respeita o seu tempo e prioriza sua segurança.'
  }
];

const MelhorIdadeLanding: React.FC = () => {
  return (
    <div className="bg-anhanga-light min-h-screen font-sans">
      <Seo
        title="Turismo 50+: Viagens Personalizadas"
        description="Experiências de viagem exclusivas para o público 50+. Roteiros com conforto, segurança e atendimento humano. Planeje sua próxima aventura com a Anhangá."
        canonical="https://www.anhanga.tur.br/melhor-idade/"
        noHreflang
      />
      <ServiceSchema
        name="Viagens Personalizadas Melhor Idade"
        description="Planejamento de viagens focadas no público 50+, com foco em segurança, conforto e experiências culturais enriquecedoras."
        serviceUrl="https://www.anhanga.tur.br/melhor-idade/"
        serviceType="Turismo para Melhor Idade"
        areaServed="Brasil"
      />
      <BreadcrumbSchema
        items={[
          { name: 'Home', item: 'https://www.anhanga.tur.br/' },
          { name: 'Melhor Idade', item: 'https://www.anhanga.tur.br/melhor-idade/' }
        ]}
      />
      <FAQPageSchema items={MELHOR_IDADE_FAQ_ITEMS} />

      <MelhorIdadeNav />
      <MelhorIdadeHero />
      <MelhorIdadePillars />
      <MelhorIdadeRhythm />
      <MelhorIdadeAdvisory />
      <MelhorIdadeContent />
      <LandingFAQ items={MELHOR_IDADE_FAQ_ITEMS} />
      <MelhorIdadeFinalCta />
    </div>
  );
};

export default MelhorIdadeLanding;

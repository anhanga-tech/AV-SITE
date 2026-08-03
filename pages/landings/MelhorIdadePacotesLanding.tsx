import React from 'react';
import { MotionConfig } from 'framer-motion';
import { Seo } from '@/components/Seo';
import { BreadcrumbSchema } from '@/components/schemas/BreadcrumbSchema';
import { ServiceSchema } from '@/components/schemas/ServiceSchema';
import {
  PastorePacotesFinalCta,
  PastorePacotesFooter,
  PastorePacotesHero,
  PastorePacotesList,
  PastorePacotesMiniHeader,
} from '@/components/landings/melhor-idade/PastorePacotesSections';
import { PASTORE_PACKAGES } from '@/data/pastorePackages';
import { getActiveOffers } from '@/lib/cruise-offers-schedule.js';

// Filtra os pacotes vencidos no topo do módulo (import-time), não no render:
// o prerender (build) e o cliente rodam este mesmo caminho e concordam sobre a
// lista. Reaproveita getActiveOffers de lib/cruise-offers-schedule.js — a
// lógica de expiração por `expiraEm` é genérica, não específica de cruzeiro.
const ACTIVE_PACKAGES = getActiveOffers(PASTORE_PACKAGES);
const FEATURED_PACKAGE = ACTIVE_PACKAGES.find((p) => p.featured);
const SECONDARY_PACKAGES = ACTIVE_PACKAGES.filter((p) => p !== FEATURED_PACKAGE);

const MelhorIdadePacotesLanding: React.FC = () => {
  return (
    <>
      {/*
        No-JS / pre-hydration fallback: framer-motion serializa os estilos
        `initial` (opacity:0) no HTML pré-renderizado. Sem JS a revelação
        nunca dispara e a lista de pacotes ficaria em branco. Mesmo padrão de
        /cruzeiros e /consultoria-de-viagem.
      */}
      <noscript>
        <style>{`[data-pastore-pacotes-landing] [style*="opacity"]{opacity:1!important}`}</style>
      </noscript>
      <MotionConfig reducedMotion="user">
        <div data-pastore-pacotes-landing className="bg-anhanga-light min-h-screen font-sans">
          <Seo
            title="Pacotes Pastore 50+ | Anhangá Viagens"
            description="Pacotes em grupo da temporada 2026/2027 da Pastore Turismo para o público 50+, com curadoria da Anhangá e especialista para confirmar disponibilidade."
            canonical="https://www.anhanga.tur.br/melhor-idade/pacotes-pastore/"
            noHreflang
          />
          <ServiceSchema
            name="Pacotes em Grupo Pastore Turismo — Melhor Idade"
            description="Seleção de pacotes em grupo da temporada 2026/2027 da Pastore Turismo, parceira da Anhangá Viagens, para o público 50+."
            serviceUrl="https://www.anhanga.tur.br/melhor-idade/pacotes-pastore/"
            serviceType="Turismo em Grupo para Melhor Idade"
            areaServed="Brasil"
          />
          <BreadcrumbSchema
            items={[
              { name: 'Home', item: 'https://www.anhanga.tur.br/' },
              { name: 'Melhor Idade', item: 'https://www.anhanga.tur.br/melhor-idade/' },
              { name: 'Pacotes Pastore', item: 'https://www.anhanga.tur.br/melhor-idade/pacotes-pastore/' }
            ]}
          />

          <PastorePacotesMiniHeader />
          <PastorePacotesHero />
          <PastorePacotesList
            featuredPackage={FEATURED_PACKAGE}
            secondaryPackages={SECONDARY_PACKAGES}
          />
          <PastorePacotesFinalCta />
          <PastorePacotesFooter />
        </div>
      </MotionConfig>
    </>
  );
};

export default MelhorIdadePacotesLanding;

import React from 'react';
import { MotionConfig } from 'framer-motion';
import { Seo } from '@/components/Seo';
import { LandingFAQ } from '@/components/LandingFAQ';
import { BreadcrumbSchema } from '@/components/schemas/BreadcrumbSchema';
import { FAQPageSchema } from '@/components/schemas/FAQPageSchema';
import { ServiceSchema } from '@/components/schemas/ServiceSchema';
import {
  CruiseAbout,
  CruiseCurationBenefits,
  CruiseFinalCta,
  CruiseHero,
  CruiseLandingFooter,
  CruiseMiniHeader,
  CruiseOffersSection,
  CruiseOtherServices,
  CruiseProcess,
} from '@/components/landings/cruzeiros/CruzeirosLandingSections';
import { CRUISE_OFFERS } from '@/data/cruiseOffers';
import { getActiveOffers } from '@/lib/cruise-offers-schedule.js';

// Filtra as ofertas vencidas no topo do módulo (import-time), não no render:
// o prerender (build) e o cliente rodam este mesmo caminho e concordam sobre a
// lista. Ver lib/cruise-offers-schedule.js para a janela de divergência.
const ACTIVE_OFFERS = getActiveOffers(CRUISE_OFFERS);
const FEATURED_OFFER = ACTIVE_OFFERS.find((o) => o.featured);
const SECONDARY_OFFERS = ACTIVE_OFFERS.filter((o) => o !== FEATURED_OFFER);

const FAQ_ITEMS = [
  {
    question: 'Qual o melhor cruzeiro para a primeira vez?',
    answer: 'Depende do seu perfil — casal, família, solo, orçamento, preferência de roteiro. É exatamente isso que a curadoria resolve: encontrar o navio, a cabine e a saída certos para você antes de fechar.'
  },
  {
    question: 'Vocês trabalham só com saídas do Brasil?',
    answer: 'Não. Temos cruzeiros saindo de Santos e do Rio de Janeiro na temporada brasileira 2026/2027, e também roteiros internacionais — Mediterrâneo, Caribe e outros. A seleção acima muda conforme a temporada e a disponibilidade dos armadores.'
  },
  {
    question: 'Cabine interna ou com varanda?',
    answer: 'Para a primeira vez, a cabine com varanda costuma valer pelo conforto e pela experiência visual durante o roteiro. Mas depende do orçamento e do navio. Explicamos as diferenças na conversa.'
  },
  {
    question: 'Tem cruzeiro bom para família com criança pequena?',
    answer: 'Sim. Alguns navios têm estrutura kids excelente com monitores, piscinas infantis e programação específica. Indicamos o certo para a faixa etária dos seus filhos.'
  },
  {
    question: 'As ofertas do site têm preço fechado?',
    answer: 'As ofertas mostram navio, roteiro, porto de saída e período — o valor depende de cabine, número de passageiros e extras, e a gente fecha isso na conversa, sem taxa de curadoria.'
  },
  {
    question: 'Quando começa a temporada de cruzeiros 2026/2027 no Brasil?',
    answer: 'As saídas da temporada brasileira 2026/2027 vão de janeiro a março de 2027, embarcando em Santos. As datas mudam conforme os armadores confirmam a programação. Veja a seleção acima ou fale com um especialista para as saídas mais recentes.'
  }
];

const CruzeirosLanding: React.FC = () => {
  return (
    <>
      {/*
        No-JS / pre-hydration fallback: framer-motion serializa os estilos
        `initial` (opacity:0) no HTML pré-renderizado. Sem JS a revelação
        nunca dispara e as seções ficariam em branco. Isso força visibilidade
        quando scripts estão desabilitados; com JS o seletor fica inerte e as
        entradas animam normalmente. Mesmo padrão de /consultoria-de-viagem.
      */}
      <noscript>
        <style>{`[data-cruzeiros-landing] [style*="opacity"]{opacity:1!important}`}</style>
      </noscript>
      <MotionConfig reducedMotion="user">
        <div data-cruzeiros-landing className="bg-anhanga-light min-h-screen font-sans">
          <Seo
            title="Cruzeiros Temporada 2026/2027 | Anhangá Viagens"
            description="Ofertas de cruzeiros da temporada 2026/2027, saídas do Brasil e roteiros internacionais, com curadoria para acertar navio, cabine e data antes de fechar."
            canonical="https://www.anhanga.tur.br/cruzeiros/"
            noHreflang
          />
          <ServiceSchema
            name="Cruzeiros — Ofertas e Curadoria"
            description="Seleção de cruzeiros da temporada 2026/2027 no Brasil e internacionais, com atendimento consultivo para escolher navio, cabine, roteiro e datas ideais. Para casais, famílias e primeira viagem."
            serviceUrl="https://www.anhanga.tur.br/cruzeiros/"
            serviceType="Cruzeiros"
            areaServed="Brasil"
          />
          <BreadcrumbSchema
            items={[
              { name: 'Home', item: 'https://www.anhanga.tur.br/' },
              { name: 'Cruzeiros', item: 'https://www.anhanga.tur.br/cruzeiros/' }
            ]}
          />
          <FAQPageSchema items={FAQ_ITEMS} />

          <CruiseMiniHeader />
          <CruiseHero />
          <CruiseOffersSection
            featuredOffer={FEATURED_OFFER}
            secondaryOffers={SECONDARY_OFFERS}
          />
          <CruiseProcess />
          <CruiseCurationBenefits />
          <CruiseAbout />
          <CruiseFinalCta />
          <CruiseOtherServices />
          <LandingFAQ
            items={FAQ_ITEMS}
            title="Dúvidas sobre cruzeiros"
            subtitle="Tire suas dúvidas antes de escolher seu cruzeiro."
          />
          <CruiseLandingFooter />
        </div>
      </MotionConfig>
    </>
  );
};

export default CruzeirosLanding;

import React, { useCallback } from 'react';
import { Seo } from '../components/Seo';
import { LandingFAQ } from '../components/LandingFAQ';
import { BreadcrumbSchema } from '../components/schemas/BreadcrumbSchema';
import { FAQPageSchema } from '../components/schemas/FAQPageSchema';
import { StructuredData } from '../components/schemas/StructuredData';
import {
  ComparisonSection,
  CredentialedSection,
  PackageSection,
  ParquesCta,
  ParquesHero,
  UpcomingSection,
} from '../components/parques-brasil/ParquesBrasilSections';
import { BOOKABLE_PARKS, PARQUES_FAQ_ITEMS } from '../components/parques-brasil/constants';
import { openContactModal } from '../utils/contactForm';
import { useWhatsAppLink } from '../utils/whatsapp';

const PAGE_URL = 'https://www.anhanga.tur.br/parques-brasil/';

const WHATSAPP_MESSAGE =
  'Olá! Estou escolhendo um parque no Brasil para viajar com a família e queria ajuda para decidir.';

/*
  ItemList em vez de Service: a página não vende um serviço só — ela lista
  cinco destinos comparáveis. `TouristAttraction` por item é o tipo que
  motores de resposta usam para montar comparação de destino.
*/
const parksItemList = {
  '@context': 'https://schema.org',
  '@type': 'ItemList',
  name: 'Parques do Brasil atendidos pela Anhangá Viagens',
  itemListOrder: 'https://schema.org/ItemListUnordered',
  numberOfItems: BOOKABLE_PARKS.length,
  itemListElement: BOOKABLE_PARKS.map((park, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    item: {
      '@type': 'TouristAttraction',
      name: park.name,
      description: park.claim,
      address: {
        '@type': 'PostalAddress',
        addressLocality: park.city,
        addressRegion: park.state,
        addressCountry: 'BR',
      },
      ...(park.href ? { url: `https://www.anhanga.tur.br${park.href}/` } : {}),
    },
  })),
};

const ParquesBrasil: React.FC = () => {
  const whatsappUrl = useWhatsAppLink(WHATSAPP_MESSAGE);

  const handleCtaClick = useCallback(() => {
    openContactModal({ source: 'parques-brasil' });
  }, []);

  return (
    <>
      <Seo
        title="Parques do Brasil: qual escolher"
        description="Beto Carrero, Hopi Hari, Thermas dos Laranjais, Beach Park e Hot Park comparados por perfil, duração e época. Agente credenciado Beto Carrero e Hopi Hari."
        canonical={PAGE_URL}
      />
      <BreadcrumbSchema
        items={[
          { name: 'Home', item: 'https://www.anhanga.tur.br/' },
          { name: 'Parques no Brasil', item: PAGE_URL },
        ]}
      />
      <FAQPageSchema items={PARQUES_FAQ_ITEMS} />
      <StructuredData id="parques-itemlist" data={parksItemList} />

      <ParquesHero />
      <CredentialedSection />
      <PackageSection />
      <ComparisonSection />
      <UpcomingSection />

      {/* LandingFAQ já traz a própria <section> e container — envolvê-lo
          aninhava seção em seção e dobrava o padding. */}
      <LandingFAQ
        items={PARQUES_FAQ_ITEMS}
        title="Perguntas que chegam antes da viagem"
        subtitle="O que costuma decidir entre um parque e outro."
      />

      <ParquesCta onCtaClick={handleCtaClick} whatsappUrl={whatsappUrl} />
    </>
  );
};

export default ParquesBrasil;

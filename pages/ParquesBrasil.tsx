import React, { useCallback } from 'react';
import { Seo } from '../components/Seo';
import { LandingFAQ } from '../components/LandingFAQ';
import { BreadcrumbSchema } from '../components/schemas/BreadcrumbSchema';
import { FAQPageSchema } from '../components/schemas/FAQPageSchema';
import { ItemListSchema } from '../components/schemas/ItemListSchema';
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
      <ItemListSchema
        id="parques-itemlist"
        name="Parques do Brasil atendidos pela Anhangá Viagens"
        items={BOOKABLE_PARKS.map(({ name, claim: description, city, state, href }) => ({
          name,
          description,
          city,
          state,
          href,
        }))}
      />

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

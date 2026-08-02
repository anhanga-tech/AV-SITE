import React from 'react';
import { Seo } from '@/components/Seo';
import { LandingFAQ } from '@/components/LandingFAQ';
import { BreadcrumbSchema } from '@/components/schemas/BreadcrumbSchema';
import { FAQPageSchema } from '@/components/schemas/FAQPageSchema';
import { ServiceSchema } from '@/components/schemas/ServiceSchema';
import { LandingNav } from '@/components/landings/shared/LandingNav';
import { LandingFooter } from '@/components/landings/shared/LandingFooter';
import {
  HopiHariContent,
  HopiHariFinalCta,
  HopiHariHero,
  HopiHariOtherServices,
} from '@/components/landings/hopi-hari/HopiHariLandingSections';

const HOPI_FAQ_ITEMS = [
  {
    question: 'Dá para fazer o Hopi Hari em um dia só?',
    answer: 'Dá. Diferente do Beto Carrero, que pede 2 dias inteiros de parque, o Hopi Hari resolve numa única visita — o que também facilita um bate-volta saindo da capital paulista.'
  },
  {
    question: 'O Hopi Hari é bom para criança pequena?',
    answer: 'Rende menos do que para adolescente e adulto. O parque concentra atrações radicais, então quem viaja com filho pequeno costuma aproveitar mais o Beto Carrero World, que tem áreas temáticas pensadas para essa faixa etária.'
  },
  {
    question: 'Qual a melhor época para visitar o Hopi Hari?',
    answer: 'Dia de semana, fora de férias escolares. A diferença de fila entre um sábado de julho e uma terça-feira comum é grande.'
  },
  {
    question: 'A Anhangá é credenciada no Hopi Hari?',
    answer: 'Somos agente credenciado do Hopi Hari, o que permite emitir ingresso oficial com suporte direto — a mesma relação que temos com o Beto Carrero World.'
  },
  {
    question: 'Onde fica o Hopi Hari?',
    answer: 'Em Vinhedo (SP), na Rodovia Bandeirantes, a cerca de 70 km da capital — o parque temático mais próximo de São Paulo entre os que a Anhangá vende.'
  }
];

const HopiHariLanding: React.FC = () => {
  return (
    <div className="bg-white min-h-screen font-sans">
      <Seo
        title="Pacote Hopi Hari"
        description="Garanta seu pacote para o Hopi Hari com ingresso oficial, hospedagem e transporte. Planejamento completo com o suporte da Anhangá Viagens, agente credenciado do parque."
        canonical="https://www.anhanga.tur.br/hopi-hari/"
        noHreflang
      />
      <ServiceSchema
        name="Pacote Hopi Hari"
        description="Planejamento de pacote para o Hopi Hari com ingresso oficial, hospedagem, transporte e suporte especializado."
        serviceUrl="https://www.anhanga.tur.br/hopi-hari/"
        serviceType="Pacote de viagem para parque temático"
        areaServed="São Paulo e Brasil"
      />
      {/* O hub /parques-brasil é o pai desta página na árvore do site — mesma
          hierarquia declarada em BetoCarreroLanding.tsx, o outro filho do hub. */}
      <BreadcrumbSchema
        items={[
          { name: 'Home', item: 'https://www.anhanga.tur.br/' },
          { name: 'Parques no Brasil', item: 'https://www.anhanga.tur.br/parques-brasil/' },
          { name: 'Pacote Hopi Hari', item: 'https://www.anhanga.tur.br/hopi-hari/' }
        ]}
      />
      <FAQPageSchema items={HOPI_FAQ_ITEMS} />

      <LandingNav source="hopi-hari" />
      <HopiHariHero />
      <HopiHariContent />
      <HopiHariOtherServices />
      <LandingFAQ
        items={HOPI_FAQ_ITEMS}
        title="Dúvidas sobre o Hopi Hari"
        subtitle="Tire suas dúvidas antes de fechar seu pacote."
      />
      <HopiHariFinalCta />
      <LandingFooter />
    </div>
  );
};

export default HopiHariLanding;

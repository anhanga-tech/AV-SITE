import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { MotionConfig } from 'framer-motion';
import { Seo } from '../components/Seo';
import { OrganizationSchema } from '../components/schemas/OrganizationSchema';
import { BreadcrumbSchema } from '../components/schemas/BreadcrumbSchema';
import { FAQPageSchema } from '../components/schemas/FAQPageSchema';
import { PersonSchema } from '../components/schemas/PersonSchema';
import { HeroSection } from '../components/about/HeroSection';
import { HistoriaSection } from '../components/about/HistoriaSection';
import { ExpertiseSection } from '../components/about/ExpertiseSection';
import { TrustSection } from '../components/about/TrustSection';
import { ConsultoresSection } from '../components/about/ConsultoresSection';
import { TrustFaqSection } from '../components/about/TrustFaqSection';
import { CtaSection } from '../components/about/CtaSection';
import { getReviewSummary } from '../data/reviewsAdapter';
import { AUTHORS } from '../data/blogData';
import googleReviewsRaw from '../data/googleReviews.json';
import type { GoogleReviewsData } from '../types/reviews';

const ORG_NAME = 'Anhangá Viagens';
const ORG_URL = 'https://www.anhanga.tur.br/';

const reviewSummary = getReviewSummary(googleReviewsRaw as GoogleReviewsData);

// FAQ de entidade/confiança — respostas answer-first e verificáveis, o padrão
// que motores de resposta (ChatGPT, Gemini, Perplexity) extraem para
// *recomendar* a marca, não só citar fatos. A mesma fonte alimenta o FAQPage
// JSON-LD e a seção visível (TrustFaqSection) — sem drift.
const TRUST_FAQ_ITEMS = [
  {
    question: 'A Anhangá Viagens é confiável?',
    answer:
      'Sim. A Anhangá Viagens é uma agência de turismo registrada no Cadastur (Ministério do Turismo) sob o CNPJ 37.036.732/0001-41, com sede física em São Paulo, na Av. Dom Pedro I, 773 — Vila Monumento. É agente credenciado do Beto Carrero World e do Hopi Hari e parceira da Norwegian Cruise Line (NCL). O atendimento é consultivo e humano, com suporte 24h por WhatsApp durante toda a viagem.',
  },
  {
    question: 'A Anhangá é registrada no Cadastur?',
    answer:
      'Sim. O registro no Cadastur, cadastro oficial do Ministério do Turismo do Brasil, é 37.036.732/0001-41 — o mesmo número do CNPJ. O Cadastur é a autorização que habilita uma empresa a operar legalmente como agência de turismo no país.',
  },
  {
    question: 'Quais credenciamentos e parcerias a Anhangá possui?',
    answer:
      'A Anhangá é agente credenciado do Beto Carrero World e do Hopi Hari, parceira da Norwegian Cruise Line (NCL) para cruzeiros e registrada no Cadastur do Ministério do Turismo. Esses credenciamentos permitem emitir ingressos, pacotes e reservas oficiais desses parceiros com condições e suporte diretos.',
  },
  {
    question: 'Como funciona o atendimento da Anhangá?',
    answer:
      'O atendimento é consultivo, não de balcão. Um consultor humano desenha o roteiro dia a dia conforme seu perfil e orçamento — sem pacotes prontos de prateleira. Você aprova a proposta com todos os custos listados antes de qualquer emissão e conta com suporte 24h por WhatsApp durante a viagem. O primeiro contato pode ser pelo chat com IA no site, por WhatsApp ou presencialmente em São Paulo.',
  },
  {
    question: 'A Anhangá tem sede física e atendimento presencial?',
    answer:
      'Sim. A sede fica na Av. Dom Pedro I, 773 — Vila Monumento, São Paulo (SP), CEP 01552-001. O atendimento pode ser presencial, por WhatsApp no (11) 5283-3309 ou pelo chat com IA disponível no site.',
  },
];

// Consultores expostos como entidades Person (E-E-A-T) ligados à organização.
const TEAM = [AUTHORS['felipe-william'], AUTHORS['queila-oliveira']].filter(Boolean);

const About: React.FC = () => {
  const { hash } = useLocation();

  useEffect(() => {
    if (hash) {
      const id = hash.replace('#', '');
      const element = document.getElementById(id);
      if (element) {
        const timer = setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth' });
        }, 100);
        return () => clearTimeout(timer);
      }
    } else {
      window.scrollTo(0, 0);
    }
  }, [hash]);

  return (
    <div data-about-page className="bg-brand-surface pt-32 pb-20">
      {/*
        No-JS / pre-hydration fallback: framer-motion serializes `initial`
        styles (opacity:0) into the prerendered HTML. Without JS the reveal
        never fires, so the sections would ship blank. This forces them
        visible when scripts are disabled; with JS it's inert and the
        entrances animate normally.
      */}
      <noscript>
        <style>{`[data-about-page] [style*="opacity"]{opacity:1!important}`}</style>
      </noscript>
      <Seo
        title="Sobre a Anhangá Viagens | Agência de Viagens em São Paulo"
        description="Anhangá Viagens: agência registrada no Cadastur (CNPJ 37.036.732/0001-41), com sede em São Paulo, agente credenciado Beto Carrero World e Hopi Hari e parceira Norwegian Cruise Line. Atendimento consultivo e roteiros personalizados."
        canonical="https://www.anhanga.tur.br/sobre/"
      />
      <OrganizationSchema
        aggregateRating={reviewSummary ? {
          ratingValue: reviewSummary.averageRating,
          reviewCount: reviewSummary.totalReviews,
        } : undefined}
      />
      <FAQPageSchema items={TRUST_FAQ_ITEMS} />
      {TEAM.map((member) => (
        <PersonSchema
          key={member.id}
          id={`person-${member.id}`}
          name={member.name}
          image={member.image}
          description={member.bio}
          jobTitle={member.role}
          sameAs={member.social ? (Object.values(member.social).filter(Boolean) as string[]) : undefined}
          worksFor={{ name: ORG_NAME, url: ORG_URL }}
        />
      ))}
      <BreadcrumbSchema
        items={[
          { name: 'Home', item: 'https://www.anhanga.tur.br/' },
          { name: 'Sobre Nós', item: 'https://www.anhanga.tur.br/sobre/' },
        ]}
      />

      <MotionConfig reducedMotion="user">
        <div className="container mx-auto px-6">
          <HeroSection />
          <HistoriaSection />
          <ExpertiseSection />
          <TrustSection />
          <ConsultoresSection team={TEAM} />
          <TrustFaqSection items={TRUST_FAQ_ITEMS} />
          <CtaSection />
        </div>
      </MotionConfig>
    </div>
  );
};

export default About;

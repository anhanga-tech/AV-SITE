import React, { useEffect, Suspense, lazy } from 'react';
import { useLocation, Link } from 'react-router-dom';
import Hero from '../components/Hero';

import { OrganizationSchema } from '../components/schemas/OrganizationSchema';
import { FAQPageSchema } from '../components/schemas/FAQPageSchema';
import { BreadcrumbSchema } from '../components/schemas/BreadcrumbSchema';
import { ServiceSchema } from '../components/schemas/ServiceSchema';
import { FAQ_SCHEMA_ITEMS } from '../data/faqData';
import { getReviewSummary } from '../data/reviewsAdapter';
import type { GoogleReviewsData } from '../types/reviews';
import googleReviewsRaw from '../data/googleReviews.json';

const reviewSummary = getReviewSummary(googleReviewsRaw as GoogleReviewsData);

import { Seo } from '../components/Seo';

const Highlights = lazy(() => import('../components/Highlights'));
const Categories = lazy(() => import('../components/Categories'));
const Destinations = lazy(() => import('../components/Destinations'));
const HowItWorks = lazy(() => import('../components/HowItWorks'));
const Testimonials = lazy(() => import('../components/Testimonials'));
const Blog = lazy(() => import('../components/Blog'));
const Faq = lazy(() => import('../components/Faq'));
const CallToAction = lazy(() => import('../components/CallToAction'));

const Home: React.FC = () => {
  const location = useLocation();
  const [shouldRenderBelowFold, setShouldRenderBelowFold] = React.useState(false);
  const [shouldLoadDestinations, setShouldLoadDestinations] = React.useState(false);
  const destinationsSentinelRef = React.useRef<HTMLDivElement>(null);

  // Efeito para lidar com navegação vinda de outras páginas (ex: Blog -> Seção Home)
  useEffect(() => {
    // Verifica se há um targetId no estado da navegação
    if (location.state && location.state.targetId) {
      setShouldRenderBelowFold(true);
      const targetId = location.state.targetId;
      const element = document.getElementById(targetId);

      if (element) {
        // Pequeno timeout para garantir que o DOM esteja pronto
        const timer = setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth' });
        }, 100);

        // Limpeza opcional do estado (embora o history mantenha, evita scrolls indesejados em refresh simples sem limpar history)
        window.history.replaceState({}, document.title);
        return () => clearTimeout(timer);
      }
    }
  }, [location]);

  useEffect(() => {
    if (shouldRenderBelowFold) return;

    let cancelled = false;
    const enable = () => {
      if (!cancelled) {
        setShouldRenderBelowFold(true);
      }
      cleanup();
    };
    const onIntent = () => enable();
    const cleanup = () => {
      window.removeEventListener('scroll', onIntent);
      window.removeEventListener('pointerdown', onIntent);
      window.removeEventListener('keydown', onIntent);
    };

    window.addEventListener('scroll', onIntent, { passive: true, once: true });
    window.addEventListener('pointerdown', onIntent, { passive: true, once: true });
    window.addEventListener('keydown', onIntent, { passive: true, once: true });

    const timer = window.setTimeout(enable, 10000);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      cleanup();
    };
  }, [shouldRenderBelowFold]);

  useEffect(() => {
    if (!destinationsSentinelRef.current) return;
    if (shouldLoadDestinations) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (first?.isIntersecting) {
          setShouldLoadDestinations(true);
          observer.disconnect();
        }
      },
      { rootMargin: '300px 0px', threshold: 0.01 }
    );

    observer.observe(destinationsSentinelRef.current);
    return () => observer.disconnect();
  }, [shouldLoadDestinations]);

  return (
    <>
      <Seo
        title="Agência de Viagens em São Paulo | Anhangá Viagens"
        description="Agência de viagens em São Paulo. Cada roteiro começa do zero — sem pacote pronto. Orlando, Beto Carrero, Europa e muito mais. Orçamento gratuito."
        canonical="https://www.anhanga.tur.br/"
      />
      <OrganizationSchema
        aggregateRating={reviewSummary ? {
          ratingValue: reviewSummary.averageRating,
          reviewCount: reviewSummary.totalReviews,
        } : undefined}
      />
      <FAQPageSchema items={FAQ_SCHEMA_ITEMS} />
      <BreadcrumbSchema
        items={[{ name: 'Home', item: 'https://www.anhanga.tur.br/' }]}
      />
      <ServiceSchema
        name="Agência de Viagens Personalizadas"
        description="Roteiros de viagem 100% personalizados para casais, famílias e grupos. Especialistas em Orlando, Beto Carrero, Europa, Lollapalooza e turismo 50+. Atendimento humano em São Paulo."
        serviceUrl="https://www.anhanga.tur.br/"
        serviceType="Agência de Viagens"
        areaServed="São Paulo, Brasil"
      />
      <Hero />

      {shouldRenderBelowFold ? (
        <>
          <Suspense fallback={<section id="experiencia" className="min-h-[700px] bg-brand-surface" />}>
            <Highlights />
          </Suspense>
          <Suspense fallback={<section className="min-h-[300px] bg-brand-surface" />}>
            <Categories />
          </Suspense>
        </>
      ) : (
        <>
          <section id="experiencia" className="min-h-[700px] bg-brand-surface" />
          <section className="min-h-[300px] bg-brand-surface" />
        </>
      )}
      <div id="destinos" ref={destinationsSentinelRef} />
      {shouldRenderBelowFold && shouldLoadDestinations ? (
        <Suspense fallback={<section className="min-h-[900px] bg-brand-surface" />}>
          <Destinations />
        </Suspense>
      ) : (
        <section className="min-h-[900px] bg-brand-surface" />
      )}
      {shouldRenderBelowFold ? (
        <>
          <Suspense fallback={<section id="como-funciona" className="min-h-[800px] bg-brand-surface" />}>
            <HowItWorks />
          </Suspense>
          <Suspense fallback={<section id="faq" className="min-h-[600px] bg-brand-surface" />}>
            <Faq />
          </Suspense>
          <Suspense fallback={<section id="depoimentos" className="min-h-[500px] bg-brand-surface" />}>
            <Testimonials />
          </Suspense>
          <Suspense fallback={<section id="blog" className="min-h-[500px] bg-brand-surface" />}>
            <Blog />
          </Suspense>
          <Suspense fallback={<section id="contato" className="min-h-[400px] bg-brand-surface" />}>
            <CallToAction />
          </Suspense>
        </>
      ) : (
        <>
          <section id="como-funciona" className="min-h-[800px] bg-brand-surface" />
          <section id="faq" className="min-h-[600px] bg-brand-surface" />
          <section id="depoimentos" className="min-h-[500px] bg-brand-surface" />
          <section id="blog" className="min-h-[500px] bg-brand-surface" />
          <section id="contato" className="min-h-[400px] bg-brand-surface" />
        </>
      )}
    </>
  );
};

export default Home;

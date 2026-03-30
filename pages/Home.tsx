import React, { useEffect, Suspense, lazy } from 'react';
import { useLocation, Link } from 'react-router-dom';
import Hero from '../components/Hero';

import { OrganizationSchema } from '../components/schemas/OrganizationSchema';
import { FAQPageSchema } from '../components/schemas/FAQPageSchema';
import { BreadcrumbSchema } from '../components/schemas/BreadcrumbSchema';
import { ServiceSchema } from '../components/schemas/ServiceSchema';
import { FAQ_SCHEMA_ITEMS } from '../data/faqData';

import { SEO } from '../components/SEO';

const Highlights = lazy(() => import('../components/Highlights'));
const Categories = lazy(() => import('../components/Categories'));
const Destinations = lazy(() => import('../components/Destinations'));
const HowItWorks = lazy(() => import('../components/HowItWorks'));
const Testimonials = lazy(() => import('../components/Testimonials'));
const Blog = lazy(() => import('../components/Blog'));
const FAQ = lazy(() => import('../components/FAQ'));
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
        setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth' });
        }, 100);

        // Limpeza opcional do estado (embora o history mantenha, evita scrolls indesejados em refresh simples sem limpar history)
        window.history.replaceState({}, document.title);
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
      <SEO
        title="Agência de Viagens em SP | Anhangá Viagens"
        description="Agência boutique em São Paulo. Cada roteiro começa do zero — sem pacote pronto. Orlando, Beto Carrero, Europa e muito mais. Orçamento gratuito."
        canonical="https://www.anhanga.tur.br/"
      />
      <OrganizationSchema />
      <FAQPageSchema items={FAQ_SCHEMA_ITEMS} />
      <BreadcrumbSchema
        items={[{ name: 'Home', item: 'https://www.anhanga.tur.br/' }]}
      />
      <ServiceSchema
        name="Agência de Viagens Personalizadas"
        description="Roteiros de viagem 100% personalizados para casais, famílias e grupos. Especialistas em Orlando, Beto Carrero, Europa, Lollapalooza e turismo 50+. Atendimento boutique em São Paulo."
        serviceUrl="https://www.anhanga.tur.br/"
        serviceType="Agência de Viagens"
        areaServed="São Paulo, Brasil"
        keywords={[
          'agência de viagens São Paulo',
          'roteiro personalizado',
          'viagem Orlando',
          'Beto Carrero World',
          'Lollapalooza Brasil',
          'turismo melhor idade',
          'pacotes de viagem SP',
        ]}
        aggregateRating={{ ratingValue: 5, reviewCount: 3 }}
      />
      <Hero />

      {shouldRenderBelowFold ? (
        <>
          <Suspense fallback={<section id="experiencia" className="min-h-[700px] bg-[#fffdf5]" />}>
            <Highlights />
          </Suspense>
          <Suspense fallback={<section className="min-h-[300px] bg-[#fffdf5]" />}>
            <Categories />
          </Suspense>
        </>
      ) : (
        <>
          <section id="experiencia" className="min-h-[700px] bg-[#fffdf5]" />
          <section className="min-h-[300px] bg-[#fffdf5]" />
        </>
      )}
      <div id="destinos" ref={destinationsSentinelRef} />
      {shouldRenderBelowFold && shouldLoadDestinations ? (
        <Suspense fallback={<section className="min-h-[900px] bg-[#fffdf5]" />}>
          <Destinations />
        </Suspense>
      ) : (
        <section className="min-h-[900px] bg-[#fffdf5]" />
      )}
      {shouldRenderBelowFold ? (
        <>
          <Suspense fallback={<section id="como-funciona" className="min-h-[800px] bg-[#fffdf5]" />}>
            <HowItWorks />
          </Suspense>
          <Suspense fallback={<section id="faq" className="min-h-[600px] bg-[#fffdf5]" />}>
            <FAQ />
          </Suspense>
          <Suspense fallback={<section id="depoimentos" className="min-h-[500px] bg-[#fffdf5]" />}>
            <Testimonials />
          </Suspense>
          <Suspense fallback={<section id="blog" className="min-h-[500px] bg-[#fffdf5]" />}>
            <Blog />
          </Suspense>
          <Suspense fallback={<section id="contato" className="min-h-[400px] bg-[#fffdf5]" />}>
            <CallToAction />
          </Suspense>
        </>
      ) : (
        <>
          <section id="como-funciona" className="min-h-[800px] bg-[#fffdf5]" />
          <section id="faq" className="min-h-[600px] bg-[#fffdf5]" />
          <section id="depoimentos" className="min-h-[500px] bg-[#fffdf5]" />
          <section id="blog" className="min-h-[500px] bg-[#fffdf5]" />
          <section id="contato" className="min-h-[400px] bg-[#fffdf5]" />
        </>
      )}
    </>
  );
};

export default Home;

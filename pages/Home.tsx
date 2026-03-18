import React, { useEffect, Suspense, lazy } from 'react';
import { useLocation } from 'react-router-dom';
import Hero from '../components/Hero';

import { OrganizationSchema } from '../components/schemas/OrganizationSchema';
import { BreadcrumbSchema } from '../components/schemas/BreadcrumbSchema';

import { SEO } from '../components/SEO';
import Testimonials from '../components/Testimonials';
import {
  getHomeTestimonialsViewModel,
  getParsedHomeReviewsSnapshot,
  shouldEmitHomeAggregateRating,
} from '../lib/googleReviewsSnapshot';

const Highlights = lazy(() => import('../components/Highlights'));
const Categories = lazy(() => import('../components/Categories'));
const Destinations = lazy(() => import('../components/Destinations'));
const HowItWorks = lazy(() => import('../components/HowItWorks'));
const Blog = lazy(() => import('../components/Blog'));
const FAQ = lazy(() => import('../components/FAQ'));
const CallToAction = lazy(() => import('../components/CallToAction'));

const Home: React.FC = () => {
  const location = useLocation();
  const [shouldRenderBelowFold, setShouldRenderBelowFold] = React.useState(false);
  const [shouldLoadDestinations, setShouldLoadDestinations] = React.useState(false);
  const destinationsSentinelRef = React.useRef<HTMLDivElement>(null);
  const testimonialsModel = getHomeTestimonialsViewModel();
  const parsedSnapshot = getParsedHomeReviewsSnapshot();
  const renderedReviewIds = testimonialsModel.mode === 'real'
    ? testimonialsModel.displayedReviews.map((review) => review.id)
    : [];
  const organizationAggregateRating = shouldEmitHomeAggregateRating({
    pathname: location.pathname,
    parsedSnapshot,
    renderedReviewIds,
  }) && testimonialsModel.mode === 'real'
    ? testimonialsModel.aggregateRating
    : undefined;

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
        title="Agência de Viagens em São Paulo: Roteiros Exclusivos 2026"
        description="Agência boutique em São Paulo especializada em roteiros sob medida, pacotes para Orlando, Beto Carrero e experiências exclusivas para o público 50+."
        canonical="https://www.anhanga.tur.br/"
        keywords="agência de viagens em São Paulo, roteiros exclusivos, pacotes para Orlando, pacote Beto Carrero, Lollapalooza Brasil, viagens melhor idade 50+, planejamento de viagens"
      />
      <OrganizationSchema aggregateRating={organizationAggregateRating} />
      <BreadcrumbSchema items={[{ name: 'Home', item: 'https://www.anhanga.tur.br/' }]} />
      <Hero />

      {shouldRenderBelowFold ? (
        <>
          <Suspense fallback={<section id="experiencia" className="min-h-[700px] bg-[#fffdf5]" aria-hidden="true" />}>
            <Highlights />
          </Suspense>
          <Suspense fallback={<section className="min-h-[300px] bg-[#fffdf5]" aria-hidden="true" />}>
            <Categories />
          </Suspense>
        </>
      ) : (
        <>
          <section id="experiencia" className="min-h-[700px] bg-[#fffdf5]" aria-hidden="true" />
          <section className="min-h-[300px] bg-[#fffdf5]" aria-hidden="true" />
        </>
      )}
      <div id="destinos" ref={destinationsSentinelRef} />
      {shouldRenderBelowFold && shouldLoadDestinations ? (
        <Suspense fallback={<section className="min-h-[900px] bg-[#fffdf5]" aria-hidden="true" />}>
          <Destinations />
        </Suspense>
      ) : (
        <section className="min-h-[900px] bg-[#fffdf5]" aria-hidden="true" />
      )}
      {shouldRenderBelowFold ? (
        <>
          <Suspense fallback={<section id="como-funciona" className="min-h-[800px] bg-[#fffdf5]" aria-hidden="true" />}>
            <HowItWorks />
          </Suspense>
          <Suspense fallback={<section id="faq" className="min-h-[600px] bg-[#fffdf5]" aria-hidden="true" />}>
            <FAQ />
          </Suspense>
        </>
      ) : (
        <>
          <section id="como-funciona" className="min-h-[800px] bg-[#fffdf5]" aria-hidden="true" />
          <section id="faq" className="min-h-[600px] bg-[#fffdf5]" aria-hidden="true" />
        </>
      )}
      <Testimonials model={testimonialsModel} />
      {shouldRenderBelowFold ? (
        <>
          <Suspense fallback={<section id="blog" className="min-h-[500px] bg-[#fffdf5]" aria-hidden="true" />}>
            <Blog />
          </Suspense>
          <Suspense fallback={<section id="contato" className="min-h-[400px] bg-[#fffdf5]" aria-hidden="true" />}>
            <CallToAction />
          </Suspense>
        </>
      ) : (
        <>
          <section id="blog" className="min-h-[500px] bg-[#fffdf5]" aria-hidden="true" />
          <section id="contato" className="min-h-[400px] bg-[#fffdf5]" aria-hidden="true" />
        </>
      )}
    </>
  );
};

export default Home;

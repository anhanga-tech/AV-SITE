import React from 'react';
import { Link } from 'react-router-dom';
import { m } from 'framer-motion';
import { ArrowLeft, ArrowRight, CalendarCheck, Compass, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { fadeUp } from '@/components/landings/shared/constants';
import type { CruiseOffer } from '@/data/cruiseOffers';
import { openContactModal } from '@/utils/contactForm';
import { FeaturedOffer, OfferCard } from './CruiseOfferCards';

const VIEWPORT_REVEAL = { once: true, amount: 0.2, margin: '0px 0px 100% 0px' } as const;

const HOW_IT_WORKS = [
  {
    step: '01',
    title: 'Conversa com especialista',
    desc: 'Você conta o que busca — perfil, orçamento, datas — e o especialista faz as perguntas certas.'
  },
  {
    step: '02',
    title: 'Curadoria personalizada',
    desc: 'Com base no seu perfil, indicamos o navio, a cabine e o roteiro que mais fazem sentido para você — inclusive fora da seleção do site.'
  },
  {
    step: '03',
    title: 'Reserva e suporte',
    desc: 'Quando decidir, cuidamos da reserva e ficamos disponíveis até você embarcar.'
  },
];

// `variant` não é decoração: DESIGN.md:261 proíbe cards idênticos em grade
// repetida. O card preenchido quebra a repetição e ancora a leitura no meio —
// mesma razão pela qual a seção de ofertas destaca uma saída em vez de listar
// tudo com o mesmo peso.
const WHY_CURATION = [
  {
    icon: Compass,
    title: 'Navio certo para seu perfil',
    desc: 'Cada companhia tem um DNA diferente. Indicamos o que combina com o que você quer viver a bordo.',
    variant: 'light' as const,
  },
  {
    icon: MapPin,
    title: 'Roteiro que vale a viagem',
    desc: 'Saída do Brasil ou internacional, escalas e temporada mudam o preço e a experiência. Analisamos tudo junto.',
    variant: 'filled' as const,
  },
  {
    icon: CalendarCheck,
    title: 'Cabine sem arrependimento',
    desc: 'Interna, varanda ou suíte: explicamos o que cada categoria entrega e o que vale para o seu caso.',
    variant: 'light' as const,
  },
];

interface CruiseOffersSectionProps {
  featuredOffer?: CruiseOffer;
  secondaryOffers: CruiseOffer[];
}

export function CruiseMiniHeader(): React.ReactElement {
  return (
    <header className="bg-white/90 backdrop-blur-sm border-b border-anhanga-blue/10 sticky top-0 z-50 py-3">
      <div className="max-w-6xl mx-auto px-6 flex items-center justify-between">
        <Link
          to="/"
          className="inline-flex items-center gap-2 group"
          aria-label="Voltar para o site principal da Anhangá Viagens"
        >
          <ArrowLeft className="size-4 text-zinc-400 group-hover:text-anhanga-blue transition-colors" />
          <span className="size-7 bg-anhanga-blue/10 rounded-lg flex items-center justify-center flex-shrink-0">
            <img src="/favicon.svg" alt="" aria-hidden="true" className="size-4" />
          </span>
          <span className="text-sm font-bold text-anhanga-dark group-hover:text-anhanga-blue transition-colors">
            Anhangá Viagens
          </span>
        </Link>
        <Button
          variant="action"
          size="sm"
          onClick={() => openContactModal({ source: 'cruzeiros' })}
          className="btn-whatsapp btn-specialist whitespace-nowrap"
          data-tracking="header-cruzeiros"
        >
          Falar com especialista
        </Button>
      </div>
    </header>
  );
}

export function CruiseHero(): React.ReactElement {
  return (
    <section className="pt-16 pb-20 px-6 bg-anhanga-light">
      <div className="max-w-3xl mx-auto">
        <m.p
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={0}
          className="text-sm font-semibold text-anhanga-blue mb-4 tracking-wide uppercase"
        >
          Cruzeiros · Brasil e internacionais
        </m.p>
        <m.h1
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={1}
          className="text-4xl md:text-6xl font-black text-anhanga-dark mb-6 leading-[1.1]"
        >
          Os cruzeiros que a gente escolheria
        </m.h1>
        <m.p
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={2}
          className="text-xl text-zinc-600 mb-10 leading-relaxed max-w-2xl"
        >
          Uma seleção enxuta de saídas que valem a pena — no Brasil e pelo mundo — com um especialista para acertar navio, cabine e roteiro antes de você fechar.
        </m.p>
        <m.div variants={fadeUp} initial="hidden" animate="visible" custom={3}>
          <Button
            variant="cta"
            size="lg"
            onClick={() => openContactModal({ source: 'cruzeiros' })}
            className="btn-whatsapp btn-specialist font-black"
            rightIcon={<ArrowRight className="size-5" aria-hidden="true" />}
            aria-label="Falar com um especialista em cruzeiros"
            data-tracking="hero-cruzeiros"
          >
            Falar com um especialista
          </Button>
          <p className="mt-4 text-sm text-zinc-600">Sem taxa de curadoria. Gratuito.</p>
        </m.div>
      </div>
    </section>
  );
}

export function CruiseOffersSection({
  featuredOffer,
  secondaryOffers,
}: CruiseOffersSectionProps): React.ReactElement | null {
  if (!featuredOffer && secondaryOffers.length === 0) return null;

  // `lg:grid-cols-3` deixa o último card sozinho numa linha nova sempre que a
  // contagem % 3 === 1 (ex.: 4, 7 ofertas) — grid auto-placement o encosta na
  // coluna esquerda com duas colunas vazias ao lado. Centralizar esse card em
  // vez de deixá-lo órfão.
  const secondaryLastOrphanAtLg = secondaryOffers.length % 3 === 1;

  return (
    <section className="py-20 bg-white" aria-labelledby="ofertas-titulo">
      <div className="max-w-6xl mx-auto px-6">
        <m.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={VIEWPORT_REVEAL}
          custom={0}
          className="mb-10"
        >
          <h2 id="ofertas-titulo" className="text-3xl md:text-4xl font-black text-anhanga-dark mb-3">
            Seleção da temporada
          </h2>
          <p className="text-zinc-600 text-lg max-w-2xl">
            Poucas saídas, escolhidas a dedo. Cada uma vem com o porquê de estar aqui — e um especialista para fechar a sua.
          </p>
        </m.div>

        {featuredOffer ? (
          <m.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={VIEWPORT_REVEAL}
            custom={1}
            className="mb-6"
          >
            <FeaturedOffer offer={featuredOffer} />
          </m.div>
        ) : null}

        {secondaryOffers.length > 0 ? (
          <div data-testid="ofertas-secundarias" className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {secondaryOffers.map((offer, idx) => (
              <m.div
                key={offer.id}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={VIEWPORT_REVEAL}
                custom={idx + 2}
                className={
                  secondaryLastOrphanAtLg && idx === secondaryOffers.length - 1
                    ? 'lg:col-start-2'
                    : undefined
                }
              >
                <OfferCard offer={offer} />
              </m.div>
            ))}
          </div>
        ) : null}

        <p className="mt-10 text-zinc-600 max-w-2xl">
          Não achou a saída ideal?{' '}
          <button
            type="button"
            onClick={() => openContactModal({ source: 'cruzeiros' })}
            className="font-bold text-anhanga-blue underline underline-offset-2 hover:text-anhanga-darkBlue transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-anhanga-action rounded"
            data-tracking="ofertas-fallback-cruzeiros"
          >
            Conte o que procura
          </button>{' '}
          — a gente busca fora da lista também.
        </p>
      </div>
    </section>
  );
}

export function CruiseProcess(): React.ReactElement {
  return (
    <section className="py-20 bg-anhanga-light">
      <div className="max-w-5xl mx-auto px-6">
        <m.h2
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={VIEWPORT_REVEAL}
          custom={0}
          className="text-3xl md:text-4xl font-black text-anhanga-dark mb-12"
        >
          Como funciona
        </m.h2>
        <div className="space-y-0">
          {HOW_IT_WORKS.map(({ step, title, desc }, idx) => (
            <m.div
              key={step}
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={VIEWPORT_REVEAL}
              custom={idx + 1}
              className={`flex gap-6 py-8 ${idx < HOW_IT_WORKS.length - 1 ? 'border-b border-anhanga-blue/10' : ''}`}
            >
              <div className="flex-shrink-0 size-12 rounded-full bg-white flex items-center justify-center shadow-sm">
                <span className="text-sm font-black text-anhanga-blue">{step}</span>
              </div>
              <div>
                <h3 className="text-xl font-black text-anhanga-dark mb-2">{title}</h3>
                <p className="text-zinc-600 leading-relaxed max-w-xl">{desc}</p>
              </div>
            </m.div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function CruiseCurationBenefits(): React.ReactElement {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-5xl mx-auto px-6">
        <m.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={VIEWPORT_REVEAL}
          custom={0}
          className="mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-black text-anhanga-dark mb-3">
            Por que curadoria?
          </h2>
          <p className="text-zinc-600 text-lg">
            Porque escolher um cruzeiro envolve mais variáveis do que parece.
          </p>
        </m.div>
        <div className="grid md:grid-cols-3 gap-6">
          {WHY_CURATION.map(({ icon: Icon, title, desc, variant }, idx) => (
            <m.div
              key={title}
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={VIEWPORT_REVEAL}
              custom={idx + 1}
              className={`p-8 rounded-2xl ${variant === 'filled' ? 'bg-anhanga-blue' : 'bg-anhanga-light shadow-float'}`}
            >
              <div
                className={`size-11 rounded-xl flex items-center justify-center mb-5 ${
                  variant === 'filled' ? 'bg-white/15' : 'bg-anhanga-blue/10'
                }`}
              >
                <Icon className={`size-5 ${variant === 'filled' ? 'text-white' : 'text-anhanga-blue'}`} />
              </div>
              <h3 className={`text-xl font-black mb-3 ${variant === 'filled' ? 'text-white' : 'text-anhanga-dark'}`}>
                {title}
              </h3>
              <p className={variant === 'filled' ? 'text-blue-100 leading-relaxed' : 'text-zinc-600 leading-relaxed'}>
                {desc}
              </p>
            </m.div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function CruiseAbout(): React.ReactElement {
  return (
    <section className="py-20 bg-anhanga-light">
      <m.div
        variants={fadeUp}
        initial="hidden"
        whileInView="visible"
        viewport={VIEWPORT_REVEAL}
        custom={0}
        className="max-w-4xl mx-auto px-6 text-center"
      >
        <h2 className="text-3xl md:text-4xl font-black text-anhanga-dark mb-6">
          Sobre a Anhangá Viagens
        </h2>
        <p className="text-lg text-zinc-600 leading-relaxed max-w-2xl mx-auto">
          Agência de viagens em São Paulo desde 2018, com especialistas em cruzeiros e roteiros personalizados. Nota 5.0 no Google e atendimento humano do início ao fim.
        </p>
        <div className="mt-12 flex flex-wrap justify-center gap-12">
          {/* Terceiro item ("Especialistas / Em cruzeiros") removido: não é um
              valor quantitativo como os outros dois, quebrava o paralelismo
              do trio e já era dito no parágrafo acima ("com especialistas em
              cruzeiros"). Redundante, não uma estatística real. */}
          {[
            { label: 'Fundada em', value: '2018' },
            { label: 'Nota Google', value: '5.0' },
          ].map(({ label, value }) => (
            <div key={label}>
              <div className="text-4xl font-black text-anhanga-blue">{value}</div>
              <div className="text-sm text-zinc-600 mt-1">{label}</div>
            </div>
          ))}
        </div>
      </m.div>
    </section>
  );
}

export function CruiseFinalCta(): React.ReactElement {
  return (
    <section className="py-20 bg-anhanga-blue">
      <m.div
        variants={fadeUp}
        initial="hidden"
        whileInView="visible"
        viewport={VIEWPORT_REVEAL}
        custom={0}
        className="max-w-3xl mx-auto px-6 text-center"
      >
        <h2 className="text-3xl md:text-5xl font-black text-white mb-6">
          Vamos achar o seu cruzeiro?
        </h2>
        <p className="text-blue-100 text-lg mb-10 max-w-xl mx-auto">
          Fale com um consultor e resolva a escolha em uma conversa. Sem taxa, sem compromisso.
        </p>
        <Button
          variant="cta"
          size="lg"
          onClick={() => openContactModal({ source: 'cruzeiros' })}
          className="btn-whatsapp btn-specialist font-black focus-visible:outline-white"
          rightIcon={<ArrowRight className="size-6" aria-hidden="true" />}
          aria-label="Falar com um especialista em cruzeiros"
          data-tracking="footer-cruzeiros"
        >
          Falar com um especialista
        </Button>
      </m.div>
    </section>
  );
}

export function CruiseOtherServices(): React.ReactElement {
  return (
    <section className="py-16 bg-anhanga-light">
      <div className="max-w-5xl mx-auto px-6">
        <h2 className="text-2xl font-black text-anhanga-dark mb-8">Outros serviços</h2>
        <div className="grid md:grid-cols-3 gap-4">
          <Link
            to="/consultoria-de-viagem/"
            className="block p-5 rounded-xl bg-white hover:bg-anhanga-blue/10 transition-colors group focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-anhanga-action"
          >
            <div className="font-bold text-anhanga-dark group-hover:text-anhanga-blue transition-colors">
              Consultoria de Viagem
            </div>
            <div className="text-sm text-zinc-600 mt-1">
              Roteiro sob medida com consultor humano
            </div>
          </Link>
          <Link
            to="/corporativo/"
            className="block p-5 rounded-xl bg-white hover:bg-anhanga-blue/10 transition-colors group focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-anhanga-action"
          >
            <div className="font-bold text-anhanga-dark group-hover:text-anhanga-blue transition-colors">
              Viagens para Executivos
            </div>
            <div className="text-sm text-zinc-600 mt-1">
              Planejamento com precisão para profissionais
            </div>
          </Link>
          <Link
            to="/"
            className="block p-5 rounded-xl bg-white hover:bg-anhanga-blue/10 transition-colors group focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-anhanga-action"
          >
            <div className="font-bold text-anhanga-dark group-hover:text-anhanga-blue transition-colors">
              Site principal
            </div>
            <div className="text-sm text-zinc-600 mt-1">
              Conheça todos os serviços da Anhangá
            </div>
          </Link>
        </div>
      </div>
    </section>
  );
}

export function CruiseLandingFooter(): React.ReactElement {
  return (
    <footer className="py-8 bg-anhanga-light border-t border-anhanga-blue/10 text-center text-sm text-zinc-600">
      <p>Anhangá Viagens · Agência de viagens em São Paulo</p>
    </footer>
  );
}

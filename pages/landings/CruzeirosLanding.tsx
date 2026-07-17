import React from 'react';
import { Link } from 'react-router-dom';
import { m, MotionConfig } from 'framer-motion';
import { Seo } from '@/components/Seo';
import { LandingFAQ } from '@/components/LandingFAQ';
import { BreadcrumbSchema } from '@/components/schemas/BreadcrumbSchema';
import { FAQPageSchema } from '@/components/schemas/FAQPageSchema';
import { ServiceSchema } from '@/components/schemas/ServiceSchema';
import { Button } from '@/components/ui/Button';
import { LazyImage } from '@/components/ui/LazyImage';
import { fadeUp } from '@/components/landings/shared/constants';
import { openContactModal } from '@/utils/contactForm';
import { CRUISE_OFFERS, type CruiseOffer } from '@/data/cruiseOffers';
import { getActiveOffers } from '@/lib/cruise-offers-schedule.js';
import { ArrowLeft, ArrowRight, Compass, Ship, MapPin, CalendarCheck, Moon } from 'lucide-react';

// Filtra as ofertas vencidas no topo do módulo (import-time), não no render:
// o prerender (build) e o cliente rodam este mesmo caminho e concordam sobre a
// lista. Ver lib/cruise-offers-schedule.js para a janela de divergência.
const ACTIVE_OFFERS = getActiveOffers(CRUISE_OFFERS);
const FEATURED_OFFER = ACTIVE_OFFERS.find((o) => o.featured);
const SECONDARY_OFFERS = ACTIVE_OFFERS.filter((o) => o !== FEATURED_OFFER);

const VIEWPORT_REVEAL = { once: true, amount: 0.2, margin: '0px 0px 100% 0px' } as const;

// Rótulo enviado ao CRM (campo `destination` → x_destino no Odoo) e mostrado no
// ContactModal. A palavra "cruzeiro" auto-classifica o lead com a tag Cruzeiros
// (lib/destination-region.ts). Também é o texto que o especialista vê primeiro.
function offerCrmLabel(o: CruiseOffer): string {
  return `Cruzeiro ${o.navio} · ${o.portoEmbarque} · ${o.saida}`;
}

// Mensagem natural pré-preenchida no WhatsApp quando o lead abre a conversa.
function offerWhatsappMessage(o: CruiseOffer): string {
  return `Olá! Tenho interesse no cruzeiro do ${o.navio} saindo de ${o.portoEmbarque} em ${o.saida}. Podem me ajudar?`;
}

function openOfferConversation(o: CruiseOffer): void {
  openContactModal({
    source: 'cruzeiros-oferta',
    destination: offerCrmLabel(o),
    message: offerWhatsappMessage(o),
  });
}

const FAQ_ITEMS = [
  {
    question: 'Qual o melhor cruzeiro para a primeira vez?',
    answer: 'Depende do seu perfil — casal, família, solo, orçamento, preferência de roteiro. É exatamente isso que a curadoria resolve: encontrar o navio, a cabine e a saída certos para você antes de fechar.'
  },
  {
    question: 'Vocês trabalham só com saídas do Brasil?',
    answer: 'Não. Temos cruzeiros saindo de Santos e do Rio de Janeiro na temporada brasileira, e também roteiros internacionais — Mediterrâneo, Caribe e outros. A seleção acima muda conforme a temporada e a disponibilidade dos armadores.'
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
  }
];

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

const OfferMeta: React.FC<{ offer: CruiseOffer; className?: string }> = ({ offer, className }) => (
  <dl className={`flex flex-wrap gap-x-6 gap-y-2 text-sm ${className ?? ''}`}>
    <div className="flex items-center gap-1.5">
      <Ship className="size-4 text-anhanga-action flex-shrink-0" aria-hidden="true" />
      <dt className="sr-only">Navio</dt>
      <dd className="font-semibold text-anhanga-dark">{offer.companhia}</dd>
    </div>
    <div className="flex items-center gap-1.5">
      <MapPin className="size-4 text-anhanga-action flex-shrink-0" aria-hidden="true" />
      <dt className="sr-only">Roteiro</dt>
      <dd className="text-zinc-600">{offer.roteiro.join(' · ')}</dd>
    </div>
    <div className="flex items-center gap-1.5">
      <Moon className="size-4 text-anhanga-action flex-shrink-0" aria-hidden="true" />
      <dt className="sr-only">Duração</dt>
      <dd className="text-zinc-600">{offer.noites} noites</dd>
    </div>
  </dl>
);

const ProfileTags: React.FC<{ perfis: string[] }> = ({ perfis }) => (
  <ul className="flex flex-wrap gap-2" aria-label="Perfis indicados">
    {perfis.map((p) => (
      <li key={p} className="text-xs font-semibold text-anhanga-blue bg-anhanga-blue/10 rounded-full px-3 py-1">
        {p}
      </li>
    ))}
  </ul>
);

const RegionBadge: React.FC<{ regiao: string; saida: string }> = ({ regiao, saida }) => (
  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-anhanga-action">
    <span>{regiao}</span>
    <span className="text-zinc-300" aria-hidden="true">·</span>
    <span className="text-zinc-500">{saida}</span>
  </div>
);

// shadow-float (não border): DESIGN.md §5 reserva border a inputs — cards
// separam por sombra ou fundo tonalizado. Sem lift no hover: o card em si não
// é clicável, só o botão dentro dele; sombra que cresce ao passar o mouse no
// card inteiro seria affordance de clique sem clique (mesmo raciocínio do
// PILLARS de /consultoria-de-viagem).
const FeaturedOffer: React.FC<{ offer: CruiseOffer }> = ({ offer }) => (
  <article className="grid md:grid-cols-2 gap-0 rounded-3xl overflow-hidden bg-white shadow-float">
    {/* w-full é obrigatório: o LazyImage aplica `aspect-ratio` inline a partir de
        width/height, e sem uma largura explícita o container deriva a largura da
        altura (h-full) e estoura a coluna do grid. */}
    <LazyImage
      src={offer.imagem}
      alt={offer.imagemAlt}
      width={800}
      height={600}
      sizes="(min-width: 768px) 50vw, 100vw"
      className="w-full h-64 md:h-full"
    />
    <div className="p-8 md:p-10 flex flex-col">
      <RegionBadge regiao={offer.regiao} saida={offer.saida} />
      <h3 className="mt-3 text-2xl md:text-3xl font-black text-anhanga-dark leading-tight">
        {offer.navio}
      </h3>
      <OfferMeta offer={offer} className="mt-4" />
      <div className="mt-5 rounded-xl bg-anhanga-blue/[0.04] p-4">
        <p className="text-xs font-black uppercase tracking-wide text-anhanga-blue mb-1.5">
          Por que escolhemos
        </p>
        <p className="text-zinc-700 leading-relaxed">{offer.notaCuratorial}</p>
      </div>
      <div className="mt-6">
        <ProfileTags perfis={offer.perfis} />
      </div>
      <Button
        variant="primary"
        size="lg"
        onClick={() => openOfferConversation(offer)}
        className="btn-whatsapp btn-specialist mt-8 self-start"
        rightIcon={<ArrowRight className="size-5" aria-hidden="true" />}
        aria-label={`Falar com um especialista sobre o cruzeiro ${offer.navio}`}
        data-tracking={`oferta-featured-${offer.id}`}
      >
        Quero saber mais
      </Button>
    </div>
  </article>
);

const OfferCard: React.FC<{ offer: CruiseOffer }> = ({ offer }) => (
  <article className="flex flex-col rounded-2xl overflow-hidden bg-white shadow-float">
    <LazyImage
      src={offer.imagem}
      alt={offer.imagemAlt}
      width={480}
      height={300}
      sizes="(min-width: 768px) 33vw, 100vw"
      className="w-full h-48"
    />
    <div className="p-6 flex flex-col flex-1">
      <RegionBadge regiao={offer.regiao} saida={offer.saida} />
      <h3 className="mt-2 text-xl font-black text-anhanga-dark leading-tight">{offer.navio}</h3>
      <OfferMeta offer={offer} className="mt-3" />
      <div className="mt-4 rounded-lg bg-anhanga-blue/[0.04] p-3 flex-1">
        <p className="text-[0.65rem] font-black uppercase tracking-wide text-anhanga-blue mb-1">
          Por que escolhemos
        </p>
        <p className="text-sm text-zinc-600 leading-relaxed">{offer.notaCuratorial}</p>
      </div>
      <div className="mt-4">
        <ProfileTags perfis={offer.perfis} />
      </div>
      <Button
        variant="primary"
        onClick={() => openOfferConversation(offer)}
        className="btn-whatsapp btn-specialist mt-5 w-full"
        rightIcon={<ArrowRight className="size-4" aria-hidden="true" />}
        aria-label={`Falar com um especialista sobre o cruzeiro ${offer.navio}`}
        data-tracking={`oferta-${offer.id}`}
      >
        Falar sobre este
      </Button>
    </div>
  </article>
);

const CruzeirosLanding: React.FC = () => {
  const hasOffers = ACTIVE_OFFERS.length > 0;

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
          title="Cruzeiros — Ofertas e Curadoria | Anhangá Viagens"
          description="Ofertas selecionadas de cruzeiros no Brasil e internacionais, com curadoria consultiva para escolher navio, cabine e roteiro certos antes de fechar."
          canonical="https://www.anhanga.tur.br/cruzeiros/"
          noHreflang
        />
        <ServiceSchema
          name="Cruzeiros — Ofertas e Curadoria"
          description="Seleção de cruzeiros no Brasil e internacionais com atendimento consultivo para escolher navio, cabine, roteiro e datas ideais. Para casais, famílias e primeira viagem."
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

        {/* Mini Header */}
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

        {/* Hero */}
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

        {/* Ofertas — protagonista. Some quando não há oferta válida (a curadoria
            abaixo sustenta a página nesse estado). */}
        {hasOffers ? (
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

              {FEATURED_OFFER ? (
                <m.div
                  variants={fadeUp}
                  initial="hidden"
                  whileInView="visible"
                  viewport={VIEWPORT_REVEAL}
                  custom={1}
                  className="mb-6"
                >
                  <FeaturedOffer offer={FEATURED_OFFER} />
                </m.div>
              ) : null}

              {SECONDARY_OFFERS.length > 0 ? (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {SECONDARY_OFFERS.map((offer, idx) => (
                    <m.div
                      key={offer.id}
                      variants={fadeUp}
                      initial="hidden"
                      whileInView="visible"
                      viewport={VIEWPORT_REVEAL}
                      custom={idx + 2}
                    >
                      <OfferCard offer={offer} />
                    </m.div>
                  ))}
                </div>
              ) : null}

              <p className="mt-10 text-zinc-600">
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
        ) : null}

        {/* Como funciona */}
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

        {/* Por que curadoria */}
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

        {/* Sobre a Anhangá */}
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
              {[
                { label: 'Fundada em', value: '2018' },
                { label: 'Nota Google', value: '5.0' },
                { label: 'Especialistas', value: 'Em cruzeiros' },
              ].map(({ label, value }) => (
                <div key={label}>
                  <div className="text-4xl font-black text-anhanga-blue">{value}</div>
                  <div className="text-sm text-zinc-600 mt-1">{label}</div>
                </div>
              ))}
            </div>
          </m.div>
        </section>

        {/* CTA Final */}
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

        {/* Outros serviços */}
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

        {/* FAQ */}
        <LandingFAQ
          items={FAQ_ITEMS}
          title="Dúvidas sobre cruzeiros"
          subtitle="Tire suas dúvidas antes de escolher seu cruzeiro."
        />

        {/* Footer */}
        <footer className="py-8 bg-anhanga-light border-t border-anhanga-blue/10 text-center text-sm text-zinc-600">
          <p>Anhangá Viagens · Agência de viagens em São Paulo</p>
        </footer>
      </div>
      </MotionConfig>
    </>
  );
};

export default CruzeirosLanding;

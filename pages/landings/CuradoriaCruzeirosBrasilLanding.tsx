import React from 'react';
import { Link } from 'react-router-dom';
import { Seo } from '@/components/Seo';
import { LandingFAQ } from '@/components/LandingFAQ';
import { BreadcrumbSchema } from '@/components/schemas/BreadcrumbSchema';
import { FAQPageSchema } from '@/components/schemas/FAQPageSchema';
import { ServiceSchema } from '@/components/schemas/ServiceSchema';
import { openContactModal } from '@/utils/contactForm';
import { ArrowLeft, ArrowRight, Compass, LayoutGrid, CalendarCheck, CheckCircle } from 'lucide-react';

const FAQ_ITEMS = [
  {
    question: 'Qual o melhor cruzeiro para primeira vez?',
    answer: 'Depende do seu perfil — casal, família, solo, orçamento, preferência de roteiro. É exatamente isso que a curadoria resolve: encontrar o navio e a cabine certos para você antes de fechar.'
  },
  {
    question: 'Cabine interna ou com varanda?',
    answer: 'Para a primeira vez, a cabine com varanda vale muito pelo conforto e pela experiência visual durante o roteiro. Mas depende do orçamento e do navio. Explicamos tudo na conversa.'
  },
  {
    question: 'Quais saídas de porto vocês trabalham?',
    answer: 'Principalmente Santos, que é o maior porto de cruzeiros do Brasil. Também trabalhamos com saídas do Rio de Janeiro e outros portos conforme disponibilidade.'
  },
  {
    question: 'Tem cruzeiro bom para família com criança pequena?',
    answer: 'Sim. Alguns navios têm estrutura kids excelente com monitores, piscinas infantis e programação específica. Indicamos o certo para a faixa etária dos seus filhos.'
  },
  {
    question: 'Como é cobrado o serviço?',
    answer: 'Sem taxa de curadoria no momento. Você fala com um especialista gratuitamente e decide se quer fechar seu cruzeiro com a Anhangá.'
  }
];

const FOR_WHO = [
  { title: 'Primeiro cruzeiro', desc: 'Quer entender o que esperar antes de comprar a passagem.' },
  { title: 'Casal', desc: 'Busca a combinação certa de navio, cabine e roteiro para uma viagem especial.' },
  { title: 'Família com crianças', desc: 'Precisa de um navio com boa estrutura kids e cabine que caiba todo mundo.' },
  { title: 'Quem já foi', desc: 'Quer melhorar a experiência, subir de categoria ou experimentar outro roteiro.' },
];

const WHAT_WE_ANALYZE = [
  'Navio e companhia (MSC, Costa, Carnival, Royal Caribbean)',
  'Tipo de cabine: interna, oceanview, varanda ou suíte',
  'Roteiro: Santos, Búzios, Ilhéus, Salvador, Ilha Grande',
  'Datas e temporada (alto vs. baixo)',
  'Perfil da viagem: romântica, familiar, solo, grupos',
  'Orçamento total incluindo pacotes e extras a bordo',
];

const PILLARS = [
  {
    icon: Compass,
    title: 'Navio certo para seu perfil',
    desc: 'Cada companhia tem um DNA diferente. Indicamos o que combina com o que você quer viver a bordo.',
    variant: 'light' as const,
  },
  {
    icon: LayoutGrid,
    title: 'Cabine sem arrependimento',
    desc: 'Interna, oceanview, varanda ou suíte: explicamos o que cada categoria entrega e o que vale para o seu caso.',
    variant: 'filled' as const,
  },
  {
    icon: CalendarCheck,
    title: 'Roteiro e datas ideais',
    desc: 'Temporada, roteiro e disponibilidade fazem diferença no preço e na experiência. Analisamos tudo junto.',
    variant: 'light' as const,
  },
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
    desc: 'Com base no seu perfil, indicamos o navio, a cabine e o roteiro que mais fazem sentido para você.'
  },
  {
    step: '03',
    title: 'Reserva e suporte',
    desc: 'Quando decidir, cuidamos da reserva e estamos disponíveis até você embarcar.'
  },
];

const CuradoriaCruzeirosBrasilLanding: React.FC = () => {
  return (
    <div className="bg-anhanga-light min-h-screen font-sans">
      <Seo
        title="Curadoria de Cruzeiros no Brasil — Anhangá Viagens"
        description="Escolha navio, cabine e roteiro certos para o seu perfil. Curadoria consultiva para quem quer fazer o cruzeiro certo na primeira vez."
        canonical="https://www.anhanga.tur.br/curadoria-cruzeiros-brasil/"
        noHreflang
      />
      <ServiceSchema
        name="Curadoria de Cruzeiros no Brasil"
        description="Ajuda especializada para escolher navio, cabine, roteiro e datas ideais para seu cruzeiro no Brasil. Atendimento consultivo para casais, famílias e primeira viagem."
        serviceUrl="https://www.anhanga.tur.br/curadoria-cruzeiros-brasil/"
        serviceType="Curadoria de Cruzeiros"
        areaServed="Brasil"
      />
      <BreadcrumbSchema
        items={[
          { name: 'Home', item: 'https://www.anhanga.tur.br/' },
          { name: 'Curadoria de Cruzeiros', item: 'https://www.anhanga.tur.br/curadoria-cruzeiros-brasil/' }
        ]}
      />
      <FAQPageSchema items={FAQ_ITEMS} />

      {/* Mini Header */}
      <header className="bg-white/90 backdrop-blur-sm border-b border-anhanga-blue/10 sticky top-0 z-50 py-3">
        <div className="max-w-5xl mx-auto px-6 flex items-center justify-between">
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
          <button
            type="button"
            onClick={() => openContactModal({ source: 'cruzeiros-brasil' })}
            className="btn-whatsapp btn-specialist text-xs font-bold bg-anhanga-blue text-white px-4 py-2 rounded-xl hover:bg-anhanga-darkBlue transition-colors whitespace-nowrap"
            data-tracking="header-cruzeiros-brasil"
          >
            Falar com especialista
          </button>
        </div>
      </header>

      {/* Hero */}
      <section className="pt-16 pb-20 px-6 bg-anhanga-light">
        <div className="max-w-3xl mx-auto">
          <p className="text-sm font-semibold text-anhanga-blue mb-4 tracking-wide uppercase">
            Cruzeiros no Brasil · Curadoria consultiva
          </p>
          <h1 className="text-4xl md:text-6xl font-black text-anhanga-dark mb-6 leading-[1.1] font-serif">
            Escolha o cruzeiro certo no Brasil antes de fechar
          </h1>
          <p className="text-xl text-zinc-600 mb-10 leading-relaxed max-w-2xl">
            Entenda navio, cabine, roteiro, datas e perfil da viagem com uma curadoria consultiva da Anhangá.
          </p>
          <button
            type="button"
            onClick={() => openContactModal({ source: 'cruzeiros-brasil' })}
            className="btn-whatsapp btn-specialist inline-flex items-center gap-3 bg-anhanga-blue text-white font-bold px-8 py-4 rounded-2xl hover:bg-anhanga-darkBlue transition-colors text-lg shadow-lg"
            aria-label="Falar com um especialista em cruzeiros"
            data-tracking="hero-cruzeiros-brasil"
          >
            Falar com um especialista
            <ArrowRight className="size-5" />
          </button>
          <p className="mt-4 text-sm text-zinc-600">Sem taxa de curadoria. Gratuito.</p>
        </div>
      </section>

      {/* O que analisamos juntos — posição 2: informação mais diferenciadora */}
      <section className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-black text-anhanga-dark mb-4 font-serif">
            O que analisamos juntos
          </h2>
          <p className="text-zinc-600 text-lg mb-10">
            Na curadoria, passamos por todos esses pontos antes de você decidir.
          </p>
          <div className="grid sm:grid-cols-2 gap-4">
            {WHAT_WE_ANALYZE.map(item => (
              <div key={item} className="flex items-start gap-3 p-4 rounded-xl bg-anhanga-light">
                <CheckCircle className="size-5 text-anhanga-blue flex-shrink-0 mt-0.5" aria-hidden="true" />
                <span className="text-zinc-700">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Por que curadoria? */}
      <section className="py-20 bg-anhanga-light">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-black text-anhanga-dark mb-3 font-serif">
            Por que curadoria?
          </h2>
          <p className="text-zinc-600 text-lg mb-12">
            Porque escolher um cruzeiro envolve mais variáveis do que parece.
          </p>
          <div className="grid md:grid-cols-3 gap-6">
            {PILLARS.map(({ icon: Icon, title, desc, variant }) => (
              <div
                key={title}
                className={`p-8 rounded-2xl ${
                  variant === 'filled'
                    ? 'bg-anhanga-blue text-white'
                    : 'bg-white'
                }`}
              >
                <div
                  className={`size-11 rounded-xl flex items-center justify-center mb-5 ${
                    variant === 'filled' ? 'bg-white/15' : 'bg-anhanga-blue/10'
                  }`}
                >
                  <Icon
                    className={`size-5 ${variant === 'filled' ? 'text-white' : 'text-anhanga-blue'}`}
                  />
                </div>
                <h3 className={`text-xl font-black mb-3 ${variant === 'filled' ? 'text-white' : 'text-anhanga-dark'}`}>
                  {title}
                </h3>
                <p className={variant === 'filled' ? 'text-blue-100 leading-relaxed' : 'text-zinc-600 leading-relaxed'}>
                  {desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Para quem é */}
      <section className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-black text-anhanga-dark mb-12 font-serif">
            Para quem é
          </h2>
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-5">
            {FOR_WHO.map(({ title, desc }) => (
              <div key={title} className="bg-anhanga-light rounded-2xl p-6">
                <h3 className="font-black text-anhanga-dark mb-2">{title}</h3>
                <p className="text-zinc-600 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Como funciona */}
      <section className="py-20 bg-anhanga-light">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-black text-anhanga-dark mb-12 font-serif">
            Como funciona
          </h2>
          <div className="space-y-0">
            {HOW_IT_WORKS.map(({ step, title, desc }, idx) => (
              <div
                key={step}
                className={`flex gap-6 py-8 ${idx < HOW_IT_WORKS.length - 1 ? 'border-b border-anhanga-blue/10' : ''}`}
              >
                <div className="flex-shrink-0 size-12 rounded-full bg-white flex items-center justify-center shadow-sm">
                  <span className="text-sm font-black text-anhanga-blue">{step}</span>
                </div>
                <div>
                  <h3 className="text-xl font-black text-anhanga-dark mb-2">{title}</h3>
                  <p className="text-zinc-600 leading-relaxed max-w-xl">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Sobre a Anhangá */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-black text-anhanga-dark mb-6 font-serif">
            Sobre a Anhangá Viagens
          </h2>
          <p className="text-lg text-zinc-600 leading-relaxed max-w-2xl mx-auto">
            Agência de viagens em São Paulo desde 2018, com especialistas em cruzeiros no Brasil e roteiros personalizados. Nota 5.0 no Google e atendimento humano do início ao fim.
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
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-20 bg-anhanga-blue">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-5xl font-black text-white mb-6 font-serif">
            Descubra o cruzeiro certo para você.
          </h2>
          <p className="text-blue-100 text-lg mb-10 max-w-xl mx-auto">
            Fale com um consultor e resolva a escolha em uma conversa. Sem taxa, sem compromisso.
          </p>
          <button
            type="button"
            onClick={() => openContactModal({ source: 'cruzeiros-brasil' })}
            className="btn-whatsapp btn-specialist inline-flex items-center gap-3 bg-anhanga-yellow text-anhanga-dark font-black px-10 py-5 rounded-2xl hover:bg-anhanga-yellowHover transition-colors text-xl shadow-lg"
            aria-label="Falar com um especialista em cruzeiros"
            data-tracking="footer-cruzeiros-brasil"
          >
            Falar com um especialista
            <ArrowRight className="size-6" />
          </button>
        </div>
      </section>

      {/* Outros serviços */}
      <section className="py-16 bg-anhanga-light">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-2xl font-black text-anhanga-dark mb-8">Outros serviços</h2>
          <div className="grid md:grid-cols-3 gap-4">
            <Link
              to="/consultoria-de-viagem/"
              className="block p-5 rounded-xl bg-white hover:bg-anhanga-blue/10 transition-colors group"
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
              className="block p-5 rounded-xl bg-white hover:bg-anhanga-blue/10 transition-colors group"
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
              className="block p-5 rounded-xl bg-white hover:bg-anhanga-blue/10 transition-colors group"
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
        title="Dúvidas sobre cruzeiros no Brasil"
        subtitle="Tire suas dúvidas antes de escolher seu cruzeiro."
      />

      {/* Footer */}
      <footer className="py-8 bg-anhanga-light border-t border-anhanga-blue/10 text-center text-sm text-zinc-600">
        <p>Anhangá Viagens · Agência de viagens em São Paulo</p>
        <p className="mt-1">Atualizado em abril de 2026</p>
      </footer>
    </div>
  );
};

export default CuradoriaCruzeirosBrasilLanding;

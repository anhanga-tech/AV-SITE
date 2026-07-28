import React from 'react';
import { Link } from 'react-router-dom';
import { Seo } from '../../components/Seo';
import { LandingFAQ } from '../../components/LandingFAQ';
import { BreadcrumbSchema } from '../../components/schemas/BreadcrumbSchema';
import { FAQPageSchema } from '../../components/schemas/FAQPageSchema';
import { ServiceSchema } from '../../components/schemas/ServiceSchema';
import { openContactModal } from '../../utils/contactForm';
import { prefersReducedMotion } from '../../components/landings/shared/motion';
import { m } from 'framer-motion';
import { ShieldCheck, Coffee, Sparkles, CheckCircle, BadgeCheck, Quote } from 'lucide-react';

/*
  Pivô de design (jul/2026) — a versão anterior tinha zero fotografia numa
  landing de turismo (a única imagem da página era o favicon), três cards
  idênticos em grade (proibido no DESIGN.md), botões com scale/shadow-xl em vez
  do press-down do sistema, e corpo em 16px para um público 50+.

  Decisões desta versão, todas ancoradas em PRODUCT.md + DESIGN.md:
  - Corpo em 18px (text-lg) como piso. O PRODUCT.md pede "generosidade de alvo
    e de espaçamento" para o público melhor idade; a Saga, que atende só 50+,
    usa 18px.
  - Fotografia de pessoas em atividade concreta, nunca posando (critério em
    public/images/melhor-idade/CREDITS.md).
  - Pilares com hierarquia assimétrica em vez de três cards iguais.
  - Âmbar Vivo em exatamente 1 elemento por tela (a Regra do Âmbar): o CTA
    do hero. O CTA final usa Céu Vivo para não duplicar o âmbar.
  - Namespace anhanga-* (brand-* é legado congelado pelo guard).
*/

const MELHOR_IDADE_FAQ_ITEMS = [
  {
    question: 'O que define uma viagem para a melhor idade na Anhangá?',
    answer: 'Nossos roteiros focam em ritmo desacelerado, conforto extremo, hotéis com acessibilidade, suporte 24h e curadoria de experiências que valorizam a cultura e a gastronomia local, sem o estresse de deslocamentos exaustivos.'
  },
  {
    question: 'A agência oferece acompanhamento durante a viagem?',
    answer: 'Oferecemos suporte remoto 24h via WhatsApp para qualquer imprevisto. Para grupos específicos, podemos organizar guias acompanhantes especializados no público 50+ que cuidam de toda a logística e bem-estar do grupo.'
  },
  {
    question: 'Quais os destinos mais recomendados para o público 50+?',
    answer: 'Destinos como Portugal, Itália (especialmente Toscana), Gramado no Brasil, e cruzeiros de luxo são favoritos pela infraestrutura e riqueza cultural. Também adaptamos destinos como Orlando com foco em ritmo adequado e conforto.'
  },
  {
    question: 'Como funciona o atendimento personalizado?',
    answer: 'Realizamos uma conversa detalhada para entender preferências de mobilidade, restrições alimentares e interesses culturais. A partir disso, desenhamos um roteiro que respeita o seu tempo e prioriza sua segurança.'
  }
];

/** Botão com a sequência press-down completa do DESIGN.md (rest → hover → active). */
const PRESS_DOWN =
  'transition-[transform,box-shadow] duration-150 ease-out ' +
  'hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] ' +
  'active:translate-x-[4px] active:translate-y-[4px] active:shadow-none ' +
  'motion-reduce:transition-none motion-reduce:hover:translate-x-0 motion-reduce:hover:translate-y-0';

const MelhorIdadeLanding: React.FC = () => {
  const reduceMotion = prefersReducedMotion();
  const rise = (delay: number) =>
    reduceMotion
      ? { initial: { opacity: 1, y: 0 }, animate: { opacity: 1, y: 0 } }
      : {
          initial: { opacity: 0, y: 20 },
          animate: { opacity: 1, y: 0 },
          transition: { delay, duration: 0.5, ease: [0.16, 1, 0.3, 1] as const }
        };

  return (
    <div className="bg-anhanga-light min-h-screen font-sans">
      <Seo
        title="Turismo 50+: Viagens Personalizadas"
        description="Experiências de viagem exclusivas para o público 50+. Roteiros com conforto, segurança e atendimento humano. Planeje sua próxima aventura com a Anhangá."
        canonical="https://www.anhanga.tur.br/melhor-idade/"
        noHreflang
      />
      <ServiceSchema
        name="Viagens Personalizadas Melhor Idade"
        description="Planejamento de viagens focadas no público 50+, com foco em segurança, conforto e experiências culturais enriquecedoras."
        serviceUrl="https://www.anhanga.tur.br/melhor-idade/"
        serviceType="Turismo para Melhor Idade"
        areaServed="Brasil"
      />
      <BreadcrumbSchema
        items={[
          { name: 'Home', item: 'https://www.anhanga.tur.br/' },
          { name: 'Melhor Idade', item: 'https://www.anhanga.tur.br/melhor-idade/' }
        ]}
      />
      <FAQPageSchema items={MELHOR_IDADE_FAQ_ITEMS} />

      {/* MINI HEADER */}
      <div className="bg-white/90 backdrop-blur-md py-4 border-b border-slate-200 sticky top-0 z-[60]">
        <div className="container mx-auto px-6 flex justify-between items-center gap-4">
          <Link
            to="/"
            className="text-base font-bold text-anhanga-dark hover:text-anhanga-blue transition-colors flex items-center gap-2 py-2"
          >
            <span className="size-9 bg-anhanga-action/10 rounded-lg flex items-center justify-center">
              <img src="/favicon.svg" alt="" aria-hidden="true" className="size-5" />
            </span>
            Anhangá Viagens
          </Link>
          <button
            type="button"
            onClick={() => openContactModal({ source: 'melhor-idade' })}
            className="btn-whatsapp btn-specialist min-h-[44px] text-sm font-bold bg-anhanga-dark text-white px-5 py-3 rounded-xl hover:bg-anhanga-darkBlue transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-anhanga-action"
            data-tracking="header-melhor-idade"
          >
            Falar com Especialista
          </button>
        </div>
      </div>

      {/* HERO — foto com o texto no espaço aberto do céu */}
      <section className="relative isolate overflow-hidden bg-anhanga-dark">
        <img
          src="/images/melhor-idade/hero-vista-cidade.jpg"
          alt="Casal apontando para a vista de uma cidade durante uma viagem"
          className="absolute inset-0 size-full object-cover object-bottom"
          fetchPriority="high"
          decoding="async"
        />
        {/*
          Escurecimento funcional (não decorativo) para garantir contraste do texto.
          Mobile: véu uniforme, porque o texto ocupa a largura toda.
          Desktop: gradiente lateral — escurece só o lado do texto e deixa o casal
          e o céu visíveis à direita, que é o motivo de a foto estar ali.
        */}
        <div className="absolute inset-0 bg-anhanga-dark/75 md:hidden" aria-hidden="true" />
        <div
          className="absolute inset-0 hidden md:block bg-gradient-to-r from-anhanga-dark/95 via-anhanga-dark/80 to-anhanga-dark/25"
          aria-hidden="true"
        />

        <div className="container mx-auto px-6 relative py-24 md:py-32">
          <div className="max-w-3xl">
            <m.p {...rise(0)} className="inline-flex items-center gap-2 bg-white/15 text-white px-4 py-2 rounded-full text-xs font-black uppercase tracking-[0.1em] mb-8">
              <Sparkles className="size-4" aria-hidden="true" /> Viagens com Propósito
            </m.p>
            <m.h1
              {...rise(0.1)}
              className="font-display text-4xl md:text-5xl font-black text-white mb-8 leading-[1.1] text-balance"
            >
              O mundo no seu ritmo,<br />
              com o cuidado que você merece.
            </m.h1>
            <m.p {...rise(0.2)} className="text-lg md:text-xl text-white/90 mb-10 leading-relaxed max-w-xl">
              Roteiros desenhados para quem tem tempo de aproveitar de verdade. Menos correria,
              hotéis com acessibilidade real e alguém do outro lado do telefone durante toda a viagem.
            </m.p>
            <m.div {...rise(0.3)} className="flex flex-wrap items-center gap-6">
              <button
                type="button"
                onClick={() => openContactModal({ source: 'melhor-idade' })}
                className={`btn-whatsapp btn-specialist min-h-[44px] bg-anhanga-yellow text-anhanga-dark px-8 py-4 rounded-2xl font-black text-lg shadow-hard hover:bg-anhanga-yellowHover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white ${PRESS_DOWN}`}
                data-tracking="hero-melhor-idade"
              >
                Solicitar Orçamento
              </button>
              <span className="inline-flex items-center gap-2 text-sm font-semibold text-white/90">
                <BadgeCheck className="size-5 shrink-0" aria-hidden="true" />
                Cadastur 37.036.732/0001-41
              </span>
            </m.div>
          </div>
        </div>
      </section>

      {/* PILARES — hierarquia assimétrica, não três cards iguais */}
      <section className="py-20 md:py-28 bg-white">
        <div className="container mx-auto px-6">
          <div className="grid lg:grid-cols-5 gap-12 lg:gap-16 items-start">
            {/* Pilar dominante */}
            <div className="lg:col-span-3">
              <div className="size-14 bg-anhanga-action/10 rounded-2xl flex items-center justify-center text-anhanga-actionDark mb-6">
                <ShieldCheck className="size-7" aria-hidden="true" />
              </div>
              <h2 className="font-display text-3xl md:text-4xl font-extrabold text-anhanga-dark mb-5 leading-tight">
                Segurança não é um item da lista.<br />É o ponto de partida.
              </h2>
              <p className="text-lg text-slate-700 leading-relaxed max-w-prose">
                Escolhemos hotel por elevador e banheiro adaptado antes de escolher por estrela.
                Seguro-viagem com cobertura para condição pré-existente, contratado antes de você
                perguntar. E um número de WhatsApp que responde às três da manhã do outro lado do
                mundo, porque fuso horário não é problema seu.
              </p>
            </div>

            {/* Pilares secundários, peso visual menor */}
            <div className="lg:col-span-2 space-y-10 lg:pt-4">
              <div className="flex gap-5">
                <span className="size-12 shrink-0 bg-anhanga-yellow/15 rounded-xl flex items-center justify-center text-anhanga-dark">
                  <Coffee className="size-6" aria-hidden="true" />
                </span>
                <div>
                  <h3 className="text-xl font-bold text-anhanga-dark mb-2">Ritmo desacelerado</h3>
                  <p className="text-lg text-slate-700 leading-relaxed">
                    Nada de acordar às cinco para pegar três cidades num dia. Pausas planejadas,
                    manhãs livres e a tarde do museu sem hora para acabar.
                  </p>
                </div>
              </div>
              <div className="flex gap-5">
                <span className="size-12 shrink-0 bg-anhanga-blue/10 rounded-xl flex items-center justify-center text-anhanga-blue">
                  <Sparkles className="size-6" aria-hidden="true" />
                </span>
                <div>
                  <h3 className="text-xl font-bold text-anhanga-dark mb-2">Curadoria com opinião</h3>
                  <p className="text-lg text-slate-700 leading-relaxed">
                    A gente já esteve lá. Recomendamos o restaurante certo e dizemos quando um
                    passeio famoso não vale o seu dia.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* RITMO — foto + texto */}
      <section className="py-20 md:py-28 bg-anhanga-light">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div className="order-2 md:order-1">
              <p className="text-xs font-black uppercase tracking-[0.1em] text-anhanga-blue mb-4">
                Como desenhamos o roteiro
              </p>
              <h2 className="font-display text-3xl md:text-4xl font-extrabold text-anhanga-dark mb-6 leading-tight">
                O melhor dia de viagem costuma ser o menos programado
              </h2>
              <p className="text-lg text-slate-700 leading-relaxed mb-5 max-w-prose">
                A diferença está nas escolhas pequenas: o transfer que espera pelo voo atrasado, o
                hotel a duas quadras da praça e não a vinte minutos de caminhada, o passeio marcado
                para depois do café e não às sete da manhã.
              </p>
              <p className="text-lg text-slate-700 leading-relaxed max-w-prose">
                Ajustamos o roteiro ao seu condicionamento físico e aos seus interesses. Se você quer
                museu de manhã e nada à tarde, o roteiro é esse.
              </p>
            </div>
            <div className="order-1 md:order-2">
              <img
                src="/images/melhor-idade/ritmo-ferry.jpg"
                alt="Casal sentado no deck de um barco observando a orla ao entardecer"
                className="w-full rounded-2xl shadow-float object-cover aspect-[4/3]"
                loading="lazy"
                decoding="async"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ATENDIMENTO — foto + texto, lado invertido */}
      <section className="py-20 md:py-28 bg-white">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div>
              <img
                src="/images/melhor-idade/curadoria-loja.jpg"
                alt="Casal escolhendo um chapéu em uma loja durante a viagem"
                className="w-full rounded-2xl shadow-float object-cover aspect-[4/3]"
                loading="lazy"
                decoding="async"
              />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.1em] text-anhanga-blue mb-4">
                Atendimento consultivo
              </p>
              <h2 className="font-display text-3xl md:text-4xl font-extrabold text-anhanga-dark mb-6 leading-tight">
                Você fala com uma pessoa. Sempre a mesma.
              </h2>
              <p className="text-lg text-slate-700 leading-relaxed mb-5 max-w-prose">
                Ao contrário das grandes agências de massa, aqui não existe protocolo nem fila de
                atendimento. A conversa começa com quem vai montar o seu roteiro e termina com a
                mesma pessoa, depois que você voltar.
              </p>
              <p className="text-lg text-slate-700 leading-relaxed max-w-prose">
                É nessa conversa que aparecem as coisas que nenhum formulário captura: o joelho que
                não gosta de escada, a vontade antiga de ver a Toscana, o neto que talvez vá junto.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CONTEÚDO PARA GEO/SEO */}
      <section className="py-20 md:py-28 bg-anhanga-light">
        <div className="container mx-auto px-6 max-w-3xl">
          <h2 className="font-display text-3xl md:text-4xl font-extrabold text-anhanga-dark mb-6 leading-tight">
            Por que planejar sua viagem 50+ com a Anhangá?
          </h2>

          {/*
            A credencial Pastore fica entre o H2 e o primeiro parágrafo por decisão
            anterior (plano de 2026-07-21), coberta por tests/e2e/melhor-idade-credential.spec.ts:
            pílula branca, borda 1px, sem sombra. Não mover sem atualizar o teste.
          */}
          <span className="inline-flex items-center gap-2 rounded-full bg-white border border-slate-200 px-4 py-2 text-sm font-bold text-anhanga-dark mb-8">
            <CheckCircle className="size-4 text-anhanga-blue" aria-hidden="true" />
            Parceira Pastore Turismo
          </span>

          <div className="text-lg text-slate-700 leading-[1.8] space-y-6">
            <p>
              Viajar na maturidade exige um olhar diferente. Não se trata apenas de escolher um
              destino, mas de garantir que cada etapa da jornada seja fluida e prazerosa.
            </p>

            <h3 className="font-display text-2xl font-bold text-anhanga-dark pt-4">
              Infraestrutura e acessibilidade
            </h3>
            <p>
              Selecionamos hotéis que oferecem não apenas conforto, mas <strong>acessibilidade real</strong>:
              elevadores, poucas escadas, banheiros adaptados e localização central para evitar longas
              caminhadas desnecessárias. O foco é a sua autonomia.
            </p>

            <h3 className="font-display text-2xl font-bold text-anhanga-dark pt-4">
              Turismo de transformação
            </h3>
            <p>
              Aos 50, 60 ou 70 anos você tem a bagagem perfeita para apreciar detalhes que passariam
              despercebidos. Por isso sugerimos experiências que conectam você com a alma do lugar —
              um workshop de cerâmica em Portugal, uma degustação privada numa vinícola italiana.
            </p>

            {/*
              Aspas como ícone líder + borda completa, não side-stripe: o DESIGN.md
              proíbe border-left > 1px como acento colorido, e o PRODUCT.md lista
              side-stripe borders entre os anti-padrões da marca.
            */}
            <blockquote className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 my-10 not-italic">
              <Quote className="size-7 text-anhanga-action mb-4" aria-hidden="true" />
              <p className="font-display text-xl md:text-2xl font-bold text-anhanga-dark leading-snug">
                A verdadeira viagem de luxo na melhor idade é aquela em que a única preocupação é
                decidir qual será a próxima memória.
              </p>
            </blockquote>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <LandingFAQ items={MELHOR_IDADE_FAQ_ITEMS} />

      {/* CTA FINAL — Céu Vivo, porque o âmbar já foi gasto no hero */}
      <section className="py-20 md:py-28 container mx-auto px-6">
        <div className="bg-anhanga-dark text-white rounded-3xl px-6 py-16 md:p-20 text-center">
          <h2 className="font-display text-3xl md:text-5xl font-black mb-6 leading-tight">
            Sua próxima viagem começa com uma conversa
          </h2>
          <p className="text-lg md:text-xl text-white/90 mb-10 max-w-2xl mx-auto leading-relaxed">
            Conte para onde você quer ir e em que ritmo. A gente monta a proposta e ajusta com você
            até ficar do seu jeito.
          </p>
          <button
            type="button"
            onClick={() => openContactModal({ source: 'melhor-idade' })}
            className="btn-whatsapp btn-specialist min-h-[44px] bg-anhanga-action text-anhanga-dark px-10 py-5 rounded-2xl font-black text-lg hover:brightness-105 transition-[filter] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            data-tracking="footer-melhor-idade"
          >
            Falar com um Consultor
          </button>
          <div className="flex flex-wrap justify-center gap-3 mt-10">
            <Link
              to="/cruzeiros/"
              className="min-h-[44px] inline-flex items-center px-5 py-3 rounded-full bg-white/10 border border-white/25 text-white font-semibold hover:bg-white/20 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              Cruzeiros pelo Brasil
            </Link>
            <Link
              to="/consultoria-de-viagem/"
              className="min-h-[44px] inline-flex items-center px-5 py-3 rounded-full bg-white/10 border border-white/25 text-white font-semibold hover:bg-white/20 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              Consultoria de Viagem
            </Link>
            <Link
              to="/blog/"
              className="min-h-[44px] inline-flex items-center px-5 py-3 rounded-full bg-white/10 border border-white/25 text-white font-semibold hover:bg-white/20 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              Dicas de Viagem
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default MelhorIdadeLanding;

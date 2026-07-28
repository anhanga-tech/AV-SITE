import { Link } from 'react-router-dom';
import { m } from 'framer-motion';
import { ShieldCheck, Coffee, Sparkles, CheckCircle, BadgeCheck, Quote } from 'lucide-react';
import { prefersReducedMotion } from '@/components/landings/shared/motion';
import { openContactModal } from '@/utils/contactForm';

/*
  Seções da landing /melhor-idade, extraídas da página no pivô de design de
  jul/2026 (segue o padrão de ConsultoriaLandingSections).

  Decisões de design ancoradas em PRODUCT.md + DESIGN.md:
  - Corpo em 18px (text-lg) como piso. O PRODUCT.md pede "generosidade de alvo
    e de espaçamento" para o público melhor idade; a Saga, que atende só 50+,
    usa 18px.
  - Fotografia de pessoas em atividade concreta, nunca posando (critério e
    origem em public/images/melhor-idade/CREDITS.md).
  - Pilares com hierarquia assimétrica em vez de três cards iguais.
  - Âmbar Vivo em exatamente 1 elemento por tela (a Regra do Âmbar): o CTA do
    hero. O CTA final usa Céu Vivo para não duplicar o âmbar.
*/

const CONTACT_SOURCE = { source: 'melhor-idade' } as const;

/** Sequência press-down completa do DESIGN.md (rest → hover → active). */
const PRESS_DOWN =
  'transition-[transform,box-shadow] duration-150 ease-out ' +
  'hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] ' +
  'active:translate-x-[4px] active:translate-y-[4px] active:shadow-none ' +
  'motion-reduce:transition-none motion-reduce:hover:translate-x-0 motion-reduce:hover:translate-y-0';

/*
  Não é um hook React (não usa estado nem efeito) — daí o nome sem `use`, que
  evita disparar as rules-of-hooks por engano. prefersReducedMotion é uma
  leitura pontual em render, como documentado em landings/shared/motion.ts.
*/
function buildRise() {
  const reduceMotion = prefersReducedMotion();
  return (delay: number) =>
    reduceMotion
      ? { initial: { opacity: 1, y: 0 }, animate: { opacity: 1, y: 0 } }
      : {
          initial: { opacity: 0, y: 20 },
          animate: { opacity: 1, y: 0 },
          transition: { delay, duration: 0.5, ease: [0.16, 1, 0.3, 1] as const }
        };
}

export function MelhorIdadeNav() {
  return (
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
          onClick={() => openContactModal(CONTACT_SOURCE)}
          className="btn-whatsapp btn-specialist min-h-[44px] text-sm font-bold bg-anhanga-dark text-white px-5 py-3 rounded-xl hover:bg-anhanga-darkBlue transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-anhanga-action"
          data-tracking="header-melhor-idade"
        >
          Falar com Especialista
        </button>
      </div>
    </div>
  );
}

export function MelhorIdadeHero() {
  const rise = buildRise();

  return (
    <section className="relative isolate overflow-hidden bg-anhanga-dark">
      {/*
        Dois recortes da mesma foto: retrato no mobile e paisagem no desktop.
        Um asset retrato só, esticado por object-cover num hero largo e baixo,
        cortava as cabeças do casal e todo o céu que segura o texto (apontado
        na review da PR #1316 e confirmado em 1440px).
      */}
      <picture>
        <source
          media="(min-width: 768px)"
          type="image/webp"
          srcSet="/images/melhor-idade/hero-desktop-1100.webp 1100w, /images/melhor-idade/hero-desktop-1600.webp 1600w"
          sizes="100vw"
        />
        <img
          src="/images/melhor-idade/hero-mobile-800.webp"
          alt="Casal apontando para a vista de uma cidade durante uma viagem"
          width={533}
          height={800}
          className="absolute inset-0 size-full object-cover object-center"
          fetchPriority="high"
          decoding="async"
        />
      </picture>
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
          <m.p
            {...rise(0)}
            className="inline-flex items-center gap-2 bg-white/15 text-white px-4 py-2 rounded-full text-xs font-black uppercase tracking-[0.1em] mb-8"
          >
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
              onClick={() => openContactModal(CONTACT_SOURCE)}
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
  );
}

export function MelhorIdadePillars() {
  return (
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
  );
}

export function MelhorIdadeRhythm() {
  return (
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
              src="/images/melhor-idade/ritmo-ferry-1400.webp"
              srcSet="/images/melhor-idade/ritmo-ferry-700.webp 700w, /images/melhor-idade/ritmo-ferry-1400.webp 1400w"
              sizes="(min-width: 768px) 50vw, 100vw"
              alt="Casal sentado no deck de um barco observando a orla ao entardecer"
              width={1400}
              height={933}
              className="w-full rounded-2xl shadow-float object-cover aspect-[4/3]"
              loading="lazy"
              decoding="async"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

export function MelhorIdadeAdvisory() {
  return (
    <section className="py-20 md:py-28 bg-white">
      <div className="container mx-auto px-6">
        <div className="grid md:grid-cols-2 gap-12 lg:gap-20 items-center">
          <div>
            <img
              src="/images/melhor-idade/curadoria-loja-1400.webp"
              srcSet="/images/melhor-idade/curadoria-loja-700.webp 700w, /images/melhor-idade/curadoria-loja-1400.webp 1400w"
              sizes="(min-width: 768px) 50vw, 100vw"
              alt="Casal escolhendo um chapéu em uma loja durante a viagem"
              width={1400}
              height={933}
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
  );
}

export function MelhorIdadeContent() {
  return (
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
  );
}

export function MelhorIdadeFinalCta() {
  return (
    <section className="py-20 md:py-28 container mx-auto px-6">
      <div className="bg-anhanga-dark text-white rounded-3xl px-6 py-16 md:p-20 text-center">
        <h2 className="font-display text-3xl md:text-5xl font-black mb-6 leading-tight">
          Sua próxima viagem começa com uma conversa
        </h2>
        <p className="text-lg md:text-xl text-white/90 mb-10 max-w-2xl mx-auto leading-relaxed">
          Conte para onde você quer ir e em que ritmo. A gente monta a proposta e ajusta com você
          até ficar do seu jeito.
        </p>
        {/* Céu Vivo, não âmbar: a Regra do Âmbar reserva 1 uso por tela, gasto no hero. */}
        <button
          type="button"
          onClick={() => openContactModal(CONTACT_SOURCE)}
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
  );
}

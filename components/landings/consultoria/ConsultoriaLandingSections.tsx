import { Link } from 'react-router-dom';
import { m } from 'framer-motion';
import { ArrowRight, CheckCircle, MessageSquare, Users, Headphones, Compass } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { LazyImage } from '@/components/ui/LazyImage';
import { fadeUp } from '@/components/landings/shared/constants';
import { openContactModal } from '@/utils/contactForm';
import { getDestinationImage } from '@/data/mediaConfig';

// 4 itens, não 5: chunking ≤4 do critique — os antigos itens 4 e 5
// ("viajantes frequentes" / "profissionais sem tempo") eram o mesmo perfil.
const FOR_WHO = [
  'Quem quer viajar bem sem precisar cuidar de cada detalhe',
  'Famílias que buscam conforto e segurança no roteiro',
  'Casais planejando viagem especial ou lua de mel',
  'Viajantes frequentes sem tempo de pesquisar e comparar opções',
];

const HOW_IT_WORKS = [
  {
    step: '01',
    title: 'Conversa inicial',
    // Não prometer "sem formulário": o CTA da página abre o ContactModal, que
    // é um formulário — Riley pegava a contradição na hora. Ver critique.
    desc: 'Você fala com um consultor e conta o que precisa. Uma conversa de verdade, sem burocracia.'
  },
  {
    step: '02',
    title: 'Roteiro personalizado',
    desc: 'Em até 5 dias úteis, você recebe um roteiro feito do zero para o seu perfil.'
  },
  {
    step: '03',
    title: 'Suporte durante a viagem',
    desc: 'WhatsApp 24h com o mesmo consultor. Qualquer imprevisto tem resposta imediata.'
  },
];

const PILLARS = [
  {
    icon: MessageSquare,
    title: 'Sem pacote pronto',
    desc: 'Cada roteiro começa do zero, no perfil de quem vai viajar. Nada de escolher entre opções genéricas.',
    variant: 'light' as const
  },
  {
    icon: Users,
    title: 'Atendimento humano',
    desc: 'Um consultor real do início ao fim. Não um chatbot, não uma central de atendimento.',
    variant: 'filled' as const
  },
  {
    icon: Headphones,
    title: 'Suporte completo',
    desc: 'Antes, durante e depois da viagem. WhatsApp direto com seu consultor para qualquer imprevisto.',
    variant: 'light' as const
  },
];

const CREDENTIALS = [
  'Fundada em 2018',
  'Nota 5.0 no Google',
  'Atendimento humano',
];

export function ConsultoriaHero() {
  return (
    /* Hero */
    /*
      Espaçamento e tamanho do texto reduzidos em mobile (md: restaura os
      valores originais): em telas curtas (~360-812px de altura) o CTA e o
      disclaimer "Sem taxa..." caem perto do fim do viewport inicial, e o
      banner de cookies (fixed bottom-0) os cobre antes de qualquer scroll
      — combinado com CookieConsentBanner.tsx, que também foi compactado
      no mobile. Ver critique de /consultoria-de-viagem.
    */
    /*
      max-w-4xl (não 3xl): a 3xl o H1 text-6xl quebrava em 4 linhas e
      empurrava o par CTA + "Sem taxa..." para fora da dobra a 1366×768
      (laptop mais comum no Brasil). Ver critique de /consultoria-de-viagem.
    */
    <section className="pt-3 md:pt-16 pb-20 px-6">
      <div className="max-w-4xl mx-auto">
        <m.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={0}
          className="inline-flex items-center gap-2 rounded-full border border-anhanga-blue/20 bg-anhanga-blue/5 px-3 py-0.5 md:py-1 mb-2 md:mb-5 text-[11px] md:text-xs font-black uppercase tracking-wide md:tracking-widest text-anhanga-blue"
        >
          {/*
            "todo o Brasil", não "São Paulo": o badge é a primeira leitura da
            página e cercava quem chega de fora de SP — a correção só aparecia
            na 3ª pergunta do FAQ. O sinal local de SEO permanece no <title> e
            no areaServed do ServiceSchema. Ver critique de /consultoria-de-viagem.
          */}
          <Compass className="size-3.5" aria-hidden="true" />
          Consultoria de viagem · todo o Brasil
        </m.div>
        <m.h1
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={1}
          className="text-balance text-4xl md:text-6xl font-black text-anhanga-dark mb-2 md:mb-6 leading-[1.1]"
        >
          Planeje uma viagem sob medida sem depender de pacote pronto
        </m.h1>
        <m.p
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={2}
          className="text-base md:text-xl text-zinc-600 mb-3 md:mb-10 leading-relaxed max-w-2xl"
        >
          Um consultor da Anhangá entende seu perfil, destino, orçamento e restrições para desenhar o melhor caminho antes de você fechar.
        </m.p>
        <m.div variants={fadeUp} initial="hidden" animate="visible" custom={3}>
          <Button
            variant="cta"
            size="lg"
            onClick={() => openContactModal({ source: 'consultoria-viagem' })}
            className="btn-whatsapp btn-specialist font-black"
            rightIcon={<ArrowRight className="size-5" aria-hidden="true" />}
            data-tracking="hero-consultoria-viagem"
          >
            Falar com um consultor
          </Button>
          <p className="mt-1 md:mt-4 text-sm text-zinc-600">Sem taxa de consultoria. Gratuito.</p>
        </m.div>
      </div>
    </section>
  );
}

export function ConsultoriaBenefits() {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-5xl mx-auto px-6">
        {/*
          margin de um viewport de altura (100%) abaixo do viewport (mesma
          convenção em todas as seções seguintes): dispara a revelação antes da
          seção entrar na tela, não quando já está visível. Sem isso, rolagem
          rápida mostrava conteúdo semitransparente mesmo já dentro do viewport
          — lia como página quebrada. Ver critique de /consultoria-de-viagem.
        */}
        <m.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2, margin: '0px 0px 100% 0px' }}
          custom={0}
          className="mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-black text-anhanga-dark mb-3">
            Por que consultoria?
          </h2>
          <p className="text-zinc-600 text-lg">
            Porque viajar bem não é só escolher um destino.
          </p>
        </m.div>
        <div className="grid md:grid-cols-3 gap-6">
          {PILLARS.map(({ icon: Icon, title, desc, variant }, idx) => (
            <m.div
              key={title}
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2, margin: '0px 0px 100% 0px' }}
              custom={idx + 1}
              // Sem lift no hover: os cards não são clicáveis, e sombra que
              // cresce ao passar o mouse é affordance de clique sem clique.
              className={`p-8 rounded-2xl ${
                variant === 'filled'
                  ? 'bg-anhanga-blue text-white'
                  : 'bg-anhanga-light shadow-float'
              }`}
            >
              <div
                className={`size-11 rounded-xl flex items-center justify-center mb-5 ${
                  variant === 'filled' ? 'bg-white/15' : 'bg-anhanga-blue/10'
                }`}
              >
                <Icon
                  className={`size-5 ${variant === 'filled' ? 'text-white' : 'text-anhanga-blue'}`}
                  aria-hidden="true"
                />
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

export function ConsultoriaAudience() {
  return (
    <section className="py-20 bg-anhanga-light">
      <div className="max-w-5xl mx-auto px-6">
        <div className="md:grid md:grid-cols-2 md:gap-16 items-start">
          <m.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2, margin: '0px 0px 100% 0px' }}
            custom={0}
          >
            <h2 className="text-3xl md:text-4xl font-black text-anhanga-dark mb-8">
              Para quem é
            </h2>
            <ul className="space-y-4">
              {FOR_WHO.map(item => (
                <li key={item} className="flex items-start gap-3">
                  <CheckCircle className="size-5 text-anhanga-blue flex-shrink-0 mt-0.5" aria-hidden="true" />
                  <span className="text-zinc-700 leading-snug">{item}</span>
                </li>
              ))}
            </ul>
          </m.div>
          <m.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2, margin: '0px 0px 100% 0px' }}
            custom={1}
            className="mt-12 md:mt-0 overflow-hidden rounded-3xl bg-white shadow-float"
          >
            {/*
              Depoimento pareado com o lugar real da viagem (não um ícone
              genérico): reforça "lugares reais, não categorias de
              produto" — a página inteira era só tipografia + ícones antes
              desta correção. Ver critique de /consultoria-de-viagem.
            */}
            <LazyImage
              src={getDestinationImage('Lisboa')}
              alt="Lisboa, Portugal — destino da viagem relatada no depoimento"
              width={640}
              height={280}
              className="h-48 w-full"
            />
            <div className="p-8">
              <blockquote className="text-xl text-anhanga-dark font-semibold leading-relaxed">
                "A Anhangá cuidou de cada detalhe. Só precisei aparecer no aeroporto."
              </blockquote>
              <p className="mt-4 text-zinc-600 text-sm">
                R.M. · São Paulo · Viagem para Portugal, 2025
              </p>
            </div>
          </m.div>
        </div>
      </div>
    </section>
  );
}

export function ConsultoriaProcess() {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-5xl mx-auto px-6">
        <m.h2
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2, margin: '0px 0px 100% 0px' }}
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
              viewport={{ once: true, amount: 0.3, margin: '0px 0px 100% 0px' }}
              custom={idx + 1}
              className={`flex gap-6 py-8 ${idx < HOW_IT_WORKS.length - 1 ? 'border-b border-zinc-100' : ''}`}
            >
              <div className="flex-shrink-0 size-12 rounded-full bg-anhanga-blue/10 flex items-center justify-center">
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

export function ConsultoriaAbout() {
  return (
    <section className="py-20 bg-anhanga-light">
      <div className="max-w-5xl mx-auto px-6">
        <div className="md:grid md:grid-cols-2 md:gap-16 items-center">
          <m.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2, margin: '0px 0px 100% 0px' }}
            custom={0}
            className="overflow-hidden rounded-3xl shadow-float"
          >
            {/*
              Segunda foto real da página (a primeira é o depoimento de
              Lisboa) — "Sobre" era só tipografia antes, contrariando
              "lugares reais, não categorias" para um brief sobre viagens.
              Ver critique de /consultoria-de-viagem (P2).
            */}
            <LazyImage
              src={getDestinationImage('Rio de Janeiro')}
              alt="Rio de Janeiro — um dos destinos planejados pela Anhangá Viagens"
              width={640}
              height={480}
              className="h-64 md:h-80 w-full"
            />
          </m.div>
          <m.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2, margin: '0px 0px 100% 0px' }}
            custom={1}
            className="mt-10 md:mt-0 text-center md:text-left"
          >
            <h2 className="text-3xl md:text-4xl font-black text-anhanga-dark mb-6">
              Sobre a Anhangá Viagens
            </h2>
            <p className="text-lg text-zinc-600 leading-relaxed">
              Agência de viagens em São Paulo, especializada em viagens personalizadas desde 2018. Atendimento humano, nota 5.0 no Google e consultor fixo do início ao fim da sua viagem.
            </p>
            <div className="mt-10 flex flex-wrap justify-center md:justify-start gap-3">
              {CREDENTIALS.map(item => (
                <span
                  key={item}
                  // Borda 1px, não shadow-float: pílula branca elevada parecia
                  // clicável (spec de Badge do DESIGN.md: borda, sem sombra).
                  className="inline-flex items-center gap-2 rounded-full bg-white border border-zinc-200 px-4 py-2 text-sm font-bold text-anhanga-dark"
                >
                  <CheckCircle className="size-4 text-anhanga-blue" aria-hidden="true" />
                  {item}
                </span>
              ))}
            </div>
          </m.div>
        </div>
      </div>
    </section>
  );
}

export function ConsultoriaFinalCta() {
  return (
    <section className="py-20 bg-anhanga-blue">
      <m.div
        variants={fadeUp}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3, margin: '0px 0px 100% 0px' }}
        custom={0}
        className="max-w-3xl mx-auto px-6 text-center"
      >
        <h2 className="text-3xl md:text-5xl font-black text-white mb-6">
          Pronto para planejar sua viagem?
        </h2>
        <p className="text-blue-100 text-lg mb-10 max-w-xl mx-auto">
          Fale com um consultor agora. Sem taxa, sem compromisso.
        </p>
        <Button
          variant="cta"
          size="lg"
          onClick={() => openContactModal({ source: 'consultoria-viagem' })}
          className="btn-whatsapp btn-specialist font-black"
          rightIcon={<ArrowRight className="size-6" aria-hidden="true" />}
          data-tracking="footer-consultoria-viagem"
        >
          Falar com um consultor
        </Button>
      </m.div>
    </section>
  );
}

export function ConsultoriaOtherServices() {
  return (
    <section className="py-16 bg-anhanga-light">
      <div className="max-w-5xl mx-auto px-6">
        <h2 className="text-2xl font-black text-anhanga-dark mb-8">Outros serviços</h2>
        <div className="grid md:grid-cols-3 gap-4">
          <Link
            to="/corporativo/"
            className="block p-5 rounded-xl bg-white hover:bg-anhanga-blue/5 transition-colors group focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-anhanga-action"
          >
            <div className="font-bold text-anhanga-dark group-hover:text-anhanga-blue transition-colors">
              Viagens para Executivos
            </div>
            <div className="text-sm text-zinc-600 mt-1">
              Planejamento com precisão para profissionais
            </div>
          </Link>
          <Link
            to="/cruzeiros/"
            className="block p-5 rounded-xl bg-white hover:bg-anhanga-blue/5 transition-colors group focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-anhanga-action"
          >
            <div className="font-bold text-anhanga-dark group-hover:text-anhanga-blue transition-colors">
              Curadoria de Cruzeiros
            </div>
            <div className="text-sm text-zinc-600 mt-1">
              Escolha o navio e a cabine certos para você
            </div>
          </Link>
          <Link
            to="/"
            className="block p-5 rounded-xl bg-white hover:bg-anhanga-blue/5 transition-colors group focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-anhanga-action"
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

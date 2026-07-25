import { Link } from 'react-router-dom';
import { m } from 'framer-motion';
import { ArrowRight, CheckCircle, Eye, FileText, Compass } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { LazyImage } from '@/components/ui/LazyImage';
import { fadeUp } from '@/components/landings/shared/constants';
import { openContactModal } from '@/utils/contactForm';
import { openConsultoriaBooking, CONSULTORIA_BOOKING_URL } from '@/lib/cal-embed';
import { getDestinationImage } from '@/data/mediaConfig';

// CONSULTORIA_BOOKING_URL (Cal.com Cloud) e openConsultoriaBooking vêm de
// lib/cal-embed — fonte única do link e do embed. Cloud, não self-hosted: a
// imagem self-host estava sem patch de segurança desde março/2026, inaceitável
// no caminho do pagamento. Ver memória project-consultoria-modelo-pago.

// A autosseleção da página (grilling 24/07): a consultoria paga é para os
// casos NÃO-comissionáveis. Quem vai fechar a viagem com a Anhangá cai na
// porta gratuita (ContactModal), sinalizada no callout de ConsultoriaAudience.
const FOR_WHO = [
  'Você já comprou a viagem e quer um roteiro que aproveite cada dia',
  'Vai usar milhas próprias e quer emitir do jeito certo',
  'Tem uma viagem de trabalho e quer emendar uns dias de lazer',
  'Quer o olhar de um especialista antes de decidir, sem pacote pronto',
];

const HOW_IT_WORKS = [
  {
    step: '01',
    title: 'Agende e reserve seu horário',
    desc: 'Escolha o horário, pague a sessão e receba o link da videochamada no e-mail.'
  },
  {
    step: '02',
    title: 'Sessão de 50 minutos',
    desc: 'Você conta o caso e o consultor diagnostica destino, roteiro, milhas e orçamento.'
  },
  {
    step: '03',
    title: 'Seu plano por escrito',
    desc: 'Em até 48h chega um documento com o diagnóstico, o que recomendamos e por onde começar.'
  },
  {
    step: '04',
    title: 'Se quiser, a gente executa',
    desc: 'O roteiro completo é orçado à parte, e os R$ 250 da sessão entram no valor.'
  },
];

const PILLARS = [
  {
    icon: Eye,
    title: 'Um olhar de quem faz isso todo dia',
    desc: 'Quem planeja viagens para viver enxerga a sua de um jeito que buscador nenhum entrega.',
    variant: 'light' as const
  },
  {
    icon: FileText,
    title: 'Você sai com um plano',
    desc: 'Não paramos na conversa. Em até 48h você recebe um documento com o diagnóstico e os próximos passos.',
    variant: 'filled' as const
  },
  {
    icon: Compass,
    title: 'Conselho sobre a sua viagem, não sobre o catálogo',
    desc: 'A gente recomenda o que é melhor pra você, mesmo quando não é o que temos para vender.',
    variant: 'light' as const
  },
];

const CREDENTIALS = [
  'Fundada em 2025',
  'Nota 5.0 no Google',
  'Atendimento humano',
];

export function ConsultoriaHero() {
  return (
    /* Hero */
    /*
      Espaçamento e tamanho do texto reduzidos em mobile (md: restaura os
      valores originais): em telas curtas (~360-812px de altura) o CTA e a
      sub-linha logo abaixo dele caem perto do fim do viewport inicial, e o
      banner de cookies (fixed bottom-0) os cobre antes de qualquer scroll
      — combinado com CookieConsentBanner.tsx, que também foi compactado
      no mobile. Regressão travada em landing-consultoria-content.spec.ts.
    */
    /*
      A estrutura DOM coloca a imagem após o bloco de texto para garantir que
      a "dobra" do mobile permaneça livre de interferências visuais grandes e 
      o CTA continue visível num iPhone SE (375x667). 
      Em Desktop, renderiza em grid simétrico de duas colunas (max-w-6xl).
    */
    <section className="relative w-full pt-16 md:pt-24 pb-28 px-6 overflow-hidden">
      {/* Background Premium Dark */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-[#001836] via-[#003B8E] to-[#0056D2]" />
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />
        <div
          className="hidden md:block absolute inset-0 opacity-20"
          style={{ backgroundImage: "url('/noise.png')" }}
        />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto md:grid md:grid-cols-2 md:gap-12 md:items-center">
        <div className="mb-16 md:mb-0">
          <m.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={0}
            className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-0.5 md:py-1 mb-2 md:mb-5 text-[11px] md:text-xs font-black uppercase tracking-wide md:tracking-widest text-white backdrop-blur-sm"
          >
            {/*
              "todo o Brasil", não "São Paulo": o badge é a primeira leitura da
              página e cercava quem chega de fora de SP — a correção só aparecia
              na 3ª pergunta do FAQ. O sinal local de SEO permanece no <title> e
              no areaServed do ServiceSchema. Ver critique de /consultoria-de-viagem.
            */}
            <Compass className="size-3.5 text-anhanga-yellow" aria-hidden="true" weight="fill" />
            Consultoria de viagem · online, todo o Brasil
          </m.div>
          <m.h1
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={1}
            className="text-balance text-4xl md:text-5xl lg:text-6xl font-black text-white mb-2 md:mb-6 leading-[1.1] drop-shadow-lg"
          >
            Um especialista para pensar a sua viagem
          </m.h1>
          <m.p
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={2}
            className="text-base md:text-xl text-white/90 mb-3 md:mb-10 leading-relaxed max-w-lg drop-shadow-md"
          >
            Uma sessão de 50 minutos para diagnosticar a sua viagem e te entregar um plano por escrito.
          </m.p>
          <m.div variants={fadeUp} initial="hidden" animate="visible" custom={3}>
            {/*
              CTA pago com progressive enhancement: <a href> real para o Cal.com
              (asChild) + onClick que abre o embed (openConsultoriaBooking) com
              preventDefault. Sem JS/no prerender continua um link que funciona;
              com JS, abre o modal sobre a página. SEM btn-whatsapp/btn-specialist
              (public/utm-tracking.js dispara whatsapp_cta_click em qualquer
              .btn-whatsapp — falso num link de agendamento). data-no-specialist-cta
              evita o falso specialist_cta_click: "Agendar consultoria" casaria no
              heurístico textual de isSpecialistCtaText (contém "consultoria").
            */}
            <Button
              asChild
              variant="cta"
              size="lg"
              className="font-black bg-anhanga-yellow text-anhanga-dark hover:bg-yellow-400 border-none shadow-[4px_4px_0px_rgba(0,0,0,0.2)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_rgba(0,0,0,0.2)] active:shadow-none active:translate-x-[4px] active:translate-y-[4px] transition-all"
            >
              <a
                href={CONSULTORIA_BOOKING_URL}
                onClick={(e) => { e.preventDefault(); openConsultoriaBooking(); }}
                data-tracking="hero-consultoria-viagem"
                data-no-specialist-cta
              >
                Agendar consultoria · R$ 250
                <ArrowRight className="size-5" aria-hidden="true" />
              </a>
            </Button>
            {/*
              UMA sub-linha (não duas): em 375×667 com o banner de cookies (fixed
              bottom-0), cada linha extra empurra o conteúdo para baixo da dobra —
              o hero foi calibrado a ferro para isso (ver landing-consultoria-
              content.spec.ts). A porta gratuita fica embutida aqui, não numa
              segunda linha, para proteger o funil do core sem estourar a dobra.
            */}
            <p className="mt-4 md:mt-6 text-sm text-white/80">
              Vai viajar com a Anhangá?{' '}
              {/*
                data-specialist-cta: opt-in explícito no specialist_cta_click. O
                texto "Fale com um consultor" não casa no heurístico textual de
                isSpecialistCtaText ("consultor" ≠ "consultoria"), então sem este
                atributo a porta gratuita ficaria fora da métrica do funil. Sem
                btn-whatsapp (abre modal, não é link de WhatsApp).
              */}
              <button
                type="button"
                onClick={() => openContactModal({ source: 'consultoria-viagem-gratuito' })}
                className="font-bold text-white underline underline-offset-4 hover:text-white/70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white transition-colors"
                data-tracking="hero-consultoria-porta-gratuita"
                data-specialist-cta
              >
                Fale com um consultor
              </button>
              , é grátis.
            </p>
          </m.div>
        </div>

        {/* O "Diário de Bordo" / Visualização da proposta */}
        <m.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={4}
          className="relative block"
        >
          <div className="relative overflow-hidden rounded-3xl bg-anhanga-light shadow-2xl aspect-[4/3] md:aspect-square lg:aspect-[4/3] border-[6px] border-white/20 backdrop-blur-sm">
            <LazyImage
              src={getDestinationImage('Paris')}
              alt="Plano de viagem em Paris"
              width={800}
              height={600}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-tr from-anhanga-dark/40 to-transparent pointer-events-none" />
          </div>
          
          <div className="absolute -bottom-6 -left-2 sm:-left-4 md:-bottom-8 md:-left-8 bg-white p-3 sm:p-4 rounded-2xl shadow-xl border border-zinc-100 flex items-center gap-3 sm:gap-4 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-500 fill-mode-both">
            <div className="flex -space-x-2">
              <div className="size-8 sm:size-10 rounded-full border-2 border-white bg-anhanga-blue/10 flex items-center justify-center shrink-0">
                <CheckCircle className="size-4 sm:size-5 text-anhanga-blue" aria-hidden="true" />
              </div>
              <div className="size-8 sm:size-10 rounded-full border-2 border-white bg-green-50 flex items-center justify-center shrink-0">
                <FileText className="size-4 text-green-600" aria-hidden="true" />
              </div>
            </div>
            <div>
              <p className="text-[10px] sm:text-xs font-black text-anhanga-dark uppercase tracking-wider">O Diário de Bordo</p>
              <p className="text-xs sm:text-sm text-zinc-500 font-medium">Plano por escrito</p>
            </div>
          </div>
        </m.div>
      </div>

      {/* Wave transition para ligar com a seção branca inferior */}
      <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-none rotate-180 z-10">
        <svg className="relative block w-[calc(100%+1.3px)] h-[60px]" viewBox="0 0 1200 120" preserveAspectRatio="none">
          <path
            d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z"
            className="fill-white"
          />
        </svg>
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
            Por que uma consultoria paga?
          </h2>
          <p className="text-zinc-600 text-lg">
            Um bom plano de viagem dá trabalho. E trabalho rende mais quando começa a sério.
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
            {/*
              Porta gratuita da autosseleção (grilling 24/07): quem vai fechar
              a viagem com a Anhangá dá comissão e não deve pagar a sessão —
              este callout o desvia para o ContactModal antes do checkout pago.
            */}
            <div className="mt-8 rounded-2xl border border-anhanga-blue/20 bg-white p-5">
              <p className="text-zinc-700 leading-snug">
                Vai fechar a viagem com a Anhangá? A conversa é outra, e é gratuita.{' '}
                {/* data-specialist-cta: mesma razão do link do hero — mantém a porta gratuita no specialist_cta_click. */}
                <button
                  type="button"
                  onClick={() => openContactModal({ source: 'consultoria-viagem-gratuito' })}
                  className="font-bold text-anhanga-blue underline underline-offset-2 hover:text-anhanga-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-anhanga-action"
                  data-tracking="audience-consultoria-porta-gratuita"
                  data-specialist-cta
                >
                  Fale com um consultor
                </button>
              </p>
            </div>
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
              Agência de viagens fundada em São Paulo em 2025, hoje atendendo viajantes de todo o Brasil. Atendimento humano, nota 5.0 no Google e consultor fixo do início ao fim da sua viagem.
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
          Vamos pensar a sua próxima viagem
        </h2>
        <p className="text-blue-100 text-lg mb-10 max-w-xl mx-auto">
          50 minutos com um consultor da Anhangá e um plano por escrito. Se você seguir com a consultoria completa, os R$ 250 entram no valor.
        </p>
        {/* Sem btn-whatsapp/btn-specialist e com data-no-specialist-cta: link de agendamento, não CTA de contato (ver Hero). */}
        <Button
          asChild
          variant="cta"
          size="lg"
          className="font-black"
        >
          <a
            href={CONSULTORIA_BOOKING_URL}
            onClick={(e) => { e.preventDefault(); openConsultoriaBooking(); }}
            data-tracking="footer-consultoria-viagem"
            data-no-specialist-cta
          >
            Agendar consultoria · R$ 250
            <ArrowRight className="size-6" aria-hidden="true" />
          </a>
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

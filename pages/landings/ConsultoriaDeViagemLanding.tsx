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
import { LandingNav } from '@/components/landings/shared/LandingNav';
import { LandingFooter } from '@/components/landings/shared/LandingFooter';
import { fadeUp } from '@/components/landings/shared/constants';
import { openContactModal } from '@/utils/contactForm';
import { getDestinationImage } from '@/data/mediaConfig';
import { ArrowRight, CheckCircle, MessageSquare, Users, Headphones, Compass } from 'lucide-react';

const FAQ_ITEMS = [
  {
    question: 'O que é uma consultoria de viagem?',
    answer: 'É uma sessão com um consultor humano da Anhangá para entender seu perfil, destino e orçamento e montar o melhor roteiro — sem pacote pronto e sem improviso.'
  },
  {
    question: 'Quanto custa a consultoria?',
    answer: 'Sem taxa de consultoria no momento. Você fala com um consultor gratuitamente e decide se quer fechar sua viagem com a Anhangá.'
  },
  {
    question: 'Vocês fazem viagens internacionais?',
    answer: 'Sim. A Anhangá Viagens planeja viagens internacionais para Europa, América do Norte, América do Sul, Ásia e Caribe, com foco em roteiros personalizados e suporte durante toda a viagem.'
  },
  {
    question: 'Qual o diferencial da Anhangá?',
    answer: 'Atendimento consultivo com consultor fixo do início ao fim, roteiro feito do zero para o seu perfil e suporte 24h via WhatsApp durante a viagem.'
  },
  {
    question: 'Qual o prazo para montar um roteiro?',
    answer: 'Entre 2 e 5 dias úteis após a conversa inicial, dependendo da complexidade do destino e do número de viajantes.'
  }
];

const FOR_WHO = [
  'Quem quer viajar bem sem precisar cuidar de cada detalhe',
  'Famílias que buscam conforto e segurança no roteiro',
  'Casais planejando viagem especial ou lua de mel',
  'Viajantes frequentes que querem uma agência de confiança',
  'Profissionais sem tempo para pesquisar e comparar opções',
];

const HOW_IT_WORKS = [
  {
    step: '01',
    title: 'Conversa inicial',
    desc: 'Você fala com um consultor e conta o que precisa. Sem formulário, sem burocracia.'
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
    desc: 'Um consultor real do início ao fim. Não um chatbot, não um formulário.',
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

const ConsultoriaDeViagemLanding: React.FC = () => {
  return (
    <>
      {/*
        No-JS / pre-hydration fallback: framer-motion serializa os estilos
        `initial` (opacity:0) no HTML pré-renderizado. Sem JS a revelação
        nunca dispara e as seções ficariam em branco. Isso força visibilidade
        quando scripts estão desabilitados; com JS o seletor fica inerte e as
        entradas animam normalmente.
      */}
      <noscript>
        <style>{`[data-consultoria-landing] [style*="opacity"]{opacity:1!important}`}</style>
      </noscript>
      <MotionConfig reducedMotion="user">
      <div data-consultoria-landing className="bg-white min-h-screen font-sans">
        <Seo
          title="Consultoria de Viagem Sob Medida em SP — Anhangá Viagens"
          description="Planeje sua viagem com consultores humanos. Sem pacote pronto, sem improviso. Roteiro personalizado com suporte antes, durante e depois."
          canonical="https://www.anhanga.tur.br/consultoria-de-viagem/"
          noHreflang
        />
        <ServiceSchema
          name="Consultoria de Viagem Sob Medida"
          description="Planejamento personalizado de viagens com consultor humano, sem pacote pronto. Atendimento consultivo com suporte antes, durante e depois da viagem."
          serviceUrl="https://www.anhanga.tur.br/consultoria-de-viagem/"
          serviceType="Consultoria de Viagem"
          areaServed="São Paulo e Brasil"
        />
        <BreadcrumbSchema
          items={[
            { name: 'Home', item: 'https://www.anhanga.tur.br/' },
            { name: 'Consultoria de Viagem', item: 'https://www.anhanga.tur.br/consultoria-de-viagem/' }
          ]}
        />
        <FAQPageSchema items={FAQ_ITEMS} />

        <LandingNav source="consultoria-viagem" />

        {/* Hero */}
        <section className="pt-16 pb-20 px-6">
          <div className="max-w-3xl mx-auto">
            <m.div
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={0}
              className="inline-flex items-center gap-2 rounded-full border border-anhanga-blue/20 bg-anhanga-blue/5 px-3 py-1 mb-5 text-xs font-black uppercase tracking-widest text-anhanga-blue"
            >
              <Compass className="size-3.5" aria-hidden="true" />
              Consultoria de viagem · São Paulo
            </m.div>
            <m.h1
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={1}
              className="text-balance text-4xl md:text-6xl font-black text-anhanga-dark mb-6 leading-[1.1]"
            >
              Planeje uma viagem sob medida sem depender de pacote pronto
            </m.h1>
            <m.p
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={2}
              className="text-xl text-zinc-600 mb-10 leading-relaxed max-w-2xl"
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
              <p className="mt-4 text-sm text-zinc-600">Sem taxa de consultoria. Gratuito.</p>
            </m.div>
          </div>
        </section>

        {/* Por que consultoria? */}
        <section className="py-20 bg-white">
          <div className="max-w-5xl mx-auto px-6">
            {/*
              margin '200px' abaixo do viewport (mesma convenção em todas as
              seções seguintes): dispara a revelação antes da seção entrar na
              tela, não quando já está visível. Sem isso, rolagem rápida
              mostrava conteúdo semitransparente mesmo já dentro do viewport
              — lia como página quebrada. Ver critique de /consultoria-de-viagem.
            */}
            <m.div
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
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
                  viewport={{ once: true, amount: 0.2 }}
                  custom={idx + 1}
                  className={`p-8 rounded-2xl transition duration-300 ${
                    variant === 'filled'
                      ? 'bg-anhanga-blue text-white'
                      : 'bg-anhanga-light shadow-float hover:shadow-float-lg'
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

        {/* Para quem é */}
        <section className="py-20 bg-anhanga-light">
          <div className="max-w-5xl mx-auto px-6">
            <div className="md:grid md:grid-cols-2 md:gap-16 items-start">
              <m.div
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.2 }}
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
                viewport={{ once: true, amount: 0.2 }}
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

        {/* Como funciona */}
        <section className="py-20 bg-white">
          <div className="max-w-5xl mx-auto px-6">
            <m.h2
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
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
                  viewport={{ once: true, amount: 0.3 }}
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

        {/* Sobre a Anhangá */}
        <section className="py-20 bg-anhanga-light">
          <m.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            custom={0}
            className="max-w-4xl mx-auto px-6 text-center"
          >
            <h2 className="text-3xl md:text-4xl font-black text-anhanga-dark mb-6">
              Sobre a Anhangá Viagens
            </h2>
            <p className="text-lg text-zinc-600 leading-relaxed max-w-2xl mx-auto">
              Agência de viagens em São Paulo, especializada em viagens personalizadas desde 2018. Atendimento humano, nota 5.0 no Google e consultor fixo do início ao fim da sua viagem.
            </p>
            <div className="mt-10 flex flex-wrap justify-center gap-3">
              {CREDENTIALS.map(item => (
                <span
                  key={item}
                  className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-bold text-anhanga-dark shadow-float"
                >
                  <CheckCircle className="size-4 text-anhanga-blue" aria-hidden="true" />
                  {item}
                </span>
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
            viewport={{ once: true, amount: 0.3 }}
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

        {/* Outros serviços */}
        <section className="py-16 bg-anhanga-light">
          <div className="max-w-5xl mx-auto px-6">
            <h2 className="text-2xl font-black text-anhanga-dark mb-8">Outros serviços</h2>
            <div className="grid md:grid-cols-3 gap-4">
              <Link
                to="/corporativo/"
                className="block p-5 rounded-xl bg-white hover:bg-anhanga-blue/5 transition-colors group"
              >
                <div className="font-bold text-anhanga-dark group-hover:text-anhanga-blue transition-colors">
                  Viagens para Executivos
                </div>
                <div className="text-sm text-zinc-600 mt-1">
                  Planejamento com precisão para profissionais
                </div>
              </Link>
              <Link
                to="/curadoria-cruzeiros-brasil/"
                className="block p-5 rounded-xl bg-white hover:bg-anhanga-blue/5 transition-colors group"
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
                className="block p-5 rounded-xl bg-white hover:bg-anhanga-blue/5 transition-colors group"
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
          title="Dúvidas sobre consultoria de viagem"
          subtitle="Tire suas dúvidas sobre como funciona a consultoria personalizada da Anhangá."
        />

        <LandingFooter />
      </div>
      </MotionConfig>
    </>
  );
};

export default ConsultoriaDeViagemLanding;

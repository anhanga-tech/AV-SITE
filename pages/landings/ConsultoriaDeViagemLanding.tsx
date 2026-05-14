import React from 'react';
import { Link } from 'react-router-dom';
import { SEO } from '@/components/SEO';
import { LandingFAQ } from '@/components/LandingFAQ';
import { BreadcrumbSchema } from '@/components/schemas/BreadcrumbSchema';
import { FAQPageSchema } from '@/components/schemas/FAQPageSchema';
import { ServiceSchema } from '@/components/schemas/ServiceSchema';
import { openContactModal } from '@/utils/contactForm';
import { ArrowLeft, ArrowRight, CheckCircle, MessageSquare, Users, Headphones } from 'lucide-react';

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

const ConsultoriaDeViagemLanding: React.FC = () => {
  return (
    <div className="bg-[#fffdf5] min-h-screen font-sans">
      <SEO
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
        keywords={['consultoria de viagem', 'viagem sob medida', 'planejamento de viagem personalizado', 'consultoria de viagem SP']}
      />
      <BreadcrumbSchema
        items={[
          { name: 'Home', item: 'https://www.anhanga.tur.br/' },
          { name: 'Consultoria de Viagem', item: 'https://www.anhanga.tur.br/consultoria-de-viagem/' }
        ]}
      />
      <FAQPageSchema items={FAQ_ITEMS} />

      {/* Mini Header */}
      <header className="bg-white/90 backdrop-blur-sm border-b border-zinc-100 sticky top-0 z-50 py-3">
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
            onClick={() => openContactModal({ source: 'consultoria-viagem' })}
            className="btn-whatsapp btn-specialist text-xs font-bold bg-anhanga-blue text-white px-4 py-2 rounded-xl hover:bg-anhanga-darkBlue transition-colors whitespace-nowrap"
            data-tracking="header-consultoria-viagem"
          >
            Falar com consultor
          </button>
        </div>
      </header>

      {/* Hero */}
      <section className="pt-16 pb-20 px-6">
        <div className="max-w-3xl mx-auto">
          <p className="text-sm font-semibold text-anhanga-blue mb-4 tracking-wide uppercase">
            Consultoria de viagem · São Paulo
          </p>
          <h1 className="text-4xl md:text-6xl font-black text-anhanga-dark mb-6 leading-[1.1] font-serif">
            Planeje uma viagem sob medida sem depender de pacote pronto
          </h1>
          <p className="text-xl text-zinc-600 mb-10 leading-relaxed max-w-2xl">
            Um consultor da Anhangá entende seu perfil, destino, orçamento e restrições para desenhar o melhor caminho antes de você fechar.
          </p>
          <button
            type="button"
            onClick={() => openContactModal({ source: 'consultoria-viagem' })}
            className="btn-whatsapp btn-specialist inline-flex items-center gap-3 bg-anhanga-blue text-white font-bold px-8 py-4 rounded-2xl hover:bg-anhanga-darkBlue transition-colors text-lg shadow-lg"
            aria-label="Falar com um consultor de viagens"
            data-tracking="hero-consultoria-viagem"
          >
            Falar com um consultor
            <ArrowRight className="size-5" />
          </button>
          <p className="mt-4 text-sm text-zinc-600">Sem taxa de consultoria. Gratuito.</p>
        </div>
      </section>

      {/* Por que consultoria? */}
      <section className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-black text-anhanga-dark mb-3 font-serif">
            Por que consultoria?
          </h2>
          <p className="text-zinc-600 text-lg mb-12">
            Porque viajar bem não é só escolher um destino.
          </p>
          <div className="grid md:grid-cols-3 gap-6">
            {PILLARS.map(({ icon: Icon, title, desc, variant }) => (
              <div
                key={title}
                className={`p-8 rounded-2xl ${
                  variant === 'filled'
                    ? 'bg-anhanga-blue text-white'
                    : 'bg-[#fffdf5]'
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
      <section className="py-20 bg-[#fffdf5]">
        <div className="max-w-5xl mx-auto px-6">
          <div className="md:grid md:grid-cols-2 md:gap-16 items-start">
            <div>
              <h2 className="text-3xl md:text-4xl font-black text-anhanga-dark mb-8 font-serif">
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
            </div>
            <div className="mt-12 md:mt-0 bg-white rounded-3xl p-8 shadow-float">
              <blockquote className="text-xl text-anhanga-dark font-semibold leading-relaxed">
                "A Anhangá cuidou de cada detalhe. Só precisei aparecer no aeroporto."
              </blockquote>
              <p className="mt-4 text-zinc-600 text-sm">
                R.M. · São Paulo · Viagem para Portugal, 2025
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Como funciona */}
      <section className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-black text-anhanga-dark mb-12 font-serif">
            Como funciona
          </h2>
          <div className="space-y-0">
            {HOW_IT_WORKS.map(({ step, title, desc }, idx) => (
              <div
                key={step}
                className={`flex gap-6 py-8 ${idx < HOW_IT_WORKS.length - 1 ? 'border-b border-zinc-100' : ''}`}
              >
                <div className="flex-shrink-0 size-12 rounded-full bg-anhanga-blue/10 flex items-center justify-center">
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
      <section className="py-20 bg-[#fffdf5]">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-black text-anhanga-dark mb-6 font-serif">
            Sobre a Anhangá Viagens
          </h2>
          <p className="text-lg text-zinc-600 leading-relaxed max-w-2xl mx-auto">
            Agência de viagens em São Paulo, especializada em viagens personalizadas desde 2018. Atendimento humano, nota 5.0 no Google e consultor fixo do início ao fim da sua viagem.
          </p>
          <div className="mt-12 flex flex-wrap justify-center gap-12">
            {[
              { label: 'Fundada em', value: '2018' },
              { label: 'Nota Google', value: '5.0' },
              { label: 'Atendimento', value: 'Humano' },
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
            Pronto para planejar sua viagem?
          </h2>
          <p className="text-blue-100 text-lg mb-10 max-w-xl mx-auto">
            Fale com um consultor agora. Sem taxa, sem compromisso.
          </p>
          <button
            type="button"
            onClick={() => openContactModal({ source: 'consultoria-viagem' })}
            className="btn-whatsapp btn-specialist inline-flex items-center gap-3 bg-anhanga-yellow text-anhanga-dark font-black px-10 py-5 rounded-2xl hover:bg-anhanga-yellowHover transition-colors text-xl shadow-lg"
            aria-label="Falar com um consultor"
            data-tracking="footer-consultoria-viagem"
          >
            Falar com um consultor
            <ArrowRight className="size-6" />
          </button>
        </div>
      </section>

      {/* Outros serviços */}
      <section className="py-16 bg-[#fffdf5]">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-2xl font-black text-anhanga-dark mb-8">Outros serviços</h2>
          <div className="grid md:grid-cols-3 gap-4">
            <Link
              to="/viagens-para-executivos"
              className="block p-5 rounded-xl bg-[#fffdf5] hover:bg-anhanga-blue/5 transition-colors group"
            >
              <div className="font-bold text-anhanga-dark group-hover:text-anhanga-blue transition-colors">
                Viagens para Executivos
              </div>
              <div className="text-sm text-zinc-600 mt-1">
                Planejamento com precisão para profissionais
              </div>
            </Link>
            <Link
              to="/curadoria-cruzeiros-brasil"
              className="block p-5 rounded-xl bg-[#fffdf5] hover:bg-anhanga-blue/5 transition-colors group"
            >
              <div className="font-bold text-anhanga-dark group-hover:text-anhanga-blue transition-colors">
                Curadoria de Cruzeiros
              </div>
              <div className="text-sm text-zinc-600 mt-1">
                Escolha o navio e a cabine certos para você
              </div>
            </Link>
            <a
              href="https://www.anhanga.tur.br/"
              className="block p-5 rounded-xl bg-[#fffdf5] hover:bg-anhanga-blue/5 transition-colors group"
            >
              <div className="font-bold text-anhanga-dark group-hover:text-anhanga-blue transition-colors">
                Site principal
              </div>
              <div className="text-sm text-zinc-600 mt-1">
                Conheça todos os serviços da Anhangá
              </div>
            </a>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <LandingFAQ
        items={FAQ_ITEMS}
        title="Dúvidas sobre consultoria de viagem"
        subtitle="Tire suas dúvidas sobre como funciona a consultoria personalizada da Anhangá."
      />

      {/* Footer */}
      <footer className="py-8 bg-[#fffdf5] border-t border-zinc-100 text-center text-sm text-zinc-600">
        <p>Anhangá Viagens · Agência de viagens em São Paulo</p>
        <p className="mt-1">Atualizado em abril de 2026</p>
      </footer>
    </div>
  );
};

export default ConsultoriaDeViagemLanding;

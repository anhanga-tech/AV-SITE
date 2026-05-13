import React from 'react';
import { Link } from 'react-router-dom';
import { SEO } from '@/components/SEO';
import { LandingFAQ } from '@/components/LandingFAQ';
import { BreadcrumbSchema } from '@/components/schemas/BreadcrumbSchema';
import { FAQPageSchema } from '@/components/schemas/FAQPageSchema';
import { ServiceSchema } from '@/components/schemas/ServiceSchema';
import { openContactModal } from '@/utils/contactForm';
import ArrowLeft from 'lucide-react/dist/esm/icons/arrow-left';
import ArrowRight from 'lucide-react/dist/esm/icons/arrow-right';
import Search from 'lucide-react/dist/esm/icons/search';
import LayoutList from 'lucide-react/dist/esm/icons/layout-list';
import PhoneCall from 'lucide-react/dist/esm/icons/phone-call';

const FAQ_ITEMS = [
  {
    question: 'Vocês atendem viagens de última hora?',
    answer: 'Sim, dentro do possível. Quanto mais cedo o contato, mais opções de voos, hotéis e preços melhores. Mas não deixe de entrar em contato mesmo com prazo curto.'
  },
  {
    question: 'Posso ter um consultor fixo?',
    answer: 'Sim. O mesmo profissional acompanha sua viagem do início ao fim — da conversa inicial ao suporte durante o embarque.'
  },
  {
    question: 'Fazem viagens corporativas?',
    answer: 'No momento focamos em viagens pessoais e familiares premium. Se você busca uma experiência de alto padrão para sua família ou para si mesmo, estamos prontos para ajudar.'
  },
  {
    question: 'Têm experiência com destinos de luxo?',
    answer: 'Sim. A Anhangá planeja viagens para Europa, Caribe, Japão, Maldivas e outros destinos premium, com curadoria de hotéis, transfers e experiências exclusivas.'
  },
  {
    question: 'Como é o suporte durante a viagem?',
    answer: 'WhatsApp 24h com o mesmo consultor que planejou sua viagem. Qualquer imprevisto — hotel, voo, roteiro — você tem um humano para resolver.'
  }
];

const FOR_WHO_PROFILES = [
  'Médicos e profissionais de saúde',
  'Advogados e sócios de escritórios',
  'Executivos e gestores de alta liderança',
  'Empresários e sócios-fundadores',
  'Famílias que valorizam tempo e conforto',
  'Profissionais com agenda imprevisível',
];

const WHAT_WE_RESOLVE = [
  {
    icon: Search,
    title: 'Pesquisa e comparação',
    desc: 'Você não precisa comparar voos, hotéis e transfers. Fazemos isso por você e entregamos a melhor opção para o seu perfil e orçamento.',
  },
  {
    icon: LayoutList,
    title: 'Logística completa',
    desc: 'Voos, traslados, hotéis, passeios e seguros organizados em um roteiro claro. Cada ponto de conexão verificado antes de você embarcar.',
    variant: 'filled' as const,
  },
  {
    icon: PhoneCall,
    title: 'Suporte durante a viagem',
    desc: 'Se algo muda — voo cancelado, hotel com problema, roteiro que precisa ajustar — você tem um consultor humano disponível para resolver.',
  },
];

const HOW_IT_WORKS = [
  {
    step: '01',
    title: 'Conversa inicial',
    desc: 'Você fala com um consultor, conta o que precisa e define prioridades. Nenhum formulário, nenhuma espera.'
  },
  {
    step: '02',
    title: 'Roteiro e reservas',
    desc: 'Em até 5 dias úteis, o consultor entrega o roteiro completo e cuida de todas as reservas.'
  },
  {
    step: '03',
    title: 'Suporte 24h durante a viagem',
    desc: 'WhatsApp direto com quem planejou. Qualquer imprevisto resolvido sem você precisar ligar para uma central.'
  },
];

const ViagensParaExecutivosLanding: React.FC = () => {
  return (
    <div className="bg-white min-h-screen font-sans">
      <SEO
        title="Viagens Para Executivos e Profissionais — Anhangá Viagens"
        description="Planejamento de viagem com precisão para quem não tem tempo a perder. Atendimento consultivo, roteiro sob medida e suporte real."
        canonical="https://www.anhanga.tur.br/viagens-para-executivos/"
        noHreflang
      />
      <ServiceSchema
        name="Viagens Para Executivos e Profissionais"
        description="Planejamento de viagens premium para profissionais e famílias que valorizam tempo, conforto e zero margem de erro."
        serviceUrl="https://www.anhanga.tur.br/viagens-para-executivos/"
        serviceType="Planejamento de Viagem Premium"
        areaServed="São Paulo e Brasil"
        keywords={['viagens para executivos', 'agência de viagens confiável SP', 'consultor de viagem', 'planejamento de viagem internacional']}
      />
      <BreadcrumbSchema
        items={[
          { name: 'Home', item: 'https://www.anhanga.tur.br/' },
          { name: 'Viagens para Executivos', item: 'https://www.anhanga.tur.br/viagens-para-executivos/' }
        ]}
      />
      <FAQPageSchema items={FAQ_ITEMS} />

      {/* Mini Header */}
      <header className="bg-white/90 backdrop-blur-sm border-b border-gray-100 sticky top-0 z-50 py-3">
        <div className="max-w-5xl mx-auto px-6 flex items-center justify-between">
          <Link
            to="/"
            className="inline-flex items-center gap-2 group"
            aria-label="Voltar para o site principal da Anhangá Viagens"
          >
            <ArrowLeft className="w-4 h-4 text-gray-400 group-hover:text-anhanga-blue transition-colors" />
            <span className="w-7 h-7 bg-anhanga-blue/10 rounded-lg flex items-center justify-center flex-shrink-0">
              <img src="/favicon.svg" alt="" aria-hidden="true" className="w-4 h-4" />
            </span>
            <span className="text-sm font-bold text-anhanga-dark group-hover:text-anhanga-blue transition-colors">
              Anhangá Viagens
            </span>
          </Link>
          <button
            type="button"
            onClick={() => openContactModal({ source: 'viagens-executivos' })}
            className="btn-whatsapp btn-specialist text-xs font-bold bg-anhanga-blue text-white px-4 py-2 rounded-xl hover:bg-anhanga-darkBlue transition-colors whitespace-nowrap"
          >
            Falar com consultor
          </button>
        </div>
      </header>

      {/* Hero */}
      <section className="pt-16 pb-20 px-6 bg-anhanga-dark">
        <div className="max-w-3xl mx-auto">
          <p className="text-sm font-semibold text-anhanga-yellow mb-8 tracking-widest uppercase">
            Atendimento consultivo premium
          </p>
          <h1 className="text-4xl md:text-6xl font-black text-white mb-6 leading-[1.1] font-serif">
            Sua viagem planejada com precisão, conforto e atendimento humano
          </h1>
          <p className="text-xl text-gray-300 mb-10 leading-relaxed max-w-2xl">
            Para profissionais e famílias que não querem perder tempo comparando opções nem correr risco com detalhes importantes.
          </p>
          <button
            type="button"
            onClick={() => openContactModal({ source: 'viagens-executivos' })}
            className="btn-whatsapp btn-specialist inline-flex items-center gap-3 bg-anhanga-yellow text-anhanga-dark font-bold px-8 py-4 rounded-2xl hover:bg-anhanga-yellowHover transition-colors text-lg shadow-lg"
            aria-label="Falar com um consultor de viagens"
          >
            Falar com um consultor
            <ArrowRight className="w-5 h-5" />
          </button>
          <p className="mt-4 text-sm text-gray-400">Consultor fixo do início ao fim.</p>
        </div>
      </section>

      {/* Para quem é */}
      <section className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-black text-anhanga-dark mb-4 font-serif">
            Para quem é
          </h2>
          <p className="text-gray-600 text-lg mb-10">
            Profissionais e famílias que valorizam tempo e têm aversão a erro.
          </p>
          <div className="flex flex-wrap gap-3">
            {FOR_WHO_PROFILES.map(profile => (
              <span
                key={profile}
                className="px-4 py-2 rounded-full bg-anhanga-light text-anhanga-dark font-semibold text-sm"
              >
                {profile}
              </span>
            ))}
          </div>
          <p className="mt-8 text-gray-600 max-w-2xl leading-relaxed">
            Se você tem uma viagem importante para planejar e não quer perder tempo com pesquisa, comparação e burocracia, a Anhangá cuida de tudo enquanto você se concentra no que importa.
          </p>
        </div>
      </section>

      {/* O que a gente resolve */}
      <section className="py-20 bg-[#fffdf5]">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-black text-anhanga-dark mb-12 font-serif">
            O que a gente resolve
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {WHAT_WE_RESOLVE.map(({ icon: Icon, title, desc, variant }) => (
              <div
                key={title}
                className={`p-8 rounded-2xl ${variant === 'filled' ? 'bg-anhanga-dark text-white' : 'bg-white'}`}
              >
                <div
                  className={`w-11 h-11 rounded-xl flex items-center justify-center mb-5 ${
                    variant === 'filled' ? 'bg-anhanga-yellow/20' : 'bg-anhanga-blue/10'
                  }`}
                >
                  <Icon
                    className={`w-5 h-5 ${variant === 'filled' ? 'text-anhanga-yellow' : 'text-anhanga-blue'}`}
                  />
                </div>
                <h3 className={`text-xl font-black mb-3 ${variant === 'filled' ? 'text-white' : 'text-anhanga-dark'}`}>
                  {title}
                </h3>
                <p className={variant === 'filled' ? 'text-gray-400 leading-relaxed' : 'text-gray-600 leading-relaxed'}>
                  {desc}
                </p>
              </div>
            ))}
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
                className={`flex gap-8 py-8 ${idx < HOW_IT_WORKS.length - 1 ? 'border-b border-gray-100' : ''}`}
              >
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-anhanga-blue/10 flex items-center justify-center">
                  <span className="text-sm font-black text-anhanga-blue">{step}</span>
                </div>
                <div>
                  <h3 className="text-xl font-black text-anhanga-dark mb-2">{title}</h3>
                  <p className="text-gray-600 leading-relaxed max-w-xl">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Sobre a Anhangá */}
      <section className="py-20 bg-[#fffdf5]">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-black text-anhanga-dark mb-6 font-serif">
            Sobre a Anhangá Viagens
          </h2>
          <p className="text-lg text-gray-600 leading-relaxed max-w-2xl mb-10">
            Agência de viagens em São Paulo desde 2018, especializada em viagens sob medida. Consultor fixo do início ao fim, nota 5.0 no Google, atendimento sem robôs e sem formulários.
          </p>
          <div className="flex flex-wrap gap-12">
            {[
              { label: 'Fundada em', value: '2018' },
              { label: 'Nota Google', value: '5.0' },
              { label: 'Consultor fixo', value: 'Do início ao fim' },
            ].map(({ label, value }) => (
              <div key={label}>
                <div className="text-3xl font-black text-anhanga-dark">{value}</div>
                <div className="text-sm text-gray-600 mt-1">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-20 bg-anhanga-blue">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-5xl font-black text-white mb-6 font-serif">
            Você merece uma viagem sem erro.
          </h2>
          <p className="text-blue-100 text-lg mb-10 max-w-xl mx-auto">
            Um consultor disponível para cuidar de cada detalhe. Sem chatbot, sem formulário, sem burocracia.
          </p>
          <button
            type="button"
            onClick={() => openContactModal({ source: 'viagens-executivos' })}
            className="btn-whatsapp btn-specialist inline-flex items-center gap-3 bg-white text-anhanga-blue font-black px-10 py-5 rounded-2xl hover:bg-anhanga-light transition-colors text-xl shadow-lg"
            aria-label="Falar com um consultor de viagens"
          >
            Falar com um consultor
            <ArrowRight className="w-6 h-6" />
          </button>
        </div>
      </section>

      {/* Outros serviços */}
      <section className="py-16 bg-[#fffdf5]">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-2xl font-black text-anhanga-dark mb-8">Outros serviços</h2>
          <div className="grid md:grid-cols-3 gap-4">
            <Link
              to="/consultoria-de-viagem"
              className="block p-5 rounded-xl bg-white hover:bg-anhanga-blue/5 transition-colors group"
            >
              <div className="font-bold text-anhanga-dark group-hover:text-anhanga-blue transition-colors">
                Consultoria de Viagem
              </div>
              <div className="text-sm text-gray-600 mt-1">
                Roteiro sob medida com consultor humano
              </div>
            </Link>
            <Link
              to="/curadoria-cruzeiros-brasil"
              className="block p-5 rounded-xl bg-white hover:bg-anhanga-blue/5 transition-colors group"
            >
              <div className="font-bold text-anhanga-dark group-hover:text-anhanga-blue transition-colors">
                Curadoria de Cruzeiros
              </div>
              <div className="text-sm text-gray-600 mt-1">
                Escolha o navio e a cabine certos para você
              </div>
            </Link>
            <a
              href="https://www.anhanga.tur.br/"
              className="block p-5 rounded-xl bg-white hover:bg-anhanga-blue/5 transition-colors group"
            >
              <div className="font-bold text-anhanga-dark group-hover:text-anhanga-blue transition-colors">
                Site principal
              </div>
              <div className="text-sm text-gray-600 mt-1">
                Conheça todos os serviços da Anhangá
              </div>
            </a>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <LandingFAQ
        items={FAQ_ITEMS}
        title="Dúvidas sobre viagens para executivos"
        subtitle="Tire suas dúvidas sobre o planejamento consultivo da Anhangá."
      />

      {/* Footer */}
      <footer className="py-8 bg-[#fffdf5] border-t border-gray-100 text-center text-sm text-gray-600">
        <p>Anhangá Viagens · Agência de viagens em São Paulo</p>
        <p className="mt-1">Atualizado em abril de 2026</p>
      </footer>
    </div>
  );
};

export default ViagensParaExecutivosLanding;

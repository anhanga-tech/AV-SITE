import React from 'react';
import { Link } from 'react-router-dom';
import { SEO } from '../../components/SEO';
import { LandingFAQ } from '../../components/LandingFAQ';
import { BreadcrumbSchema } from '../../components/schemas/BreadcrumbSchema';
import { FAQPageSchema } from '../../components/schemas/FAQPageSchema';
import { ServiceSchema } from '../../components/schemas/ServiceSchema';
import { openContactModal } from '../../utils/contactForm';
import { m } from 'framer-motion';
import { ShieldCheck, Heart, Sparkles, Coffee } from 'lucide-react';

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

const MelhorIdadeLanding: React.FC = () => {
  return (
    <div className="bg-[#fffdf5] min-h-screen font-sans">
      <SEO
        title="Turismo 50+: Viagens Seguras e Personalizadas"
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
        keywords={['viagens 50+', 'turismo melhor idade', 'viagens seguras']}
      />
      <BreadcrumbSchema
        items={[
          { name: 'Home', item: 'https://www.anhanga.tur.br/' },
          { name: 'Melhor Idade', item: 'https://www.anhanga.tur.br/melhor-idade/' }
        ]}
      />
      <FAQPageSchema items={MELHOR_IDADE_FAQ_ITEMS} />

      {/* MINI HEADER */}
      <div className="bg-white/80 backdrop-blur-md py-4 border-b border-gray-100 sticky top-0 z-[60]">
        <div className="container mx-auto px-6 flex justify-between items-center">
          <Link to="/" className="text-sm font-bold text-brand-dark hover:text-brand-cyan transition-colors flex items-center gap-2">
            <span className="w-8 h-8 bg-brand-cyan/10 rounded-lg flex items-center justify-center">
              <img src="/favicon.svg" alt="Anhangá" className="w-5 h-5" />
            </span>
            Anhangá Viagens
          </Link>
          <button 
            onClick={() => openContactModal({ source: 'melhor-idade' })}
            className="btn-whatsapp btn-specialist text-xs font-black uppercase tracking-widest bg-brand-dark text-white px-4 py-2 rounded-full hover:bg-brand-cyan transition-colors focus:outline-dashed focus:outline-2 focus:outline-offset-2 focus:outline-brand-cyan"
            data-tracking="header-melhor-idade"
          >
            Falar com Especialista
          </button>
        </div>
      </div>

      {/* HERO SECTION */}
      <section className="relative pt-20 pb-32 overflow-hidden">
        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-3xl">
            <m.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 bg-brand-cyan/10 text-brand-cyan px-4 py-1 rounded-full text-sm font-bold mb-6"
            >
              <Heart className="w-4 h-4 fill-current" /> Viagens com Propósito
            </m.div>
            <m.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-5xl md:text-7xl font-black text-brand-dark mb-8 leading-[1.1]"
            >
              O mundo no seu ritmo, <br />
              <span className="text-anhanga-blue">
                com o cuidado que você merece.
              </span>
            </m.h1>
            <m.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-xl text-gray-600 mb-10 leading-relaxed font-medium"
            >
              Na Anhangá, acreditamos que a "melhor idade" é a época perfeita para novas descobertas. Criamos roteiros 100% personalizados para quem não abre mão de conforto, segurança e boas histórias.
            </m.p>
            <m.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-wrap gap-4"
            >
              <button
                onClick={() => openContactModal({ source: 'melhor-idade' })}
                className="btn-whatsapp btn-specialist bg-brand-vibrant text-white px-8 py-4 rounded-2xl font-black text-lg shadow-xl shadow-brand-vibrant/20 hover:scale-105 transition-transform flex items-center gap-3 focus:outline-dashed focus:outline-2 focus:outline-offset-2 focus:outline-brand-vibrant"
                data-tracking="hero-melhor-idade"
              >
                Solicitar Orçamento
                <Sparkles className="w-5 h-5" />
              </button>
            </m.div>
          </div>
        </div>
        
        {/* Background Decals */}
        <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-brand-cyan/5 to-transparent pointer-events-none"></div>
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-brand-yellow/10 rounded-full blur-[100px] pointer-events-none"></div>
      </section>

      {/* PILARES SECTION */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-12">
            <div className="space-y-4">
              <div className="w-16 h-16 bg-brand-cyan/10 rounded-2xl flex items-center justify-center text-brand-cyan mb-6">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-semibold text-brand-dark">Segurança em 1º lugar</h3>
              <p className="text-gray-500 font-medium leading-relaxed">
                Hotéis com acessibilidade, seguro-viagem premium e suporte 24h para você viajar com tranquilidade total.
              </p>
            </div>
            <div className="space-y-4">
              <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center text-orange-600 mb-6">
                <Coffee className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-semibold text-brand-dark">Ritmo Desacelerado</h3>
              <p className="text-gray-500 font-medium leading-relaxed">
                Nada de correrias. Roteiros desenhados para respeitar o seu tempo, com pausas estratégicas e menos deslocamentos.
              </p>
            </div>
            <div className="space-y-4">
              <div className="w-16 h-16 bg-brand-vibrant/10 rounded-2xl flex items-center justify-center text-brand-vibrant mb-6">
                <Sparkles className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-semibold text-brand-dark">Curadoria Personalizada</h3>
              <p className="text-gray-500 font-medium leading-relaxed">
                Experiências gastronômicas, culturais e de lazer selecionadas a dedo para viajantes exigentes e experientes.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CONTENT RICH SECTION FOR GEO */}
      <section className="py-24 bg-[#fffdf5]">
        <div className="container mx-auto px-6 max-w-4xl">
          <h2 className="text-3xl md:text-5xl font-semibold text-brand-dark mb-12 text-center">Por que planejar sua viagem 50+ com a Anhangá?</h2>
          
          <div className="prose prose-lg prose-brand max-w-none text-gray-700 font-medium leading-[1.8]">
            <p>
              Viajar na maturidade exige um olhar diferente. Não se trata apenas de escolher um destino, mas de garantir que cada etapa da jornada seja fluida e prazerosa. Na <strong>Anhangá Viagens</strong>, somos especialistas em transformar o planejamento em um processo leve e transparente.
            </p>
            
            <h3 className="text-2xl font-semibold text-brand-dark mt-12 mb-6">Infraestrutura e Acessibilidade</h3>
            <p>
              Selecionamos hotéis que oferecem não apenas luxo, mas <strong>acessibilidade real</strong>. Elevadores, poucas escadas, banheiros adaptados e localização central para evitar longas caminhadas desnecessárias. Nosso foco é sua autonomia e bem-estar.
            </p>

            <h3 className="text-2xl font-semibold text-brand-dark mt-12 mb-6">Atendimento Consultivo e Humano</h3>
            <p>
              Ao contrário das grandes agências de massa, aqui você fala com pessoas que entendem suas necessidades. Ajustamos o roteiro conforme seu condicionamento físico e interesses, seja visitando museus na Europa ou relaxando em um resort no Nordeste.
            </p>

            <blockquote className="shadow-[inset_3px_0_0_#0ea5e9] pl-6 my-12 italic text-brand-dark font-bold text-xl">
              "A verdadeira viagem de luxo para a melhor idade é aquela onde a única preocupação do viajante é decidir qual será a próxima memória inesquecível."
            </blockquote>

            <p>
              Nosso diferencial é o <strong>Turismo de Transformação</strong>. Acreditamos que aos 50, 60 ou 70 anos, você tem a bagagem perfeita para apreciar detalhes que passariam despercebidos. Por isso, sugerimos experiências que conectam você com a alma do lugar, seja um workshop de cerâmica em Portugal ou uma degustação privada em uma vinícola italiana.
            </p>
          </div>
        </div>
      </section>

      {/* FAQ SECTION */}
      <LandingFAQ items={MELHOR_IDADE_FAQ_ITEMS} />

      {/* FINAL CTA */}
      <section className="py-24 container mx-auto px-6 text-center">
        <div className="bg-brand-dark text-white rounded-[3rem] p-12 md:p-24 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-brand-cyan/20 blur-[100px] rounded-full"></div>
          <h2 className="text-4xl md:text-6xl font-semibold mb-8 relative z-10">Sua próxima aventura <br className="hidden md:block" /> começa agora.</h2>
          <p className="text-xl text-gray-300 mb-12 max-w-2xl mx-auto relative z-10">
            Fale conosco hoje mesmo e receba uma proposta exclusiva para sua viagem. Segurança, conforto e exclusividade em um só lugar.
          </p>
          <button
            onClick={() => openContactModal({ source: 'melhor-idade' })}
            className="btn-whatsapp btn-specialist bg-brand-cyan text-white px-10 py-5 rounded-2xl font-black text-xl shadow-2xl shadow-brand-cyan/20 hover:scale-105 transition-transform relative z-10 focus:outline-dashed focus:outline-2 focus:outline-offset-2 focus:outline-white"
            data-tracking="footer-melhor-idade"
          >
            Falar com um Consultor
          </button>
        </div>
      </section>
    </div>
  );
};

export default MelhorIdadeLanding;

import React, { useEffect } from 'react';
import { SEO } from '../components/SEO';
import { BreadcrumbSchema } from '../components/schemas/BreadcrumbSchema';
import { OrganizationSchema } from '../components/schemas/OrganizationSchema';
import { optimizeRemoteImageUrl } from '../data/mediaConfig';
import CheckCircle from 'lucide-react/dist/esm/icons/check-circle';
import Users from 'lucide-react/dist/esm/icons/users';
import Calendar from 'lucide-react/dist/esm/icons/calendar';
import Award from 'lucide-react/dist/esm/icons/award';
import ShieldCheck from 'lucide-react/dist/esm/icons/shield-check';
import ArrowRight from 'lucide-react/dist/esm/icons/arrow-right';

const About: React.FC = () => {
  useEffect(() => {
    if (window.location.hash) {
      const id = window.location.hash.substring(1);
      const element = document.getElementById(id);
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth' });
        }, 100);
        return;
      }
    }
    window.scrollTo(0, 0);
  }, []);

  const stats = [
    { label: 'Clientes Atendidos', value: '2.500+', icon: Users, color: 'text-blue-600' },
    { label: 'Anos de Mercado', value: '8+', icon: Calendar, color: 'text-emerald-600' },
    { label: 'Roteiros Únicos', value: '450+', icon: Award, color: 'text-brand-yellow' },
    { label: 'Satisfação', value: '4.9/5', icon: ShieldCheck, color: 'text-brand-vibrant' },
  ];

  const expertises = [
    {
      title: 'Disney & Orlando',
      description: 'Especialistas certificados em Walt Disney World Resort e Universal Orlando Resort.',
      image: 'https://images.unsplash.com/photo-1597466765990-64ad1c35dafc?q=80&w=800&auto=format&fit=crop'
    },
    {
      title: 'Festivais & Eventos',
      description: 'Logística completa para Lollapalooza, Rock in Rio e grandes festivais internacionais.',
      image: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?q=80&w=800&auto=format&fit=crop'
    },
    {
      title: 'Viagens 50+',
      description: 'Roteiros desenhados para o público maduro, com foco em conforto e experiências culturais.',
      image: 'https://images.unsplash.com/photo-1507034589631-9433cc6bc453?q=80&w=800&auto=format&fit=crop'
    }
  ];

  return (
    <div className="bg-white">
      <SEO
        title="Sobre a Anhangá Viagens | Nossa História e Expertise"
        description="Conheça a Anhangá Viagens, agência boutique em São Paulo especializada em roteiros personalizados, Disney, festivais e turismo para o público 50+."
        canonical="https://www.anhanga.tur.br/sobre/"
      />
      <BreadcrumbSchema items={[
        { name: 'Home', item: 'https://www.anhanga.tur.br/' },
        { name: 'Sobre', item: 'https://www.anhanga.tur.br/sobre/' }
      ]} />
      <OrganizationSchema />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden bg-brand-dark">
        <div className="absolute inset-0 opacity-20">
          <img
            src="https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=2000&auto=format&fit=crop"
            alt="Background"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-brand-dark via-transparent to-brand-dark"></div>
        </div>

        <div className="container mx-auto px-6 relative z-10 text-center">
          <span className="inline-block px-4 py-2 rounded-full bg-brand-cyan/20 border border-brand-cyan/30 text-brand-cyan text-xs font-black uppercase tracking-widest mb-6 animate-fade-in">
            Quem Somos
          </span>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-white mb-8 leading-tight tracking-tight max-w-4xl mx-auto">
            Planejamos viagens com <span className="text-brand-yellow">alma</span> e design.
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed font-medium">
            A Anhangá Viagens nasceu para transformar o conceito de "turismo" em experiências de vida inesquecíveis, com atendimento consultivo e curadoria de excelência.
          </p>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-white relative z-20 -mt-10">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 bg-white rounded-3xl shadow-2xl p-8 md:p-12 border border-gray-100">
            {stats.map((stat, index) => (
              <div key={index} className="text-center group">
                <div className={`w-12 h-12 ${stat.color} bg-opacity-10 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300`}>
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
                <div className="text-2xl md:text-3xl font-black text-brand-dark mb-1">{stat.value}</div>
                <div className="text-sm font-bold text-gray-500 uppercase tracking-wider">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Our History */}
      <section className="py-24" id="nossa-historia">
        <div className="container mx-auto px-6">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            <div className="lg:w-1/2">
              <div className="relative">
                <div className="absolute -top-10 -left-10 w-40 h-40 bg-brand-yellow/10 rounded-full blur-3xl -z-10"></div>
                <img
                  src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=1200&auto=format&fit=crop"
                  alt="Nossa Equipe"
                  className="rounded-[3rem] shadow-2xl border-8 border-white"
                />
                <div className="absolute -bottom-6 -right-6 bg-brand-vibrant p-8 rounded-3xl shadow-xl hidden md:block">
                  <p className="text-white font-black text-xl italic leading-tight">
                    "Viajar é a única coisa <br />que você compra e <br />te deixa mais rico."
                  </p>
                </div>
              </div>
            </div>
            <div className="lg:w-1/2">
              <h2 className="text-3xl md:text-5xl font-black text-brand-dark mb-8 leading-tight">
                Fundada em 2017 com uma missão clara.
              </h2>
              <div className="space-y-6 text-gray-600 text-lg leading-relaxed font-serif">
                <p>
                  A Anhangá Viagens surgiu do desejo de simplificar o complexo mundo das viagens. Em um mercado saturado de pacotes genéricos, decidimos focar no que realmente importa: <strong>você</strong>.
                </p>
                <p>
                  Nosso nome, inspirado na força da nossa terra, reflete nosso compromisso com a autenticidade. Somos uma agência boutique sediada em São Paulo, mas com conexões que abraçam o mundo todo.
                </p>
                <p>
                  Acreditamos que cada viajante é único. Por isso, não vendemos apenas passagens ou hotéis; entregamos consultoria estratégica, suporte 24h e a tranquilidade de saber que cada detalhe foi pensado por especialistas que amam o que fazem.
                </p>
              </div>

              <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  'Cadastur 37.036.732/0001-41',
                  'Especialistas Certificados',
                  'Atendimento 100% Humano',
                  'Roteiros Sob Medida'
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
                    <span className="font-bold text-brand-dark">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Expertise */}
      <section className="py-24 bg-brand-light/30">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-black text-brand-dark mb-6">Nossas Especialidades</h2>
            <p className="text-gray-600 max-w-2xl mx-auto text-lg">
              Dominamos destinos e nichos específicos para garantir que sua experiência seja impecável, do planejamento ao retorno.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {expertises.map((item, idx) => (
              <div key={idx} className="bg-white rounded-[2.5rem] overflow-hidden shadow-lg border border-gray-100 group hover:shadow-2xl transition-all duration-500">
                <div className="h-64 overflow-hidden">
                  <img
                    src={optimizeRemoteImageUrl(item.image, 600, 450)}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                </div>
                <div className="p-10">
                  <h3 className="text-2xl font-black text-brand-dark mb-4">{item.title}</h3>
                  <p className="text-gray-600 font-medium leading-relaxed mb-6">
                    {item.description}
                  </p>
                  <button
                    onClick={() => window.dispatchEvent(new CustomEvent('toggle-ai-chat', {
                      detail: { message: `Olá! Quero saber mais sobre viagens de ${item.title}.` }
                    }))}
                    className="flex items-center gap-2 text-brand-vibrant font-black uppercase text-sm tracking-widest hover:gap-4 transition-all"
                  >
                    Saiba mais <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team/Expertise Section - E-E-A-T */}
      <section className="py-24">
        <div className="container mx-auto px-6 text-center">
          <div className="max-w-3xl mx-auto">
            <div className="inline-flex p-3 bg-brand-yellow/10 rounded-2xl mb-8">
              <ShieldCheck className="w-10 h-10 text-brand-yellow" />
            </div>
            <h2 className="text-3xl md:text-5xl font-black text-brand-dark mb-8">Confiança e Credibilidade</h2>
            <p className="text-xl text-gray-600 leading-relaxed font-serif italic mb-12">
              "Na Anhangá, não somos apenas agentes de viagens. Somos consultores de sonhos. Nossa expertise é construída com anos de estrada, visitas técnicas constantes e uma paixão genuína por hospitalidade."
            </p>
            <div className="flex flex-col md:flex-row items-center justify-center gap-8">
              <div className="bg-gray-50 px-8 py-4 rounded-2xl border border-gray-200">
                <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">CNPJ / Cadastur</p>
                <p className="text-brand-dark font-black">37.036.732/0001-41</p>
              </div>
              <div className="bg-gray-50 px-8 py-4 rounded-2xl border border-gray-200">
                <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Localização</p>
                <p className="text-brand-dark font-black">Vila Monumento, São Paulo - SP</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-brand-dark overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-full opacity-10">
            <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                <path d="M0 100 C 20 0 50 0 100 100" fill="none" stroke="white" strokeWidth="0.1" />
                <path d="M0 80 C 30 20 60 20 100 80" fill="none" stroke="white" strokeWidth="0.1" />
            </svg>
        </div>
        <div className="container mx-auto px-6 text-center relative z-10">
          <h2 className="text-3xl md:text-6xl font-black text-white mb-8">Vamos criar memórias?</h2>
          <p className="text-xl text-gray-300 mb-12 max-w-2xl mx-auto">
            Seja qual for o seu próximo destino, nossa equipe está pronta para transformar seus planos em realidade.
          </p>
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('toggle-ai-chat', {
              detail: { message: "Olá! Gostaria de falar com um especialista sobre minha próxima viagem." }
            }))}
            className="btn-whatsapp btn-specialist inline-flex items-center gap-3 bg-brand-yellow text-brand-dark text-lg font-black px-10 py-5 rounded-2xl shadow-[4px_4px_0px_rgba(255,255,255,0.2)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
          >
            Falar com Especialista
          </button>
        </div>
      </section>
    </div>
  );
};

export default About;

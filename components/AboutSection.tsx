import React from 'react';
import { Link } from 'react-router-dom';
import ArrowRight from 'lucide-react/dist/esm/icons/arrow-right';
import ShieldCheck from 'lucide-react/dist/esm/icons/shield-check';
import Award from 'lucide-react/dist/esm/icons/award';
import Users from 'lucide-react/dist/esm/icons/users';

const AboutSection: React.FC = () => {
  return (
    <section className="py-24 bg-white overflow-hidden" id="sobre-nos">
      <div className="container mx-auto px-6">
        <div className="flex flex-col lg:flex-row items-center gap-16">
          <div className="lg:w-1/2 relative">
            <div className="absolute -top-10 -left-10 w-64 h-64 bg-brand-cyan/10 rounded-full blur-3xl"></div>
            <div className="relative z-10 grid grid-cols-2 gap-4">
              <div className="space-y-4">
                <img
                  src="https://images.unsplash.com/photo-1530789253388-582c481c54b0?q=80&w=600&auto=format&fit=crop"
                  alt="Destino Turístico"
                  className="rounded-3xl shadow-lg w-full h-64 object-cover transform hover:scale-105 transition-transform duration-500"
                />
                <div className="bg-brand-vibrant p-6 rounded-3xl text-white shadow-xl">
                  <div className="text-3xl font-black mb-1">8+</div>
                  <div className="text-xs font-bold uppercase tracking-widest opacity-80">Anos de Experiência</div>
                </div>
              </div>
              <div className="space-y-4 pt-8">
                <div className="bg-brand-yellow p-6 rounded-3xl text-brand-dark shadow-xl">
                  <div className="text-3xl font-black mb-1">2.5k</div>
                  <div className="text-xs font-bold uppercase tracking-widest opacity-80">Clientes Felizes</div>
                </div>
                <img
                  src="https://images.unsplash.com/photo-1506012787146-f92b2d7d6d96?q=80&w=600&auto=format&fit=crop"
                  alt="Viagem em Grupo"
                  className="rounded-3xl shadow-lg w-full h-64 object-cover transform hover:scale-105 transition-transform duration-500"
                />
              </div>
            </div>
          </div>

          <div className="lg:w-1/2">
            <div className="inline-block px-4 py-2 rounded-full bg-brand-vibrant/10 border border-brand-vibrant/20 text-brand-vibrant text-xs font-black uppercase tracking-widest mb-6">
              Sobre a Anhangá
            </div>
            <h2 className="text-3xl md:text-5xl font-black text-brand-dark mb-8 leading-tight">
              Sua agência boutique para roteiros <span className="text-brand-vibrant">exclusivos</span> em São Paulo.
            </h2>
            <div className="space-y-6 text-gray-600 text-lg leading-relaxed font-serif mb-10">
              <p>
                A Anhangá Viagens é mais que uma agência; somos curadores de experiências. Especializados em transformar sonhos em roteiros viáveis e memoráveis, unimos tecnologia e atendimento humano para garantir sua tranquilidade.
              </p>
              <p>
                De pacotes mágicos para <strong>Orlando</strong> e <strong>Beto Carrero</strong> a logística especializada para festivais como o <strong>Lollapalooza 2026</strong>, nossa missão é cuidar de cada detalhe para você apenas viver o momento.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-12">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <h4 className="font-black text-brand-dark mb-1">Credibilidade</h4>
                  <p className="text-sm text-gray-500 font-medium">Cadastur regularizado e anos de mercado.</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center shrink-0">
                  <Award className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-black text-brand-dark mb-1">Expertise</h4>
                  <p className="text-sm text-gray-500 font-medium">Especialistas certificados em destinos chave.</p>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                to="/sobre"
                className="inline-flex items-center justify-center gap-2 bg-brand-dark text-white font-black px-8 py-4 rounded-2xl hover:bg-gray-800 transition-all group"
              >
                Conheça Nossa História
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <button
                onClick={() => window.dispatchEvent(new CustomEvent('toggle-ai-chat', {
                  detail: { message: "Olá! Gostaria de conhecer melhor a Anhangá e como vocês podem me ajudar." }
                }))}
                className="inline-flex items-center justify-center gap-2 border-2 border-brand-dark text-brand-dark font-black px-8 py-4 rounded-2xl hover:bg-gray-50 transition-all"
              >
                Falar com Especialista
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;

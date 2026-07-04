import React from 'react';
import { Award, Anchor, Ship, Coffee } from 'lucide-react';

// Seção "Agência Certificada": credenciamentos como fatos verificáveis em texto
// (Cadastur, Beto Carrero, Hopi Hari, NCL) — os mesmos sinais que o JSON-LD de
// entidade em pages/About.tsx expõe para motores de resposta.
export const TrustSection: React.FC = () => (
  <section id="certificacoes" className="bg-brand-dark rounded-[3rem] p-12 md:p-20 text-white overflow-hidden relative">
    <div className="absolute top-0 right-0 size-64 bg-brand-vibrant/20 blur-[100px] rounded-full"></div>
    <div className="absolute bottom-0 left-0 size-64 bg-brand-cyan/10 blur-[100px] rounded-full"></div>

    <div className="relative z-10 flex flex-col lg:flex-row gap-16 items-center">
      <div className="w-full lg:w-1/2">
        <div className="inline-flex items-center gap-2 px-4 py-1 bg-white/10 rounded-full text-brand-cyan text-sm font-bold mb-6">
          <Award className="size-4" /> Credibilidade & Confiança
        </div>
        <h2 className="text-3xl md:text-4xl font-black mb-6">Agência Certificada</h2>
        <p className="text-zinc-300 text-lg font-medium leading-relaxed mb-8">
          Sua segurança é nossa prioridade. A Anhangá Viagens é uma empresa devidamente registrada nos órgãos competentes, garantindo total conformidade legal para suas férias.
        </p>

        <ul className="space-y-6">
          <li className="flex items-start gap-4">
            <div className="size-6 rounded-full bg-brand-cyan/20 flex items-center justify-center shrink-0 mt-1">
              <div className="size-2 rounded-full bg-brand-cyan"></div>
            </div>
            <div>
              <p className="font-bold text-lg leading-none mb-1">Cadastur Oficial</p>
              <p className="text-zinc-400">Registro MTUR: 37.036.732/0001-41</p>
            </div>
          </li>
          <li className="flex items-start gap-4">
            <div className="size-6 rounded-full bg-brand-cyan/20 flex items-center justify-center shrink-0 mt-1">
              <div className="size-2 rounded-full bg-brand-cyan"></div>
            </div>
            <div>
              <p className="font-bold text-lg leading-none mb-1">Sede Própria em São Paulo</p>
              <p className="text-zinc-400">Av. Dom Pedro I, 773 - Vila Monumento, CEP 01552-001</p>
            </div>
          </li>
          <li className="flex items-start gap-4">
            <div className="size-6 rounded-full bg-anhanga-action/20 flex items-center justify-center shrink-0 mt-1">
              <div className="size-2 rounded-full bg-anhanga-action"></div>
            </div>
            <div>
              <p className="font-bold text-lg leading-none mb-1">Agente Credenciado</p>
              <p className="text-zinc-400">Beto Carrero World e Hopi Hari</p>
            </div>
          </li>
          <li className="flex items-start gap-4">
            <div className="size-6 rounded-full bg-anhanga-action/20 flex items-center justify-center shrink-0 mt-1">
              <div className="size-2 rounded-full bg-anhanga-action"></div>
            </div>
            <div>
              <p className="font-bold text-lg leading-none mb-1">Parceira Norwegian Cruise Line</p>
              <p className="text-zinc-400">Cruzeiros nacionais e internacionais (NCL)</p>
            </div>
          </li>
        </ul>
      </div>

      <div className="w-full lg:w-1/2 grid grid-cols-2 gap-4">
        <div className="bg-white/5 backdrop-blur-sm p-8 rounded-3xl border border-white/10 flex flex-col items-center text-center">
          <Award className="size-12 text-brand-cyan mb-4" />
          <p className="text-sm font-bold uppercase tracking-tighter opacity-50 mb-2">Membro Oficial</p>
          <p className="font-black text-xl">Beto Carrero World</p>
          <p className="text-xs text-brand-cyan mt-1">Agente Credenciado</p>
        </div>
        <div className="bg-white/5 backdrop-blur-sm p-8 rounded-3xl border border-white/10 flex flex-col items-center text-center">
          <Anchor className="size-12 text-anhanga-action mb-4" />
          <p className="text-sm font-bold uppercase tracking-tighter opacity-50 mb-2">Membro Oficial</p>
          <p className="font-black text-xl">Hopi Hari</p>
          <p className="text-xs text-anhanga-action mt-1">Agente Credenciado</p>
        </div>
        <div className="bg-white/5 backdrop-blur-sm p-8 rounded-3xl border border-white/10 flex flex-col items-center text-center">
          <Ship className="size-12 text-anhanga-action mb-4" />
          <p className="text-sm font-bold uppercase tracking-tighter opacity-50 mb-2">Parceira</p>
          <p className="font-black text-xl">Norwegian Cruise Line</p>
          <p className="text-xs text-anhanga-action mt-1">Cruzeiros NCL</p>
        </div>
        <div className="bg-white/5 backdrop-blur-sm p-8 rounded-3xl border border-white/10 flex flex-col items-center text-center">
          <Coffee className="size-12 text-brand-yellow mb-4" />
          <p className="text-sm font-bold uppercase tracking-tighter opacity-50 mb-2">Localizada em</p>
          <p className="font-black text-xl">São Paulo - SP</p>
          <p className="text-xs text-brand-yellow mt-1">Atendimento Presencial</p>
        </div>
        <div className="col-span-2 bg-white/5 backdrop-blur-sm p-6 rounded-3xl border border-white/10 flex items-center justify-center gap-6">
          <div className="text-center">
            <p className="text-3xl font-black text-brand-vibrant">4.9/5</p>
            <p className="text-[10px] font-bold uppercase tracking-widest opacity-50">Avaliação Média</p>
          </div>
          <div className="h-10 w-px bg-white/10"></div>
          <div className="text-center">
            <p className="text-3xl font-black text-brand-cyan">100%</p>
            <p className="text-[10px] font-bold uppercase tracking-widest opacity-50">Roteiros sob medida</p>
          </div>
        </div>
      </div>
    </div>
  </section>
);

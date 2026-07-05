import React from 'react';
import { m } from 'framer-motion';
import { Heart } from 'lucide-react';
import { LazyImage } from '../ui/LazyImage';
import { fadeUp } from './aboutMotion';

// Seção "Nossa História": narrativa da marca + imagem da equipe.
export const HistoriaSection: React.FC = () => (
  <section id="nossa-historia" className="mb-32">
    <div className="flex flex-col lg:flex-row gap-16 items-center">
      <m.div
        className="w-full lg:w-1/2"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={fadeUp}
        custom={1}
      >
        <div className="relative">
          <div className="absolute -top-4 -left-4 size-24 bg-anhanga-yellow/30 rounded-full blur-2xl z-0"></div>
          <div className="relative rounded-3xl overflow-hidden border-8 border-white shadow-2xl rotate-2 hover:rotate-0 transition-transform duration-500">
            <LazyImage
              src="images/about/equipe-anhanga.jpg"
              alt="Equipe da Anhangá Viagens planejando um roteiro personalizado"
              width={800}
              height={600}
              className="w-full h-auto object-cover aspect-[4/3]"
            />
          </div>
          <div className="absolute -bottom-6 -right-6 bg-white p-6 rounded-2xl shadow-float-lg hidden md:block">
            <div className="flex items-center gap-4">
              <div className="size-12 bg-anhanga-action/10 rounded-full flex items-center justify-center text-anhanga-action">
                <Heart className="size-6 fill-current" aria-hidden="true" />
              </div>
              <div>
                <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Paixão por</p>
                <p className="text-lg font-black text-anhanga-dark leading-none">Pessoas</p>
              </div>
            </div>
          </div>
        </div>
      </m.div>

      <m.div
        className="w-full lg:w-1/2"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={fadeUp}
        custom={2}
      >
        <h2 className="text-3xl md:text-4xl font-black text-anhanga-dark mb-6">Nossa História</h2>
        <div className="space-y-4 text-zinc-600 font-medium leading-relaxed text-lg">
          <p>
            A Anhangá Viagens nasceu em São Paulo com um propósito claro: resgatar o prazer de planejar uma viagem sem as dores de cabeça da burocracia digital e dos roteiros engessados.
          </p>
          <p>
            Fundada por especialistas apaixonados pelo setor, nossa agência foca no <strong>atendimento consultivo</strong>. Não somos apenas um motor de busca; somos curadores de experiências.
          </p>
          <p>
            Do primeiro café (virtual ou presencial) até o seu retorno para casa, cuidamos de cada detalhe como se a viagem fosse nossa. É esse cuidado artesanal que nos define.
          </p>
        </div>
      </m.div>
    </div>
  </section>
);

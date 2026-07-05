import React from 'react';
import { m } from 'framer-motion';
import { InstagramLogo, LinkedinLogo } from '@phosphor-icons/react';
import { LazyImage } from '../ui/LazyImage';
import type { Author } from '../../data/blogData';
import { fadeUp } from './aboutMotion';

interface ConsultoresSectionProps {
  team: Author[];
}

// Seção "Quem planeja a sua viagem": consultores como entidades E-E-A-T.
// O JSON-LD Person correspondente é emitido em pages/About.tsx.
export const ConsultoresSection: React.FC<ConsultoresSectionProps> = ({ team }) => (
  <section id="consultores" className="mt-32">
    <m.div
      className="text-center mb-16"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      variants={fadeUp}
      custom={0}
    >
      <h2 className="text-3xl md:text-4xl font-black text-anhanga-dark mb-4">Quem planeja a sua viagem</h2>
      <p className="text-zinc-500 font-medium max-w-2xl mx-auto">
        Atendimento consultivo é feito por gente de verdade. Conheça os consultores que desenham cada roteiro sob medida.
      </p>
    </m.div>

    <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
      {team.map((member, i) => (
        <m.div
          key={member.id}
          className="bg-white p-8 rounded-2xl shadow-float hover:shadow-float-lg transition duration-300 flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          custom={i + 1}
        >
          {member.image && (
            <LazyImage
              src={member.image}
              alt={`${member.name}, ${member.role} na Anhangá Viagens`}
              width={96}
              height={96}
              className="size-24 rounded-2xl object-cover shrink-0 border-4 border-white shadow-md"
            />
          )}
          <div>
            <h3 className="text-xl font-black text-anhanga-dark leading-tight">{member.name}</h3>
            <p className="text-sm font-bold text-anhanga-action uppercase tracking-wide mb-3">{member.role}</p>
            <p className="text-zinc-500 font-medium leading-relaxed mb-4">{member.bio}</p>
            {member.social && (member.social.instagram || member.social.linkedin) && (
              <div className="flex items-center justify-center sm:justify-start gap-3">
                {member.social.instagram && (
                  <a
                    href={member.social.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Instagram de ${member.name}`}
                    className="size-11 rounded-full bg-anhanga-action/10 text-anhanga-action flex items-center justify-center hover:bg-anhanga-action hover:text-white transition-colors"
                  >
                    <InstagramLogo className="size-4" weight="fill" aria-hidden="true" />
                  </a>
                )}
                {member.social.linkedin && (
                  <a
                    href={member.social.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`LinkedIn de ${member.name}`}
                    className="size-11 rounded-full bg-anhanga-action/10 text-anhanga-action flex items-center justify-center hover:bg-anhanga-action hover:text-white transition-colors"
                  >
                    <LinkedinLogo className="size-4" weight="fill" aria-hidden="true" />
                  </a>
                )}
              </div>
            )}
          </div>
        </m.div>
      ))}
    </div>
  </section>
);

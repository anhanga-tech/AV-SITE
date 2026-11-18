import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ChevronDown, MapPin } from 'lucide-react';
import type { Park } from './constants';
import { openParquesContact } from './contact';
import { ParkPhoto } from './ParkPhoto';
import { useParquesProfile } from './ProfileContext';

/*
  O parque como polaroide: foto grande primeiro, uma frase e três fichas. A
  copy longa (claim, para quem rende, melhor época) fica no "Ver detalhes",
  em <details>: continua no HTML para busca e leitor de tela, mas não pesa na
  leitura de quem só está escolhendo.

  Mesmo card para credenciados e aquáticos; o que separa os dois é o carimbo
  "Agente credenciado" e o tamanho da coluna onde cada um entra.
*/

const FACTS: ReadonlyArray<{ key: 'age' | 'days' | 'when'; label: string; tint: string }> = [
  { key: 'age', label: 'Idade', tint: 'bg-amber-50' },
  { key: 'days', label: 'Dias', tint: 'bg-emerald-50' },
  { key: 'when', label: 'Quando', tint: 'bg-sky-50' },
];

interface ParkCardProps {
  park: Park;
  matched: boolean;
  /** Alterna a inclinação, como fotos coladas à mão num caderno. */
  tilt: 'left' | 'right';
  /** `li` dentro de lista, `article` solto. */
  as?: 'article' | 'li';
  photoClassName?: string;
}

export const ParkCard: React.FC<ParkCardProps> = ({ park, matched, tilt, as = 'article', photoClassName = 'h-60 sm:h-72' }) => {
  const { profile } = useParquesProfile();
  const Tag = as;
  const credentialed = park.tier === 'credenciado';

  return (
    <Tag
      id={`parque-${park.slug}`}
      className={`relative scroll-mt-28 list-none transition-transform duration-200 ease-out motion-reduce:transition-none motion-safe:hover:rotate-0 ${
        tilt === 'left' ? '-rotate-1' : 'rotate-1'
      }`}
    >
      {/* Fita adesiva: decorativa. */}
      <span
        aria-hidden="true"
        className="absolute -top-3 left-1/2 z-10 h-6 w-24 -translate-x-1/2 rotate-2 bg-yellow-200/90 shadow-sm"
      />
      <div
        className={`overflow-hidden rounded-[1.5rem] border-2 border-anhanga-dark bg-white shadow-hard-lg ${
          matched ? 'ring-4 ring-anhanga-yellow ring-offset-2 ring-offset-transparent' : ''
        }`}
      >
        <div className="relative">
          <ParkPhoto park={park} maxWidth={900} className={photoClassName} />
          {/* Selo e carimbo dividem uma linha que quebra: em 320px, lado a lado
              e posicionados cada um num canto, os dois se sobrepunham. */}
          {credentialed || matched ? (
            <div className="absolute inset-x-3 top-3 flex flex-wrap items-start justify-between gap-2">
              {matched ? (
                <span className="-rotate-3 rounded-full border-2 border-anhanga-dark bg-anhanga-yellow px-3 py-1 font-display text-sm font-extrabold text-anhanga-dark">
                  Combina com a sua família
                </span>
              ) : (
                <span />
              )}
              {credentialed ? (
                <span className="rotate-6 rounded-lg border-2 border-anhanga-darkBlue bg-white/95 px-2 py-1 text-center font-display text-[10px] font-black uppercase leading-tight tracking-[0.12em] text-anhanga-darkBlue">
                  Agente
                  <br />
                  credenciado
                </span>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className="p-5 sm:p-6">
          <h3 className="font-display text-2xl font-extrabold leading-tight tracking-tight text-anhanga-dark sm:text-3xl">
            {park.name}
          </h3>
          <p className="mt-1 inline-flex items-center gap-1 text-sm font-semibold text-zinc-500">
            <MapPin className="size-4" aria-hidden="true" />
            {park.city}, {park.state}
          </p>
          {park.short ? <p className="mt-3 text-lg leading-snug text-zinc-800">{park.short.tagline}</p> : null}

          {park.short ? (
            <dl className="mt-4 grid grid-cols-3 gap-2">
              {FACTS.map((fact) => (
                <div key={fact.key} className={`rounded-xl px-2.5 py-2 ${fact.tint}`}>
                  <dt className="font-display text-[10px] font-black uppercase tracking-[0.1em] text-zinc-600">
                    {fact.label}
                  </dt>
                  <dd className="mt-0.5 text-sm font-bold leading-tight text-anhanga-dark">{park.short?.[fact.key]}</dd>
                </div>
              ))}
            </dl>
          ) : null}

          <details className="group mt-3">
            <summary className="inline-flex min-h-[44px] cursor-pointer list-none items-center gap-1 font-semibold text-anhanga-actionInk hover:text-anhanga-actionDark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-anhanga-action [&::-webkit-details-marker]:hidden">
              Ver detalhes
              <ChevronDown className="size-4 transition-transform group-open:rotate-180 motion-reduce:transition-none" aria-hidden="true" />
            </summary>
            <div className="space-y-2 pb-1 text-base leading-relaxed text-zinc-700">
              <p>{park.claim}</p>
              <p>
                <span className="font-semibold text-anhanga-dark">Rende mais para:</span> {park.bestFor}
              </p>
              <p>
                <span className="font-semibold text-anhanga-dark">Quantos dias:</span> {park.days}
              </p>
              <p>
                <span className="font-semibold text-anhanga-dark">Melhor época:</span> {park.when}
              </p>
            </div>
          </details>

          <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2">
            <button
              type="button"
              onClick={() => openParquesContact(park, profile)}
              className="inline-flex min-h-[44px] items-center rounded-xl bg-anhanga-dark px-6 py-3 font-semibold text-white shadow-hard-yellow transition-transform duration-150 ease-out hover:-translate-y-0.5 motion-reduce:transition-none motion-reduce:hover:translate-y-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-anhanga-action"
            >
              {/* Nome em sr-only: cinco botões "Pedir orçamento" idênticos seriam
                  indistinguíveis para leitor de tela. */}
              Pedir orçamento<span className="sr-only"> do {park.name}</span>
            </button>
            {park.href ? (
              <Link
                to={park.href}
                className="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg font-semibold text-anhanga-actionInk transition-colors hover:text-anhanga-actionDark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-anhanga-action"
              >
                Conhecer a página do {park.name}
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            ) : null}
          </div>
        </div>
      </div>
    </Tag>
  );
};

import React from 'react';
import { HardHat, ShieldCheck } from 'lucide-react';
import { optimizeRemoteImageUrl } from '../../data/mediaConfig';
import {
  BOOKABLE_PARKS,
  CREDENTIALED_PARKS,
  HERO_PARK_SLUG,
  PACKAGE_PARKS,
  PARKS,
  UPCOMING_PARKS,
} from './constants';
import { openParquesContact } from './contact';
import { CacauWaitlist } from './CacauWaitlist';
import { PARQUES_FINAL_CTA_ID, PARQUES_HERO_ID } from './MobileQuoteBar';
import { ParkCard } from './ParkCard';
import { useParquesProfile } from './ProfileContext';
import { ProfileSelector } from './ProfileSelector';
import { matchParks } from './profile';

/*
  Direção lúdica (aprovada pelo Felipe sobre o mockup de 18/11/2026): parque de
  diversão é brincadeira, e a página parecia relatório. Foto grande, pouco
  texto e um seletor com cara de jogo, no estilo caderno de viagem do design
  system da marca (polaroide, fita adesiva, carimbo, sombra dura).

  Exceção registrada ao DESIGN.md: aqui o Âmbar aparece também no feedback do
  jogo (peça escolhida, selo "Combina") e como sombra dos botões de parque.
  O único botão Âmbar continua sendo o CTA final.

  Credenciados x aquáticos continua explícito: carimbo só nos credenciados e
  a frase honesta de "não temos credenciamento" nos aquáticos.
*/

interface SectionProps {
  whatsappUrl: string;
}

/** Slugs que encaixam no perfil do "Quem vai?"; vazio enquanto ninguém respondeu. */
function useMatchedSlugs(): Set<string> {
  const { profile } = useParquesProfile();
  return new Set(matchParks(profile, BOOKABLE_PARKS.map((park) => park.slug)));
}

const HERO_PARK = PARKS.find((park) => park.slug === HERO_PARK_SLUG);

// Fundo creme da Superfície Quente: o mesmo papel do caderno das polaroides.
const PAPER = 'bg-[#fffdf5]';

export const ParquesHero: React.FC = () => (
  <section id={PARQUES_HERO_ID} className={`${PAPER} pb-12 sm:pb-16`}>
    {/* A foto ocupa a tela; o texto vai por cima, no rodapé dela. pt-32 deixa
        o conteúdo abaixo do Header fixo (72px). */}
    <div className="relative overflow-hidden bg-anhanga-dark">
      {HERO_PARK?.image ? (
        <figure className="absolute inset-0 m-0">
          <img
            src={optimizeRemoteImageUrl(HERO_PARK.image.src, 1600)}
            alt={HERO_PARK.image.alt}
            loading="eager"
            fetchPriority="high"
            decoding="async"
            className="size-full object-cover"
          />
          <figcaption className="absolute bottom-2 right-3 text-[10px] text-white/80 [text-shadow:0_1px_2px_rgba(15,23,42,0.8)]">
            {HERO_PARK.image.credit}
          </figcaption>
        </figure>
      ) : null}
      <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-anhanga-dark/95 via-anhanga-dark/55 to-anhanga-dark/25" />

      <div className="container relative mx-auto max-w-5xl px-6 pt-32 pb-20 sm:pt-40 sm:pb-28 lg:pt-48 lg:pb-32">
        <p className="inline-block -rotate-3 rounded-lg border-2 border-anhanga-dark bg-anhanga-yellow px-3.5 py-1.5 font-display text-xs font-black uppercase tracking-[0.15em] text-anhanga-dark shadow-hard">
          Parques do Brasil
        </p>
        <h1 className="mt-4 max-w-3xl font-display text-[2.5rem] font-black leading-none tracking-tight text-white sm:text-6xl lg:text-7xl">
          Qual parque é a cara da sua família?
        </h1>
        <p className="mt-3 text-lg font-medium text-white/90 sm:text-xl">Dois toques e a gente te mostra.</p>
      </div>
    </div>

    {/* O seletor sobe sobre a foto: é o primeiro toque da página. */}
    <div className="container relative mx-auto -mt-12 max-w-5xl px-6 sm:-mt-16">
      <ProfileSelector />
    </div>
  </section>
);

export const CredentialedSection: React.FC = () => {
  const matchedSlugs = useMatchedSlugs();
  return (
    <section className={`${PAPER} py-14 sm:py-20`}>
      <div className="container mx-auto max-w-5xl px-6">
        <h2 className="font-display text-3xl font-extrabold leading-tight tracking-tight text-anhanga-dark sm:text-4xl">
          Onde emitimos o ingresso oficial
        </h2>
        <p className="mt-3 text-lg leading-relaxed text-zinc-700 max-w-[60ch]">
          Somos agente credenciado destes dois: o ingresso sai direto do parque, sem revenda.
        </p>
        <p className="mt-2 inline-flex items-start gap-2 text-sm text-zinc-600">
          <ShieldCheck className="mt-0.5 size-4 shrink-0 text-anhanga-actionDark" aria-hidden="true" />
          <span>
            Cadastur, o cadastro do Ministério do Turismo:{' '}
            <a
              href="https://cadastur.turismo.gov.br/hotsite/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-anhanga-dark underline underline-offset-2 hover:text-anhanga-actionDark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-anhanga-action"
            >
              37.036.732/0001-41
            </a>
          </span>
        </p>

        {/* Ordem fixa: o destaque do perfil fica no anel e no selo. */}
        <div className="mt-12 grid gap-12 md:grid-cols-2 md:gap-8">
          {CREDENTIALED_PARKS.map((park, index) => (
            <ParkCard
              key={park.slug}
              park={park}
              matched={matchedSlugs.has(park.slug)}
              tilt={index % 2 === 0 ? 'left' : 'right'}
              photoClassName="h-64 sm:h-80"
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export const PackageSection: React.FC = () => {
  const matchedSlugs = useMatchedSlugs();
  // Os que combinam sobem: no celular são três telas de rolagem, e o parque
  // recomendado não pode ficar por último. sort é estável.
  const parks = [...PACKAGE_PARKS].sort(
    (a, b) => Number(matchedSlugs.has(b.slug)) - Number(matchedSlugs.has(a.slug)),
  );
  return (
    <section className="bg-anhanga-light py-14 sm:py-20">
      <div className="container mx-auto max-w-5xl px-6">
        <h2 className="font-display text-3xl font-extrabold leading-tight tracking-tight text-anhanga-dark sm:text-4xl">
          Os aquáticos, com a viagem inteira montada
        </h2>
        <p className="mt-3 text-lg leading-relaxed text-zinc-700 max-w-[60ch]">
          Aqui não temos credenciamento. Montamos aéreo, hotel, transfer e ingresso, com um consultor do começo ao fim.
        </p>

        <ul className="mt-12 grid gap-12 md:grid-cols-3 md:gap-6">
          {parks.map((park, index) => (
            <ParkCard
              key={park.slug}
              as="li"
              park={park}
              matched={matchedSlugs.has(park.slug)}
              tilt={index % 2 === 0 ? 'right' : 'left'}
              photoClassName="h-56"
            />
          ))}
        </ul>
      </div>
    </section>
  );
};

// Só a partir de md. No celular os cards de parque logo acima já mostram
// cidade, dias e época, um embaixo do outro; repetir os cinco em formato de
// comparação somava ~1.900px de rolagem sem informação nova, e a tabela
// pedia rolagem lateral de 44rem.
export const ComparisonSection: React.FC = () => (
  <section className="hidden bg-white py-16 sm:py-24 md:block">
    <div className="container mx-auto px-6 max-w-5xl">
      <h2 className="font-display text-3xl sm:text-4xl font-extrabold leading-tight text-anhanga-dark">
        Os cinco lado a lado
      </h2>
      <p className="mt-4 text-lg leading-relaxed text-zinc-700 max-w-[65ch]">
        A comparação que costuma decidir a viagem numa conversa de WhatsApp.
      </p>

      <div className="mt-8 overflow-x-auto">
        <table className="w-full min-w-[44rem] border-collapse text-left">
          <caption className="sr-only">
            Comparação entre os parques do Brasil: tipo, localização, perfil de público,
            duração recomendada e melhor época
          </caption>
          <thead>
            <tr className="border-b-2 border-anhanga-dark">
              {['Parque', 'Tipo', 'Onde', 'Quantos dias', 'Melhor época'].map((header) => (
                <th
                  key={header}
                  scope="col"
                  className="px-3 py-3 font-display text-xs font-black uppercase tracking-[0.1em] text-anhanga-dark"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {BOOKABLE_PARKS.map((park) => (
              <tr key={park.slug} className="border-b border-zinc-200">
                <th scope="row" className="px-3 py-4 font-semibold text-anhanga-dark">
                  {park.name}
                </th>
                <td className="px-3 py-4 text-sm text-zinc-600">{park.kind}</td>
                <td className="px-3 py-4 text-sm text-zinc-600">
                  {park.city}, {park.state}
                </td>
                <td className="px-3 py-4 text-sm text-zinc-600">{park.days}</td>
                <td className="px-3 py-4 text-sm text-zinc-600">{park.when}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </section>
);

export const UpcomingSection: React.FC = () => (
  <section className="bg-anhanga-dark py-14 sm:py-16">
    <div className="container mx-auto px-6 max-w-5xl">
      {UPCOMING_PARKS.map((park) => (
        <div key={park.slug} id={park.slug} className="scroll-mt-28">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 px-3 py-1 font-display text-xs font-black uppercase tracking-[0.1em] text-white/90">
            <HardHat className="size-3.5" aria-hidden="true" />
            Ainda em obras
          </span>
          <h2 className="mt-5 font-display text-2xl sm:text-3xl font-extrabold text-white/90">
            {park.name}, em {park.city} ({park.state})
          </h2>
          <p className="mt-4 text-base leading-relaxed text-white/70 max-w-[65ch]">
            {park.claim} Não existe venda de ingresso nem de pacote até lá — quando abrir,
            entra nesta página com o resto.
          </p>
          {park.slug === 'cacau-park' ? <CacauWaitlist /> : null}
        </div>
      ))}
    </div>
  </section>
);

export const ParquesCta: React.FC<SectionProps> = ({ whatsappUrl }) => {
  const { profile } = useParquesProfile();
  return (
    <section id={PARQUES_FINAL_CTA_ID} className="bg-anhanga-dark py-16 sm:py-24">
      <div className="container mx-auto px-6 max-w-3xl text-center">
        <h2 className="font-display text-3xl sm:text-5xl font-extrabold leading-tight tracking-tight text-white">
          Ficou na dúvida? A gente escolhe com você.
        </h2>
        <p className="mt-4 text-lg leading-relaxed text-white/75">
          Conte a idade das crianças e quantos dias vocês têm. O consultor responde qual parque faz sentido.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <button
            type="button"
            onClick={() => openParquesContact(undefined, profile)}
            className="inline-flex min-h-[44px] w-full items-center justify-center rounded-2xl border-2 border-white bg-anhanga-yellow px-8 py-4 font-display text-lg font-bold text-anhanga-dark shadow-[4px_4px_0px_0px_#ffffff] transition-[transform,box-shadow] duration-150 ease-out hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[2px_2px_0px_0px_#ffffff] active:translate-x-1 active:translate-y-1 active:shadow-none motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:w-auto"
          >
            Falar com um consultor
          </button>
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-[44px] w-full items-center justify-center rounded-lg px-6 py-3 font-semibold text-white/85 underline underline-offset-4 transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:w-auto"
          >
            Prefiro WhatsApp
          </a>
        </div>
      </div>
    </section>
  );
};

/*
  Atribuição completa das fotos de terceiros. A legenda sobre a foto é curta
  por espaço; CC BY-SA pede também link para a origem e para a licença, e a
  foto aparece recortada (object-cover), o que conta como adaptação.
*/
export const PhotoCredits: React.FC = () => {
  const credited = PARKS.filter((park) => park.image?.source && park.image.license);
  if (credited.length === 0) return null;

  return (
      <section aria-labelledby="parques-photo-credits" className="bg-white pb-10">
        <div className="container mx-auto max-w-5xl border-t border-zinc-100 px-6 pt-6">
          <h2 id="parques-photo-credits" className="font-display text-xs font-bold text-zinc-500">
            Créditos das fotos
          </h2>
          <ul className="mt-2 text-xs text-zinc-500">
            {credited.map(({ slug, name, image }) => (
              <li key={slug} className="flex flex-wrap items-center gap-x-2">
                <span>
                  {name}: {image?.license?.author}, foto recortada.
                </span>
                <a href={image?.source} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-[44px] items-center underline underline-offset-2 hover:text-anhanga-actionDark">
                  Original
                </a>
                <a href={image?.license?.url} target="_blank" rel="noopener noreferrer license" className="inline-flex min-h-[44px] items-center underline underline-offset-2 hover:text-anhanga-actionDark">
                  {image?.license?.name}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </section>
  );
};

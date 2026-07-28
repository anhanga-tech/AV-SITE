import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, BadgeCheck, CalendarClock, Clock, HardHat } from 'lucide-react';
import {
  BOOKABLE_PARKS,
  CREDENTIALED_PARKS,
  PACKAGE_PARKS,
  UPCOMING_PARKS,
  type Park,
} from './constants';

/*
  Hierarquia visual deliberada (DESIGN.md proíbe cards idênticos em grade):
  - credenciados: dois blocos grandes, tipografia headline, o único par onde
    a Anhangá emite ingresso oficial;
  - aquáticos: lista horizontal compacta, peso menor;
  - Cacau Park: faixa escura de antecipação, sem CTA (não há o que vender).
  O Âmbar Vivo aparece uma única vez na página inteira: no CTA final.
*/

interface SectionProps {
  onCtaClick: () => void;
  whatsappUrl: string;
}

// pt-32 é o padrão das páginas do MainSiteShell (BlogList, SiteMap): o Header
// é `fixed` com 72px, e qualquer coisa acima disso some atrás dele no topo da
// página — o eyebrow ficava coberto em mobile.
export const ParquesHero: React.FC = () => (
  <section className="bg-anhanga-light pt-32 pb-16 sm:pt-36 sm:pb-24">
    {/* max-w-5xl em todas as seções: larguras diferentes deslocam o eixo
        esquerdo entre uma seção e outra, e a coluna "pula" ao rolar. */}
    <div className="container mx-auto px-6 max-w-5xl">
      <p className="font-display text-xs font-black uppercase tracking-[0.1em] text-anhanga-actionDark">
        Parques do Brasil
      </p>
      <h1 className="mt-4 font-display text-4xl sm:text-5xl lg:text-6xl font-black leading-[0.95] tracking-tight text-anhanga-dark">
        Cinco parques, e só um serve para a sua família
      </h1>
      <p className="mt-6 text-lg leading-relaxed text-zinc-700 max-w-[65ch]">
        Beto Carrero, Hopi Hari, Thermas dos Laranjais, Beach Park e Hot Park resolvem
        problemas diferentes. A idade dos seus filhos, quantos dias você tem e a época do
        ano importam mais do que qualquer ranking. Abaixo está o que separa um do outro —
        e onde a gente emite ingresso oficial.
      </p>
    </div>
  </section>
);

const CredentialedPark: React.FC<{ park: Park; index: number }> = ({ park, index }) => (
  <article
    className={`rounded-2xl bg-white p-6 sm:p-8 shadow-float ${
      index === 0 ? 'lg:col-span-3' : 'lg:col-span-2'
    }`}
  >
    {/* Badge e local em linhas próprias, não lado a lado: no card estreito o
        par quebrava e derrubava o título 20px abaixo do card vizinho, o que
        lê como acidente e não como a assimetria pretendida. */}
    <div className="flex flex-col items-start gap-2">
      <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 font-display text-xs font-black uppercase tracking-[0.1em] text-anhanga-darkBlue">
        <BadgeCheck className="size-3.5" aria-hidden="true" />
        Agente credenciado
      </span>
      <span className="inline-flex items-center gap-1.5 text-sm text-zinc-500">
        <MapPin className="size-4" aria-hidden="true" />
        {park.city}, {park.state}
      </span>
    </div>

    <h3
      className={`mt-5 font-display font-extrabold leading-tight text-anhanga-dark ${
        index === 0 ? 'text-3xl sm:text-4xl' : 'text-2xl sm:text-3xl'
      }`}
    >
      {park.name}
    </h3>
    <p className="mt-4 text-base leading-relaxed text-zinc-700 max-w-[65ch]">{park.claim}</p>

    <dl className="mt-6 space-y-4 border-t border-zinc-100 pt-6">
      <div>
        <dt className="font-display text-xs font-black uppercase tracking-[0.1em] text-zinc-500">
          Rende mais para
        </dt>
        <dd className="mt-1.5 text-base leading-relaxed text-zinc-700">{park.bestFor}</dd>
      </div>
      <div>
        <dt className="font-display text-xs font-black uppercase tracking-[0.1em] text-zinc-500">
          Quantos dias
        </dt>
        <dd className="mt-1.5 text-base text-zinc-700">{park.days}</dd>
      </div>
    </dl>

    {park.href ? (
      <Link
        to={park.href}
        className="mt-7 inline-flex min-h-[44px] items-center rounded-xl bg-anhanga-dark px-6 py-3 font-semibold text-white transition-transform duration-150 ease-out hover:-translate-y-0.5 motion-reduce:transition-none motion-reduce:hover:translate-y-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-anhanga-action"
      >
        Ver pacotes do {park.name}
      </Link>
    ) : null}
  </article>
);

export const CredentialedSection: React.FC = () => (
  <section className="bg-white py-16 sm:py-24">
    <div className="container mx-auto px-6 max-w-5xl">
      <h2 className="font-display text-3xl sm:text-4xl font-extrabold leading-tight text-anhanga-dark">
        Onde emitimos o ingresso oficial
      </h2>
      <p className="mt-4 text-lg leading-relaxed text-zinc-700 max-w-[65ch]">
        A Anhangá é agente credenciado destes dois parques. Na prática, o ingresso sai
        emitido direto, sem revenda no meio do caminho, e qualquer problema de data ou
        remarcação a gente resolve com o parque.
      </p>

      <div className="mt-10 grid gap-6 lg:grid-cols-5 lg:items-start">
        {CREDENTIALED_PARKS.map((park, index) => (
          <CredentialedPark key={park.slug} park={park} index={index} />
        ))}
      </div>
    </div>
  </section>
);

export const PackageSection: React.FC = () => (
  <section className="bg-anhanga-light py-16 sm:py-24">
    <div className="container mx-auto px-6 max-w-5xl">
      <h2 className="font-display text-3xl sm:text-4xl font-extrabold leading-tight text-anhanga-dark">
        Os aquáticos, com a viagem inteira montada
      </h2>
      <p className="mt-4 text-lg leading-relaxed text-zinc-700 max-w-[65ch]">
        Nestes três não temos credenciamento — e preferimos dizer isso a inventar
        autoridade. O que fazemos é a viagem completa: aéreo, hospedagem, transfer e
        ingresso, com um consultor acompanhando do orçamento ao retorno.
      </p>

      <ul className="mt-10 divide-y divide-zinc-200/80">
        {PACKAGE_PARKS.map((park) => (
          <li key={park.slug} className="py-7 first:pt-0 last:pb-0">
            <h3 className="font-display text-xl font-bold text-anhanga-dark">{park.name}</h3>
            <p className="mt-3 text-base leading-relaxed text-zinc-700 max-w-[65ch]">
              {park.claim}
            </p>
            <p className="mt-3 text-base leading-relaxed text-zinc-600 max-w-[65ch]">
              <span className="font-semibold text-anhanga-dark">Rende mais para:</span>{' '}
              {park.bestFor}
            </p>
            {/* Local, duração e época são a mesma classe de informação — na
                mesma linha. Jogado na borda oposta do container, o local
                abria um vazio no meio em telas largas. */}
            <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-zinc-600">
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="size-4 text-anhanga-actionDark" aria-hidden="true" />
                {park.city}, {park.state}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Clock className="size-4 text-anhanga-actionDark" aria-hidden="true" />
                {park.days}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CalendarClock className="size-4 text-anhanga-actionDark" aria-hidden="true" />
                {park.when}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  </section>
);

export const ComparisonSection: React.FC = () => (
  <section className="bg-white py-16 sm:py-24">
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
        <div key={park.slug}>
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
        </div>
      ))}
    </div>
  </section>
);

export const ParquesCta: React.FC<SectionProps> = ({ onCtaClick, whatsappUrl }) => (
  <section className="bg-white py-16 sm:py-24">
    <div className="container mx-auto px-6 max-w-3xl text-center">
      <h2 className="font-display text-3xl sm:text-4xl font-extrabold leading-tight text-anhanga-dark">
        Ainda em dúvida entre dois?
      </h2>
      <p className="mt-4 text-lg leading-relaxed text-zinc-700">
        Conte a idade das crianças e quantos dias você tem. A gente responde qual dos
        cinco faz sentido — mesmo que a resposta seja esperar o ano que vem.
      </p>
      <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
        <button
          type="button"
          onClick={onCtaClick}
          className="inline-flex min-h-[44px] w-full items-center justify-center rounded-2xl bg-anhanga-yellow px-8 py-4 font-display font-bold text-anhanga-dark shadow-hard transition-all duration-150 ease-out hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] active:translate-x-1 active:translate-y-1 active:shadow-none motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-anhanga-action sm:w-auto"
        >
          Falar com um consultor
        </button>
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-[44px] w-full items-center justify-center rounded-lg px-6 py-3 font-semibold text-zinc-600 transition-colors hover:text-anhanga-action focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-anhanga-action sm:w-auto"
        >
          Prefiro WhatsApp
        </a>
      </div>
    </div>
  </section>
);

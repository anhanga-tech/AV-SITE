import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, MapPin, BadgeCheck, CalendarClock, Clock, HardHat, ShieldCheck, Sparkles } from 'lucide-react';
import {
  BOOKABLE_PARKS,
  CREDENTIALED_PARKS,
  HERO_PARK_SLUGS,
  PACKAGE_PARKS,
  PARKS,
  UPCOMING_PARKS,
  type Park,
} from './constants';
import { openParquesContact } from './contact';
import { CacauWaitlist } from './CacauWaitlist';
import { ParkPhoto } from './ParkPhoto';

/*
  Hierarquia visual deliberada (DESIGN.md proíbe cards idênticos em grade):
  - credenciados: dois blocos grandes, tipografia headline, o único par onde
    a Anhangá emite ingresso oficial;
  - aquáticos: lista horizontal compacta, peso menor;
  - Cacau Park: faixa escura de antecipação, sem CTA de venda — só a lista
    de espera (não há o que vender).
  O Âmbar Vivo aparece uma única vez na página inteira: no CTA final. Os CTAs
  do hero e dos cards ficam em escuro/contorno/link para não competir com ele.
*/

interface SectionProps {
  onCtaClick: () => void;
  whatsappUrl: string;
}

const HERO_PARKS = HERO_PARK_SLUGS.map((slug) => PARKS.find((park) => park.slug === slug)).filter(
  (park): park is Park => Boolean(park),
);

// pt-32 é o padrão das páginas do MainSiteShell (BlogList, SiteMap): o Header
// é `fixed` com 72px, e qualquer coisa acima disso some atrás dele no topo da
// página — o eyebrow ficava coberto em mobile.
export const ParquesHero: React.FC = () => (
  <section className="bg-anhanga-light pt-32 pb-16 sm:pt-36 sm:pb-24">
    {/* max-w-5xl em todas as seções: larguras diferentes deslocam o eixo
        esquerdo entre uma seção e outra, e a coluna "pula" ao rolar. */}
    <div className="container mx-auto grid max-w-5xl items-center gap-10 px-6 lg:grid-cols-[1.15fr_1fr]">
      <div>
        <p className="font-display text-xs font-black uppercase tracking-[0.1em] text-anhanga-actionDark">
          Parques do Brasil
        </p>
        <h1 className="mt-4 font-display text-4xl sm:text-5xl font-black leading-[0.95] tracking-tight text-anhanga-dark">
          Cinco parques, e só um serve para a sua família
        </h1>
        <p className="mt-6 text-lg leading-relaxed text-zinc-700 max-w-[65ch]">
          Beto Carrero, Hopi Hari, Thermas dos Laranjais, Beach Park e Hot Park resolvem
          problemas diferentes. A idade dos seus filhos, quantos dias você tem e a época do
          ano importam mais do que qualquer ranking. Abaixo está o que separa um do outro —
          e onde a gente emite ingresso oficial.
        </p>
        {/* Quem já chega decidido não precisa rolar seis seções até o CTA final. */}
        <button
          type="button"
          onClick={() => openParquesContact()}
          className="mt-8 inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-anhanga-dark px-6 py-3 font-semibold text-white transition-transform duration-150 ease-out hover:-translate-y-0.5 motion-reduce:transition-none motion-reduce:hover:translate-y-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-anhanga-action sm:w-auto"
        >
          Quero ajuda para escolher
          <ArrowRight className="size-4" aria-hidden="true" />
        </button>
      </div>

      {/* Mosaico: a página pede para escolher entre parques sem mostrar nenhum.
          Fica depois do CTA no mobile, para não empurrar o botão para baixo. */}
      <div className="grid h-56 grid-cols-2 grid-rows-2 gap-2 sm:h-80 lg:h-[26rem]">
        {HERO_PARKS.map((park, index) => (
          <ParkPhoto
            key={park.slug}
            park={park}
            showName
            eager
            className={`rounded-2xl ${index === 0 ? 'row-span-2' : ''}`}
          />
        ))}
      </div>
    </div>
  </section>
);

// O nome do parque vai em sr-only: na lista, cinco botões "Pedir orçamento"
// idênticos seriam indistinguíveis para leitor de tela.
const ParkQuoteLabel: React.FC<{ park: Park }> = ({ park }) => (
  <>
    Pedir orçamento<span className="sr-only"> do {park.name}</span>
  </>
);

const CredentialedPark: React.FC<{ park: Park; index: number }> = ({ park, index }) => (
  <article
    className={`overflow-hidden rounded-2xl bg-white shadow-float ${
      index === 0 ? 'lg:col-span-3' : 'lg:col-span-2'
    }`}
  >
    {/* Mesma altura nos dois cards, de propósito: com proporção fixa a foto do
        card largo ficaria mais alta e derrubaria o título dele. */}
    <ParkPhoto park={park} className="h-48 sm:h-56" />
    <div className="p-6 sm:p-8">
      {/* Badge e local em linhas próprias, não lado a lado: no card estreito o
          par quebrava e derrubava o título 20px abaixo do card vizinho, o que
          lê como acidente e não como a assimetria pretendida. */}
      <div className="flex flex-col items-start gap-2">
        {/* Selo cheio: é o diferencial real frente a OTA e operadora grande. */}
        <span className="inline-flex items-center gap-1.5 rounded-full bg-anhanga-darkBlue px-3 py-1 font-display text-xs font-black uppercase tracking-[0.1em] text-white/90">
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
        {/* No celular a tabela comparativa some; a época tem de estar aqui. */}
        <div>
          <dt className="font-display text-xs font-black uppercase tracking-[0.1em] text-zinc-500">
            Melhor época
          </dt>
          <dd className="mt-1.5 text-base leading-relaxed text-zinc-700">{park.when}</dd>
        </div>
      </dl>

      {/* Uma ação com peso de botão por card: o orçamento, que é o que gera
          lead aqui. A landing do parque fica como link de texto; com dois
          botões empilhados, quem chega pela primeira vez não sabia qual apertar. */}
      <div className="mt-7 flex flex-col items-start gap-2">
        <button
          type="button"
          onClick={() => openParquesContact(park)}
          className="inline-flex min-h-[44px] items-center rounded-xl bg-anhanga-dark px-6 py-3 font-semibold text-white transition-transform duration-150 ease-out hover:-translate-y-0.5 motion-reduce:transition-none motion-reduce:hover:translate-y-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-anhanga-action"
        >
          <ParkQuoteLabel park={park} />
        </button>
        {park.href ? (
          <Link
            to={park.href}
            className="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg font-semibold text-anhanga-action transition-colors hover:text-anhanga-actionDark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-anhanga-action"
          >
            Conhecer a página do {park.name}
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        ) : null}
      </div>
    </div>
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
      <p className="mt-4 inline-flex items-start gap-2 text-sm text-zinc-600">
        <ShieldCheck className="mt-0.5 size-4 shrink-0 text-anhanga-actionDark" aria-hidden="true" />
        <span>
          Agência registrada no Cadastur, o cadastro do Ministério do Turismo:{' '}
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
          <li key={park.slug} className="flex flex-col gap-5 py-7 first:pt-0 last:pb-0 sm:flex-row">
            <ParkPhoto park={park} className="h-36 w-full shrink-0 rounded-xl sm:h-32 sm:w-44" />
            <div className="min-w-0">
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
                {park.highlight ? (
                  <span className="inline-flex items-center gap-1.5 font-semibold text-anhanga-dark">
                    <Sparkles className="size-4 text-anhanga-actionDark" aria-hidden="true" />
                    {park.highlight}
                  </span>
                ) : null}
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
              {/* Peso de link, não de botão: a lista é a seção "menor" da página. */}
              <button
                type="button"
                onClick={() => openParquesContact(park)}
                className="mt-4 inline-flex min-h-[44px] items-center gap-1.5 rounded-lg font-semibold text-anhanga-action transition-colors hover:text-anhanga-actionDark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-anhanga-action"
              >
                <ParkQuoteLabel park={park} />
                <ArrowRight className="size-4" aria-hidden="true" />
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  </section>
);

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
          className="inline-flex min-h-[44px] w-full items-center justify-center rounded-2xl bg-anhanga-yellow px-8 py-4 font-display font-bold text-anhanga-dark shadow-hard transition-[transform,box-shadow] duration-150 ease-out hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] active:translate-x-1 active:translate-y-1 active:shadow-none motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-anhanga-action sm:w-auto"
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

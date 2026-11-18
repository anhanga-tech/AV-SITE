import React, { useId } from 'react';
import { ArrowRight, Baby, Backpack, Gamepad2, Users, type LucideIcon } from 'lucide-react';
import { BOOKABLE_PARKS } from './constants';
import { openParquesContact } from './contact';
import { useParquesProfile } from './ProfileContext';
import { AGE_OPTIONS, DAYS_OPTIONS, hasProfile, matchParks, toggleAge, toggleDays, type AgeGroup, type DaysBucket } from './profile';

/*
  O mecanismo do h1, com cara de jogo: peças grandes de contorno grosso e
  sombra dura que "afundam" quando escolhidas. Botões com aria-pressed (botões
  de alternância), não checkbox: a resposta é imediata e não há formulário.

  Exceção registrada à Regra do Âmbar (DESIGN.md): nesta página a peça
  escolhida fica amarela. É o feedback do jogo, não um CTA; o único CTA em
  Âmbar continua sendo o final.
*/

const AGE_ICON: Record<AgeGroup, LucideIcon> = {
  ate6: Baby,
  de7a12: Backpack,
  adolescentes: Gamepad2,
  soAdultos: Users,
};

// Número grande + palavra pequena; lido junto, o nome acessível é o próprio
// rótulo ("2 a 3 dias"), sem aria-label que divirja do texto visível.
const DAYS_PARTS: Record<DaysBucket, [string, string]> = {
  umDia: ['1', 'dia'],
  doisATres: ['2 a 3', 'dias'],
  quatroOuMais: ['4', 'dias ou mais'],
};

const TILE_BASE =
  'flex min-h-[44px] rounded-2xl border-2 border-anhanga-dark text-anhanga-dark transition-[transform,box-shadow,background-color] duration-150 ease-out motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-anhanga-action';
const TILE_ON = 'translate-x-0.5 translate-y-0.5 bg-anhanga-yellow shadow-[1px_1px_0px_0px_rgba(15,23,42,1)]';
const TILE_OFF = 'bg-white shadow-hard hover:-translate-y-0.5 motion-reduce:hover:translate-y-0';

export const ProfileSelector: React.FC = () => {
  const { profile, setProfile } = useParquesProfile();
  const agesLabelId = useId();
  const daysLabelId = useId();

  const chosen = hasProfile(profile);
  const matched = BOOKABLE_PARKS.filter((park) => matchParks(profile, [park.slug]).length > 0);

  return (
    <div className="relative rounded-[1.75rem] border-2 border-anhanga-dark bg-white p-5 shadow-hard-lg sm:p-7">
      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr] lg:gap-8">
        <div>
          <p id={agesLabelId} className="font-display text-xl font-extrabold text-anhanga-dark">
            Quem vai?
          </p>
          <div role="group" aria-labelledby={agesLabelId} className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-2">
            {AGE_OPTIONS.map((option) => {
              const pressed = profile.ages.includes(option.value);
              const Icon = AGE_ICON[option.value];
              return (
                <button
                  key={option.value}
                  type="button"
                  aria-pressed={pressed}
                  onClick={() => setProfile(toggleAge(profile, option.value))}
                  className={`${TILE_BASE} flex-col items-start gap-1.5 px-3 py-3 text-left sm:flex-row sm:items-center sm:gap-2 lg:flex-row ${pressed ? TILE_ON : TILE_OFF}`}
                >
                  <Icon className="size-5 shrink-0" strokeWidth={2.25} aria-hidden="true" />
                  <span className="min-w-0 break-words text-sm font-bold leading-tight">{option.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <p id={daysLabelId} className="font-display text-xl font-extrabold text-anhanga-dark">
            Quantos dias?
          </p>
          <div role="group" aria-labelledby={daysLabelId} className="mt-3 grid grid-cols-3 gap-3">
            {DAYS_OPTIONS.map((option) => {
              const pressed = profile.days === option.value;
              const [big, small] = DAYS_PARTS[option.value];
              return (
                <button
                  key={option.value}
                  type="button"
                  aria-pressed={pressed}
                  onClick={() => setProfile(toggleDays(profile, option.value))}
                  className={`${TILE_BASE} flex-col items-center justify-center px-1 py-3 text-center ${pressed ? TILE_ON : TILE_OFF}`}
                >
                  <span className="font-display text-2xl font-black leading-none">{big}</span>{' '}
                  <span className="mt-1 text-xs font-bold leading-tight">{small}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* aria-live: quem usa leitor de tela ouve a recomendação mudar a cada toque. */}
      <div aria-live="polite" className="mt-6 rounded-2xl border-2 border-dashed border-anhanga-dark/25 bg-anhanga-light px-4 py-3">
        {!chosen ? (
          <p className="text-sm font-medium leading-relaxed text-zinc-700">
            Toque nas peças e a gente mostra quais parques combinam com vocês.
          </p>
        ) : matched.length > 0 ? (
          <div className="flex flex-wrap items-center gap-x-3">
            <p className="font-display text-sm font-bold text-anhanga-dark">Combinam com a sua família:</p>
            <ul className="flex flex-wrap gap-x-4">
              {matched.map((park) => (
                <li key={park.slug}>
                  <a
                    href={`#parque-${park.slug}`}
                    className="inline-flex min-h-[44px] items-center font-semibold text-anhanga-actionInk underline underline-offset-2 hover:text-anhanga-actionDark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-anhanga-action"
                  >
                    {park.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="text-sm leading-relaxed text-zinc-700">
            Nenhum dos cinco encaixa direito nesse perfil. Conte pra gente: o consultor sugere a melhor saída, mesmo
            que seja outro destino.
          </p>
        )}
      </div>

      <button
        type="button"
        onClick={() => openParquesContact(undefined, profile)}
        className="mt-5 inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-anhanga-dark px-6 py-3 font-semibold text-white transition-transform duration-150 ease-out hover:-translate-y-0.5 motion-reduce:transition-none motion-reduce:hover:translate-y-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-anhanga-action sm:w-auto"
      >
        {chosen ? 'Pedir orçamento com esse perfil' : 'Quero ajuda para escolher'}
        <ArrowRight className="size-4" aria-hidden="true" />
      </button>
    </div>
  );
};

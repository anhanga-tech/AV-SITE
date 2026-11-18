import React, { useId } from 'react';
import { ArrowRight, Check } from 'lucide-react';
import { BOOKABLE_PARKS } from './constants';
import { openParquesContact } from './contact';
import { useParquesProfile } from './ProfileContext';
import { AGE_OPTIONS, DAYS_OPTIONS, hasProfile, matchParks, toggleAge, toggleDays } from './profile';

/*
  O mecanismo do h1. Chips com aria-pressed (botões de alternância), não
  checkbox: a resposta é imediata e não há formulário a enviar.

  Sem Âmbar aqui: ele é do CTA final (Regra do Âmbar). O botão do perfil usa o
  primário escuro, o mesmo peso dos cards.
*/

const CHIP_BASE =
  'inline-flex min-h-[44px] items-center gap-1.5 rounded-full border-2 px-4 py-2 text-sm font-semibold transition-colors duration-150 ease-out motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-anhanga-action';
const CHIP_ON = 'border-anhanga-darkBlue bg-anhanga-darkBlue text-white/90';
const CHIP_OFF = 'border-zinc-200 bg-white text-anhanga-dark hover:border-anhanga-action';

const Chip: React.FC<{ pressed: boolean; onClick: () => void; children: React.ReactNode }> = ({
  pressed,
  onClick,
  children,
}) => (
  <button type="button" aria-pressed={pressed} onClick={onClick} className={`${CHIP_BASE} ${pressed ? CHIP_ON : CHIP_OFF}`}>
    {pressed ? <Check className="size-4" aria-hidden="true" /> : null}
    {children}
  </button>
);

export const ProfileSelector: React.FC = () => {
  const { profile, setProfile } = useParquesProfile();
  const agesLabelId = useId();
  const daysLabelId = useId();

  const chosen = hasProfile(profile);
  const matched = BOOKABLE_PARKS.filter((park) => matchParks(profile, [park.slug]).length > 0);

  return (
    <div className="mt-8 rounded-2xl bg-white p-5 shadow-float sm:p-6">
      <p id={agesLabelId} className="font-display text-base font-bold text-anhanga-dark">
        Quem vai?
      </p>
      <div role="group" aria-labelledby={agesLabelId} className="mt-3 flex flex-wrap gap-2">
        {AGE_OPTIONS.map((option) => (
          <Chip
            key={option.value}
            pressed={profile.ages.includes(option.value)}
            onClick={() => setProfile(toggleAge(profile, option.value))}
          >
            {option.label}
          </Chip>
        ))}
      </div>

      <p id={daysLabelId} className="mt-5 font-display text-base font-bold text-anhanga-dark">
        Quantos dias vocês têm?
      </p>
      <div role="group" aria-labelledby={daysLabelId} className="mt-3 flex flex-wrap gap-2">
        {DAYS_OPTIONS.map((option) => (
          <Chip
            key={option.value}
            pressed={profile.days === option.value}
            onClick={() => setProfile(toggleDays(profile, option.value))}
          >
            {option.label}
          </Chip>
        ))}
      </div>

      {/* aria-live: quem usa leitor de tela ouve a recomendação mudar a cada toque. */}
      <div aria-live="polite" className="mt-5 border-t border-zinc-100 pt-5">
        {!chosen ? (
          <p className="text-sm leading-relaxed text-zinc-600">
            Toque nas opções e a gente mostra quais parques fazem sentido para vocês.
          </p>
        ) : matched.length > 0 ? (
          <div>
            <p className="font-display text-sm font-bold text-anhanga-dark">Combinam com a sua família:</p>
            <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
              {matched.map((park) => (
                <li key={park.slug}>
                  <a
                    href={`#parque-${park.slug}`}
                    className="inline-flex min-h-[44px] items-center gap-1 font-semibold text-anhanga-actionInk underline underline-offset-2 hover:text-anhanga-actionDark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-anhanga-action"
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

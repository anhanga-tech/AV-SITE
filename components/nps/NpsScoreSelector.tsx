const SCORES = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

const SCORE_LABELS: Record<number, string> = {
  0: 'Nada provável',
  5: 'Neutro',
  10: 'Extremamente provável',
};

export interface NpsScoreSelectorProps {
  score: number | null;
  onSelect: (score: number) => void;
}

export function NpsScoreSelector({ score, onSelect }: NpsScoreSelectorProps) {
  return (
    <fieldset className="mb-10">
      <legend className="block text-xs font-black uppercase tracking-[0.15em] mb-5 text-slate-400">
        De 0 a 10, o quanto você recomendaria a Anhangá Viagens para um amigo ou familiar?
      </legend>

      <div className="grid grid-cols-6 gap-2 sm:grid-cols-11 sm:gap-1.5">
        {SCORES.map((n) => {
          const selected = score === n;
          return (
            <button
              key={n}
              type="button"
              onClick={() => onSelect(n)}
              aria-pressed={selected}
              aria-label={`Nota ${n}${SCORE_LABELS[n] ? ` — ${SCORE_LABELS[n]}` : ''}`}
              className={[
                'relative flex items-center justify-center',
                'min-h-[48px] min-w-[48px] sm:min-h-[44px] sm:min-w-0',
                'rounded-xl text-sm font-bold',
                'border-2 transition-all duration-150 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none',
                'outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-anhanga-action',
                selected
                  ? 'bg-anhanga-action border-anhanga-action text-anhanga-dark scale-110 shadow-[0_0_16px_rgba(14,165,233,0.4)] motion-reduce:scale-100'
                  : 'bg-slate-800/60 border-slate-600/40 text-slate-300 hover:border-slate-400 hover:bg-slate-700/60 hover:text-white active:scale-95 motion-reduce:active:scale-100',
              ].join(' ')}
            >
              {n}
            </button>
          );
        })}
      </div>

      <div className="flex justify-between mt-3 text-[11px] font-medium tracking-wide text-slate-500">
        <span>Nada provável</span>
        <span>Extremamente provável</span>
      </div>
    </fieldset>
  );
}

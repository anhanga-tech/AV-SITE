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
    <fieldset className="mb-8">
      <legend className="nps-score-legend block text-xs font-bold uppercase mb-4 text-slate-400">
        De 0 a 10, o quanto você recomendaria a Anhangá Viagens para um amigo ou familiar?
      </legend>

      <div className="nps-score-grid">
        {SCORES.map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onSelect(n)}
            aria-pressed={score === n}
            aria-label={`Nota ${n}${SCORE_LABELS[n] ? ` — ${SCORE_LABELS[n]}` : ''}`}
            className="nps-score-btn"
          >
            {n}
          </button>
        ))}
      </div>

      <div className="flex justify-between mt-2 text-[#475569] text-xs">
        <span>Nada provável</span>
        <span>Extremamente provável</span>
      </div>
    </fieldset>
  );
}

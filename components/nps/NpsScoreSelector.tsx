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
      <legend className="block text-xs font-bold uppercase mb-4 tracking-[0.15em] text-slate-400">
        De 0 a 10, o quanto você recomendaria a Anhangá Viagens para um amigo ou familiar?
      </legend>

      <div className="nps-score-grid">
        {Array.from({ length: 11 }, (_, i) => (
          <button
            key={`score-${i}`}
            type="button"
            onClick={() => onSelect(i)}
            aria-pressed={score === i}
            aria-label={`Nota ${i}${SCORE_LABELS[i] ? ` — ${SCORE_LABELS[i]}` : ''}`}
            className="nps-score-btn"
          >
            {i}
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

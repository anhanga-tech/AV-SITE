const SCORE_LABELS: Record<number, string> = {
  0: 'Nada provável',
  5: 'Neutro',
  10: 'Extremamente provável',
};

export interface NpsScoreSelectorProps {
  score: number | null;
  hoveredScore: number | null;
  onSelect: (score: number) => void;
  onHover: (score: number | null) => void;
}

export function NpsScoreSelector({ score, hoveredScore, onSelect, onHover }: NpsScoreSelectorProps) {
  return (
    <fieldset className="mb-8">
      <legend
        className="block text-xs font-bold uppercase mb-4"
        style={{ letterSpacing: '0.15em', color: '#94a3b8' }}
      >
        De 0 a 10, o quanto você recomendaria a Anhangá Viagens para um amigo ou familiar?
      </legend>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(2.75rem, 1fr))', gap: '6px' }}>
        {Array.from({ length: 11 }, (_, i) => {
          const selected = score === i;
          const hovered = hoveredScore === i && !selected;
          return (
            <button
              key={`score-${i}`}
              type="button"
              onClick={() => onSelect(i)}
              onMouseEnter={() => onHover(i)}
              onMouseLeave={() => onHover(null)}
              aria-pressed={selected}
              aria-label={`Nota ${i}${SCORE_LABELS[i] ? ` — ${SCORE_LABELS[i]}` : ''}`}
              className="nps-score-btn"
              style={{
                width: '100%',
                aspectRatio: '1',
                borderRadius: '0.375rem',
                fontWeight: 800,
                fontSize: '0.875rem',
                cursor: 'pointer',
                transition: 'background 0.12s ease, color 0.12s ease, border-color 0.12s ease, box-shadow 0.12s ease, transform 0.12s ease',
                background: selected ? '#0056D2' : hovered ? '#263144' : '#1e293b',
                color: selected ? '#ffffff' : hovered ? '#e2e8f0' : '#64748b',
                border: selected ? '2px solid #0056D2' : hovered ? '2px solid #475569' : '2px solid #334155',
                boxShadow: selected ? '4px 4px 0 #003B8E' : hovered ? '3px 3px 0 rgba(0,0,0,0.25)' : '2px 2px 0 rgba(0,0,0,0.3)',
                transform: selected ? 'translate(-1px,-1px)' : hovered ? 'translate(-0.5px,-0.5px)' : 'none',
              }}
            >
              {i}
            </button>
          );
        })}
      </div>

      <div className="flex justify-between mt-2" style={{ color: '#475569', fontSize: '0.75rem' }}>
        <span>Nada provável</span>
        <span>Extremamente provável</span>
      </div>
    </fieldset>
  );
}

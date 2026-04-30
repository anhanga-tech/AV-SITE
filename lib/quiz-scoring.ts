// Plog psychocentricity model — P1+P2+P3+P4+P6 (P5/horizonte is BANT, excluded from score).
// Multi-select fields (P1/destino) use the rounded average of selected option scores.

export type ProfileKey =
    | 'escapista'
    | 'bon-vivant'
    | 'viajante-de-verdade'
    | 'desbravador'
    | 'nomade-de-alma';

export const NEUTRAL_SCORE = 3;

// Keys must match question IDs in QUIZ_QUESTIONS. Unknown option IDs fall back to NEUTRAL_SCORE.
export const SCORES: Record<string, Record<string, number>> = {
    destino: {
        'europa': 3, 'america-norte': 3, 'latam': 4,
        'caribe': 1, 'asia': 5, 'africa-oriente': 5, 'surpresa': 3,
    },
    cena: {
        'aventura': 5, 'familia': 2, 'luxo': 2,
        'microescapada': 3, 'natureza': 4, 'wellness': 1,
    },
    companhia: { 'solo': 5, 'familia': 1, 'parceiro': 3, 'variado': 3 },
    frustracao: {
        'sem-liberdade': 5, 'multidao': 4, 'hotel-ruim': 2,
        'genericas': 3, 'caro-demais': 2,
    },
    ritmo: { 'planejado': 1, 'semi-planejado': 3, 'quase-livre': 4, 'livre': 5 },
};

export function scoreField(fieldScores: Record<string, number>, selected: string[]): number {
    if (!selected.length) return 0;
    const total = selected.reduce((sum, id) => sum + (fieldScores[id] ?? NEUTRAL_SCORE), 0);
    return Math.round(total / selected.length);
}

export function matchProfile(answers: Record<string, string[]>): ProfileKey {
    const score = Object.keys(SCORES).reduce(
        (sum, field) => sum + scoreField(SCORES[field], answers[field] ?? []),
        0,
    );

    if (score <= 9)  return 'escapista';
    if (score <= 13) return 'bon-vivant';
    if (score <= 17) return 'viajante-de-verdade';
    if (score <= 21) return 'desbravador';
    return 'nomade-de-alma';
}

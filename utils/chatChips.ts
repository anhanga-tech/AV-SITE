const STRUCTURED_CHIPS_REGEX = /\[CHIPS:\s*([^\]]+)\]\s*$/i;

const CHIP_TRIGGERS: Array<{ patterns: string[]; chips: string[] }> = [
    {
        patterns: ['para onde', 'destino', 'sonha em ir'],
        chips: ['Nacional', 'América do Sul', 'Internacional'],
    },
    {
        patterns: ['tipo de viagem', 'estilo de viagem', 'que tipo'],
        chips: ['Lazer', 'Lua de Mel', 'Família', 'Aventura'],
    },
    {
        patterns: ['quantos adultos', 'quem vai', 'quantas pessoas'],
        chips: ['1', '2', '3', '4+'],
    },
    {
        patterns: ['crianças', 'vai com criança', 'tem criança'],
        chips: ['Sim', 'Não'],
    },
];

function normalizeText(value: string): string {
    return value
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase();
}

function parseChipOptions(raw: string): string[] {
    return raw
        .split('|')
        .map((item) => item.trim())
        .filter(Boolean)
        .slice(0, 6);
}

export function extractStructuredChips(text: string): string[] | null {
    if (typeof text !== 'string' || text.trim().length === 0) {
        return null;
    }

    const match = text.trim().match(STRUCTURED_CHIPS_REGEX);
    if (!match?.[1]) {
        return null;
    }

    const chips = parseChipOptions(match[1]);
    return chips.length > 0 ? chips : null;
}

export function stripChipsBlock(text: string): string {
    if (typeof text !== 'string' || text.trim().length === 0) {
        return '';
    }

    return text
        .replace(/\s*\[CHIPS:\s*[^\]]+\]/gi, '')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
}

function inferBudgetChips(normalizedText: string): string[] | null {
    const isBudgetPrompt =
        normalizedText.includes('orcamento') ||
        normalizedText.includes('investimento') ||
        normalizedText.includes('faixa') ||
        normalizedText.includes('budget');

    if (!isBudgetPrompt) return null;

    if (normalizedText.includes('internacional')) {
        return ['Até R$ 35 mil', 'R$ 35-60 mil', 'R$ 60-100 mil', 'R$ 100 mil+'];
    }

    if (normalizedText.includes('america do sul') || normalizedText.includes('america sul')) {
        return ['Até R$ 20 mil', 'R$ 20-35 mil', 'R$ 35-60 mil', 'R$ 60 mil+'];
    }

    return ['Até R$ 10 mil', 'R$ 10-20 mil', 'R$ 20-35 mil', 'R$ 35 mil+'];
}

export function inferFallbackChips(text: string): string[] {
    if (!text) return [];

    const normalizedText = normalizeText(text);

    for (const trigger of CHIP_TRIGGERS) {
        if (trigger.patterns.some((pattern) => normalizedText.includes(normalizeText(pattern)))) {
            return trigger.chips;
        }
    }

    const budgetChips = inferBudgetChips(normalizedText);
    if (budgetChips) {
        return budgetChips;
    }

    return [];
}

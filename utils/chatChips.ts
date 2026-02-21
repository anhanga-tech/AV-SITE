const STRUCTURED_CHIPS_REGEX = /\[CHIPS:\s*([^\]]+)\]\s*$/i;

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

export function inferFallbackChips(text: string): string[] {
    if (!text) return [];

    const normalized = normalizeText(text);

    const asksTripScope =
        normalized.includes('nacional') &&
        normalized.includes('internacional') &&
        (normalized.includes('america do sul') || normalized.includes('america sul'));

    if (asksTripScope) {
        return ['Nacional', 'América do Sul', 'Internacional'];
    }

    const asksTripType =
        normalized.includes('tipo de viagem') ||
        normalized.includes('estilo da viagem') ||
        normalized.includes('perfil da viagem') ||
        (normalized.includes('lazer') && normalized.includes('lua de mel'));

    if (asksTripType) {
        return ['Lazer', 'Lua de Mel', 'Família', 'Aventura'];
    }

    const asksAdults =
        normalized.includes('quantos adultos') ||
        normalized.includes('qtd de adultos') ||
        normalized.includes('numero de adultos');

    if (asksAdults) {
        return ['1 adulto', '2 adultos', '3 adultos', '4+ adultos'];
    }

    const asksChildren =
        normalized.includes('crianca') ||
        normalized.includes('criancas') ||
        normalized.includes('viajam com criancas');

    if (asksChildren) {
        return ['Sem crianças', '1 criança', '2 crianças', '3+ crianças'];
    }

    const asksBudget =
        normalized.includes('orcamento') ||
        normalized.includes('investimento') ||
        normalized.includes('faixa de valor') ||
        normalized.includes('faixa de preco') ||
        normalized.includes('budget');

    if (asksBudget) {
        if (normalized.includes('internacional')) {
            return ['Até R$ 35 mil', 'R$ 35-60 mil', 'R$ 60-100 mil', 'R$ 100 mil+'];
        }

        if (normalized.includes('america do sul') || normalized.includes('america sul')) {
            return ['Até R$ 20 mil', 'R$ 20-35 mil', 'R$ 35-60 mil', 'R$ 60 mil+'];
        }

        return ['Até R$ 10 mil', 'R$ 10-20 mil', 'R$ 20-35 mil', 'R$ 35 mil+'];
    }

    return [];
}

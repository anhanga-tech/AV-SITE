import type { BudgetToolArgs } from './types';

export interface GenerateHandoff {
    origin: string;
    destination: string;
    dates: string;
    baggagePreference?: string;
    bantSummary: string;
    iataCode?: string;
    source: 'tool' | 'repair';
}

function cleanOptional(value?: string): string {
    if (typeof value !== 'string') return '';
    return value.trim();
}

function formatLocation(city?: string, region?: string, fallback = 'A definir'): string {
    const cityText = cleanOptional(city);
    const regionText = cleanOptional(region);

    if (!cityText && !regionText) return fallback;
    if (!regionText) return cityText || fallback;
    if (!cityText) return regionText;

    return `${cityText}, ${regionText}`;
}

function buildBantSummary(args: Pick<BudgetToolArgs, 'budget_range' | 'need_summary' | 'decision_role' | 'timeline_window' | 'visa_status'>): string {
    const budgetText = cleanOptional(args.budget_range) || 'A definir';
    const needText = cleanOptional(args.need_summary) || 'Não informado';
    const decisionRoleText = cleanOptional(args.decision_role) || 'Não informado';
    const timelineText = cleanOptional(args.timeline_window) || 'Não informado';
    const visaNote = args.visa_status === 'pendente' ? ' | Visto EUA: Pendente' : '';

    return `Need: ${needText} | Authority: ${decisionRoleText} | Budget: ${budgetText} | Timeline: ${timelineText}${visaNote}`;
}

export function buildGenerateHandoff(args: BudgetToolArgs, source: GenerateHandoff['source']): GenerateHandoff {
    const origin = formatLocation(args.origin_city, args.origin_region, 'Origem a definir');
    const destination = formatLocation(
        args.destination_city,
        args.destination_region,
        cleanOptional(args.destination) || 'Destino a definir',
    );
    const dates = cleanOptional(args.dates) || 'A definir';
    const baggagePreference = cleanOptional(args.baggage_preference);
    const iataCode = cleanOptional(args.iata_code).substring(0, 3).toUpperCase();

    return {
        origin,
        destination,
        dates,
        baggagePreference: baggagePreference || undefined,
        bantSummary: buildBantSummary(args),
        iataCode: iataCode || undefined,
        source,
    };
}

import type { TripScope, SafetyBlock, BudgetToolArgs, BudgetValidationResult } from './types.ts';
import {
    CITY_FALLBACKS,
    BUDGET_FALLBACKS,
    BUDGET_TAXONOMY,
    SOUTH_AMERICA_COUNTRIES,
    BLOCKED_DESTINATIONS,
    TRIP_SCOPES
} from './constants.ts';
import { normalizeText, normalizeLabel, hasAliasMatch } from './utils.ts';
import { cleanString } from '../lead-logic.ts';

export function normalizeAdults(value: unknown): number | undefined {
    const parsed = typeof value === 'number' ? value : Number.parseInt(String(value ?? ''), 10);
    if (!Number.isInteger(parsed) || parsed <= 0) return undefined;
    return parsed;
}

export function normalizeChildAges(value: unknown): number[] {
    if (!Array.isArray(value)) return [];

    return value
        .map((age) => (typeof age === 'number' ? age : Number.parseInt(String(age), 10)))
        .filter((age) => Number.isInteger(age) && age >= 0);
}

export function isCityValueAcceptable(value?: string): boolean {
    if (!value) return false;

    const normalized = normalizeText(value);

    if (CITY_FALLBACKS.has(normalized)) return true;
    if (normalized.length < 2) return false;

    return /[a-z]/i.test(normalized);
}

export function normalizeTripScope(value: unknown): TripScope | undefined {
    if (typeof value !== 'string') return undefined;

    const normalized = normalizeText(value)
        .replace(/\s+/g, '_')
        .replace('-', '_');

    if (normalized === 'national' || normalized === 'nacional') return 'national';
    if (normalized === 'south_america' || normalized === 'america_do_sul' || normalized === 'america_sul') return 'south_america';
    if (normalized === 'international' || normalized === 'internacional') return 'international';

    return undefined;
}

export function inferTripScope(destinationText: string, originRegion: string): TripScope | undefined {
    const destinationNorm = normalizeText(destinationText);
    const originNorm = normalizeText(originRegion);

    const destinationIsBrazil = destinationNorm.includes('brasil') || destinationNorm.includes('brazil');
    const originIsBrazil = originNorm.includes('brasil') || originNorm.includes('brazil');

    if (destinationIsBrazil) {
        return originIsBrazil ? 'national' : 'international';
    }

    const destinationInSouthAmerica = SOUTH_AMERICA_COUNTRIES.some((country) => destinationNorm.includes(country));
    if (destinationInSouthAmerica) return 'south_america';

    if (destinationNorm.length > 0) return 'international';

    return undefined;
}

export function normalizeBudgetRange(scope: TripScope, value?: string): string {
    if (!value) return 'a definir';

    const normalized = normalizeText(value);
    if (BUDGET_FALLBACKS.has(normalized)) return 'a definir';

    const allowedValues = BUDGET_TAXONOMY[scope];
    const matched = allowedValues.find((budget) => normalizeLabel(budget) === normalizeLabel(value));
    return matched || 'a definir';
}

export function detectBlockedDestination(destinationText: string): SafetyBlock | null {
    const normalized = normalizeText(destinationText);
    if (!normalized) return null;

    const isEquadorCosta =
        (normalized.includes('equador') || normalized.includes('ecuador')) &&
        (normalized.includes('guayaquil') || normalized.includes('costa'));

    if (isEquadorCosta) {
        return {
            category: 'instability',
            country: 'Equador (Costa/Guayaquil)',
        };
    }

    for (const rule of BLOCKED_DESTINATIONS) {
        const hit = rule.aliases.some((alias) => hasAliasMatch(normalized, alias));
        if (hit) {
            return {
                category: rule.category,
                country: rule.country,
            };
        }
    }

    return null;
}

export function buildSafetyMessage(block: SafetyBlock): string {
    if (block.category === 'war') {
        return `No momento, a Anhangá não opera roteiros para ${block.country} por alertas de segurança e conflitos ativos. Nossa prioridade é sua integridade. Se quiser, te sugiro alternativas seguras com perfil parecido.`;
    }

    if (block.category === 'sanctions') {
        return `No momento, não recomendamos ${block.country} por restrições operacionais relevantes (pagamentos, voos e infraestrutura). Posso te sugerir destinos equivalentes com melhor previsibilidade.`;
    }

    return `No momento, recomendamos cautela para ${block.country} devido à instabilidade local. Posso te apresentar alternativas incríveis com melhor segurança para sua viagem.`;
}

export function buildRefinementMessage(missing: string[]): string {
    const labelMap: Record<string, string> = {
        origin_city: 'cidade de origem (ex: São Paulo/SP)',
        destination_city: 'cidade de destino (ex: Paris, França)',
        dates: 'período da viagem (ou "a definir")',
        adults: 'quantidade de adultos',
        trip_scope: 'escopo da viagem (nacional, América do Sul ou internacional)'
    };

    const uniqueMissing = Array.from(new Set(missing));
    const missingLabels = uniqueMissing.map((field) => labelMap[field] || field);

    return `Para montar seu orçamento com precisão, me confirme: ${missingLabels.join(', ')}. Se ainda não souber algum ponto, pode responder "a definir".`;
}

export function validateBudgetToolArgs(rawArgs: unknown): BudgetValidationResult {
    if (!rawArgs || typeof rawArgs !== 'object') {
        return { valid: false, missing: ['destination_city', 'origin_city', 'dates', 'adults'] };
    }

    const raw = rawArgs as BudgetToolArgs;

    const destinationCity = cleanString(raw.destination_city);
    const destinationRegion = cleanString(raw.destination_region);
    const originCity = cleanString(raw.origin_city);
    const providedOriginRegion = cleanString(raw.origin_region);

    const destination = cleanString(raw.destination) || [destinationCity, destinationRegion].filter(Boolean).join(', ');
    const dates = cleanString(raw.dates);
    const interests = cleanString(raw.interests) || 'Geral';
    const adults = normalizeAdults(raw.adults);
    const childAges = normalizeChildAges(raw.child_ages);

    const originRegion = providedOriginRegion || 'Brasil';
    const assumedOriginBr = !providedOriginRegion;

    const destinationReference = [destination, destinationCity, destinationRegion].filter(Boolean).join(' ');
    const safetyBlock = detectBlockedDestination(destinationReference);
    if (safetyBlock) {
        return {
            valid: false,
            missing: [],
            safetyBlock,
        };
    }

    const missing: string[] = [];

    if (!destination) missing.push('destination_city');
    if (!isCityValueAcceptable(originCity)) missing.push('origin_city');
    if (!isCityValueAcceptable(destinationCity)) missing.push('destination_city');
    if (!dates) missing.push('dates');
    if (!adults) missing.push('adults');

    let tripScope = normalizeTripScope(raw.trip_scope);
    if (!tripScope && destinationReference) {
        tripScope = inferTripScope(destinationReference, originRegion);
    }

    if (!tripScope || !TRIP_SCOPES.has(tripScope)) {
        missing.push('trip_scope');
    }

    if (missing.length > 0) {
        return {
            valid: false,
            missing,
        };
    }

    const normalizedArgs: BudgetToolArgs = {
        destination,
        dates,
        adults,
        child_ages: childAges,
        interests,
        origin_city: originCity,
        origin_region: originRegion,
        destination_city: destinationCity,
        destination_region: destinationRegion || '',
        trip_scope: tripScope,
        budget_range: normalizeBudgetRange(tripScope, cleanString(raw.budget_range)),
        decision_role: cleanString(raw.decision_role) || 'não informado',
        need_summary: cleanString(raw.need_summary) || 'não informado',
        timeline_window: cleanString(raw.timeline_window) || 'não informado',
        baggage_preference: cleanString(raw.baggage_preference) || '',
        assumed_origin_br: assumedOriginBr,
        iata_code: cleanString(raw.iata_code)?.substring(0, 3).toUpperCase() || '',
    };

    return {
        valid: true,
        missing: [],
        normalizedArgs,
    };
}

import type { TripScope, SafetyBlock, BudgetToolArgs, BudgetValidationResult } from './types';
import {
    CITY_FALLBACKS,
    BUDGET_FALLBACKS,
    BUDGET_TAXONOMY,
    SOUTH_AMERICA_COUNTRIES,
    BLOCKED_DESTINATIONS,
    TRIP_SCOPES
} from './constants';
import { normalizeText, normalizeLabel, hasAliasMatch } from './utils';
import { cleanString } from '../lead-logic';

export function normalizeAdults(value: unknown): number | undefined {
    const parsed = typeof value === 'number' ? value : Number.parseInt(String(value ?? ''), 10);
    if (!Number.isInteger(parsed) || parsed <= 0) return undefined;
    return parsed;
}

export function normalizeChildAges(value: unknown): number[] {
    if (!Array.isArray(value)) return [];

    return value.flatMap((age) => {
        const n = typeof age === 'number' ? age : Number.parseInt(String(age), 10);
        return Number.isInteger(n) && n >= 0 ? [n] : [];
    });
}

const LINKY_PATTERN = /\[[^\]]*\]\([^)]*\)|https?:\/\/|wa\.me|\bwww\./i;

function isPlainTextLocation(value: string): boolean {
    return value.length > 0 && !LINKY_PATTERN.test(value);
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
        trip_scope: 'escopo da viagem (nacional, América do Sul ou internacional)',
        baggage_preference: 'preferência de bagagem (mala de mão ou bagagem despachada)',
    };

    const uniqueMissing = Array.from(new Set(missing));
    const missingLabels = uniqueMissing.map((field) => labelMap[field] || field);

    return `Para montar seu orçamento com precisão, me confirme: ${missingLabels.join(', ')}. Se ainda não souber algum ponto, pode responder "a definir".`;
}

function getRawBudgetArgs(rawArgs: unknown): BudgetToolArgs | null {
    if (!rawArgs || typeof rawArgs !== 'object') return null;
    return rawArgs as BudgetToolArgs;
}

function buildInvalidBudgetResult(missing: string[], safetyBlock?: SafetyBlock): BudgetValidationResult {
    return {
        valid: false,
        missing,
        safetyBlock,
    };
}

function rejectLinkyLocation(value: string): string {
    return isPlainTextLocation(value) ? value : '';
}

function sanitizeBudgetFields(raw: BudgetToolArgs) {
    const destinationCity = rejectLinkyLocation(cleanString(raw.destination_city));
    const destinationRegion = rejectLinkyLocation(cleanString(raw.destination_region));
    const originCity = rejectLinkyLocation(cleanString(raw.origin_city));
    const providedOriginRegion = rejectLinkyLocation(cleanString(raw.origin_region));
    const rawDestination = rejectLinkyLocation(cleanString(raw.destination));
    const destination = rawDestination || [destinationCity, destinationRegion].filter(Boolean).join(', ');

    return {
        destination,
        dates: cleanString(raw.dates),
        interests: cleanString(raw.interests) || 'Geral',
        adults: normalizeAdults(raw.adults),
        childAges: normalizeChildAges(raw.child_ages),
        originCity,
        destinationCity,
        destinationRegion,
        originRegion: providedOriginRegion || 'Brasil',
        assumedOriginBr: !providedOriginRegion,
        budgetRange: cleanString(raw.budget_range),
        decisionRole: cleanString(raw.decision_role) || 'não informado',
        needSummary: cleanString(raw.need_summary) || 'não informado',
        timelineWindow: cleanString(raw.timeline_window) || 'não informado',
        baggagePreference: cleanString(raw.baggage_preference) || '',
        iataCode: cleanString(raw.iata_code)?.substring(0, 3).toUpperCase() || '',
        visaStatus: cleanString(raw.visa_status) || '',
    };
}

function collectMissingBudgetFields(fields: {
    destination: string;
    destinationCity: string;
    originCity: string;
    dates: string;
    adults?: number;
    tripScope?: TripScope;
    baggagePreference: string;
}): string[] {
    const missing: string[] = [];

    if (!fields.destination) missing.push('destination_city');
    if (!isCityValueAcceptable(fields.originCity)) missing.push('origin_city');
    if (!isCityValueAcceptable(fields.destinationCity)) missing.push('destination_city');
    if (!fields.dates) missing.push('dates');
    if (!fields.adults) missing.push('adults');
    if (!fields.tripScope || !TRIP_SCOPES.has(fields.tripScope)) missing.push('trip_scope');
    if ((fields.tripScope === 'international' || fields.tripScope === 'south_america') && !fields.baggagePreference) {
        missing.push('baggage_preference');
    }

    return missing;
}

function resolveBudgetTripScope(rawTripScope: unknown, destinationReference: string, originRegion: string): TripScope | undefined {
    const directScope = normalizeTripScope(rawTripScope);
    if (directScope) return directScope;
    if (!destinationReference) return undefined;
    return inferTripScope(destinationReference, originRegion);
}

function buildNormalizedBudgetArgs(
    fields: ReturnType<typeof sanitizeBudgetFields>,
    tripScope: TripScope,
): BudgetToolArgs {
    return {
        destination: fields.destination,
        dates: fields.dates,
        adults: fields.adults,
        child_ages: fields.childAges,
        interests: fields.interests,
        origin_city: fields.originCity,
        origin_region: fields.originRegion,
        destination_city: fields.destinationCity,
        destination_region: fields.destinationRegion || '',
        trip_scope: tripScope,
        budget_range: normalizeBudgetRange(tripScope, fields.budgetRange),
        decision_role: fields.decisionRole,
        need_summary: fields.needSummary,
        timeline_window: fields.timelineWindow,
        baggage_preference: fields.baggagePreference,
        assumed_origin_br: fields.assumedOriginBr,
        iata_code: fields.iataCode,
        visa_status: fields.visaStatus || undefined,
    };
}

export function validateBudgetToolArgs(rawArgs: unknown): BudgetValidationResult {
    const raw = getRawBudgetArgs(rawArgs);
    if (!raw) {
        return buildInvalidBudgetResult(['destination_city', 'origin_city', 'dates', 'adults']);
    }

    const fields = sanitizeBudgetFields(raw);
    const destinationReference = [fields.destination, fields.destinationCity, fields.destinationRegion].filter(Boolean).join(' ');
    const safetyBlock = detectBlockedDestination(destinationReference);
    if (safetyBlock) {
        return buildInvalidBudgetResult([], safetyBlock);
    }

    const tripScope = resolveBudgetTripScope(raw.trip_scope, destinationReference, fields.originRegion);
    const missing = collectMissingBudgetFields({
        destination: fields.destination,
        destinationCity: fields.destinationCity,
        originCity: fields.originCity,
        dates: fields.dates,
        adults: fields.adults,
        tripScope,
        baggagePreference: fields.baggagePreference,
    });
    if (missing.length > 0) {
        return buildInvalidBudgetResult(missing);
    }

    const normalizedArgs = buildNormalizedBudgetArgs(fields, tripScope as TripScope);

    return {
        valid: true,
        missing: [],
        normalizedArgs,
    };
}

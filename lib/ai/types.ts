export type TripScope = 'national' | 'south_america' | 'international';

export type SafetyCategory = 'war' | 'sanctions' | 'instability';

export interface SafetyBlock {
    category: SafetyCategory;
    country: string;
}

export interface BudgetToolArgs {
    destination?: string;
    dates?: string;
    adults?: number;
    child_ages?: number[];
    interests?: string;
    origin_city?: string;
    origin_region?: string;
    destination_city?: string;
    destination_region?: string;
    trip_scope?: string;
    budget_range?: string;
    decision_role?: string;
    need_summary?: string;
    timeline_window?: string;
    baggage_preference?: string;
    assumed_origin_br?: boolean;
    iata_code?: string;
}

export interface BudgetValidationResult {
    valid: boolean;
    missing: string[];
    normalizedArgs?: BudgetToolArgs;
    safetyBlock?: SafetyBlock;
}

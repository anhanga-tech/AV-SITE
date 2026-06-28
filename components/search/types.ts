import type { PRE_NORMALIZED_DB, TRIP_OPTIONS, BUDGET_TIERS } from '../../data/destinations';

export type DestinationOption = typeof PRE_NORMALIZED_DB[number];
export type TripOption = typeof TRIP_OPTIONS[number];
export type BudgetTier = typeof BUDGET_TIERS[number];

// The five panels are mutually exclusive — only one can be open at a time —
// so a single discriminated value models the UI state instead of five booleans.
export type OpenPanel = 'dest' | 'calendar' | 'guests' | 'trip' | 'budget' | null;

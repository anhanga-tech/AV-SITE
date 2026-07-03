import { MIDDLE_EAST_COUNTRIES } from '../../utils/constants';
import type { TripScope, SafetyCategory } from './types';

export const DEFAULT_GEMINI_MODEL = 'gemini-3.1-flash-lite';

export const TRIP_SCOPES = new Set<TripScope>(['national', 'south_america', 'international']);

export const CITY_FALLBACKS = new Set([
    'a definir',
    'a confirmar',
    'nao informado',
    'não informado',
    'nao sei',
    'não sei',
    'indefinido'
]);

export const BUDGET_FALLBACKS = new Set([
    'a definir',
    'nao informado',
    'não informado',
    'nao sei',
    'não sei',
    'indefinido'
]);

export const BUDGET_TAXONOMY: Record<TripScope, string[]> = {
    national: ['até R$ 1,5 mil', 'R$ 1,5-3 mil', 'R$ 3-5 mil', 'R$ 5 mil+'],
    south_america: ['até R$ 3 mil', 'R$ 3-6 mil', 'R$ 6-10 mil', 'R$ 10 mil+'],
    international: ['até R$ 4 mil', 'R$ 4-8 mil', 'R$ 8-14 mil', 'R$ 14 mil+'],
};

export const SOUTH_AMERICA_COUNTRIES = [
    'argentina',
    'bolivia',
    'brasil',
    'brazil',
    'chile',
    'colombia',
    'equador',
    'ecuador',
    'guiana',
    'guyana',
    'paraguai',
    'paraguay',
    'peru',
    'suriname',
    'uruguai',
    'uruguay',
    'venezuela'
];

export const BLOCKED_DESTINATIONS: Array<{ category: SafetyCategory; country: string; aliases: string[] }> = [
    // Middle East Blocklist (per policy #186)
    ...MIDDLE_EAST_COUNTRIES.map(c => ({
        category: 'war' as SafetyCategory,
        country: c.country,
        aliases: c.aliases
    })),
    // Other blocked regions — aliases include major cities/endonyms so a city-only
    // destination (ex: "Moscou") still triggers the block (issue #1022)
    { category: 'war', country: 'Ucrânia', aliases: ['ucrania', 'ukraine', 'kiev', 'kyiv', 'odessa', 'odesa', 'lviv', 'kharkiv', 'kharkov', 'dnipro'] },
    { category: 'war', country: 'Sudão', aliases: ['sudao', 'sudan', 'cartum', 'khartoum'] },
    { category: 'war', country: 'Afeganistão', aliases: ['afeganistao', 'afghanistan', 'cabul', 'kabul'] },
    { category: 'sanctions', country: 'Rússia', aliases: ['russia', 'moscou', 'moscow', 'moscovo', 'sao petersburgo', 'saint petersburg', 'st petersburg', 'st. petersburg', 'san petersburgo', 'sochi'] },
    { category: 'sanctions', country: 'Bielorrússia', aliases: ['bielorrussia', 'belarus', 'minsk'] },
    { category: 'sanctions', country: 'Coreia do Norte', aliases: ['coreia do norte', 'north korea', 'pyongyang', 'pionguiangue'] },
    { category: 'sanctions', country: 'Venezuela', aliases: ['venezuela', 'caracas', 'maracaibo', 'margarita', 'isla margarita'] },
    { category: 'sanctions', country: 'Cuba', aliases: ['cuba', 'havana', 'habana', 'varadero'] },
    { category: 'instability', country: 'Haiti', aliases: ['haiti', 'porto principe', 'port-au-prince', 'port au prince'] },
    { category: 'instability', country: 'Mianmar', aliases: ['mianmar', 'myanmar', 'birmania', 'burma', 'yangon', 'rangum', 'rangoon', 'naypyidaw'] },
    { category: 'instability', country: 'Líbia', aliases: ['libia', 'libya', 'tripoli'] },
    { category: 'instability', country: 'Somália', aliases: ['somalia', 'mogadiscio', 'mogadishu', 'somaliland', 'somalilandia'] },
];

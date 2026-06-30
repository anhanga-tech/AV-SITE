/**
 * Maps a travel destination to Odoo `res.partner.category` tags under the parent
 * "Destino de Interesse" (id 2). Two intake shapes feed this:
 *  - Quiz: structured answer ids (`europa`, `america-norte`, …) → direct lookup.
 *  - Chatbot/contato: free text ("Orlando", "Lisboa") → keyword heuristic.
 *
 * Unrecognized destinations return no tag (the raw text still lands in the
 * crm.lead description), so a miss degrades gracefully instead of mis-tagging.
 */

// res.partner.category record ids (contract §, validated against the instance).
export const REGION_TAG = {
    europa: 3,
    asia: 4,
    americaLatina: 5,
    americaNorte: 6,
    oceania: 7,
    brasil: 8,
    africaOriente: 9,
    caribe: 10,
    cruzeiros: 11,
    abertoSurpresa: 12,
} as const;

export type RegionTagId = (typeof REGION_TAG)[keyof typeof REGION_TAG];

// Quiz `destino` answer ids (data/quiz.ts) → region tag. The quiz has no Brasil,
// Oceania or Cruzeiros options; those only arise from free text.
const QUIZ_DESTINO_TO_TAG: Record<string, RegionTagId> = {
    'europa': REGION_TAG.europa,
    'america-norte': REGION_TAG.americaNorte,
    'latam': REGION_TAG.americaLatina,
    'caribe': REGION_TAG.caribe,
    'asia': REGION_TAG.asia,
    'africa-oriente': REGION_TAG.africaOriente,
    'surpresa': REGION_TAG.abertoSurpresa,
};

// Free-text keywords per region, normalized (lowercase, no diacritics). Matched
// on word boundaries so short tokens (eua) don't hit inside longer words. Order
// is irrelevant: all matching regions are returned, deduped.
const REGION_KEYWORDS: Array<{ tag: RegionTagId; keywords: string[] }> = [
    {
        tag: REGION_TAG.cruzeiros,
        keywords: ['cruzeiro', 'cruzeiros', 'navio'],
    },
    {
        tag: REGION_TAG.brasil,
        keywords: [
            'brasil', 'rio de janeiro', 'sao paulo', 'nordeste', 'bahia', 'salvador',
            'fernando de noronha', 'noronha', 'gramado', 'florianopolis', 'fortaleza',
            'recife', 'natal', 'maceio', 'jericoacoara', 'porto de galinhas',
            'foz do iguacu', 'amazonia', 'pantanal', 'chapada', 'bonito', 'buzios',
            'paraty', 'ilha grande', 'maragogi', 'lencois',
        ],
    },
    {
        tag: REGION_TAG.americaNorte,
        keywords: [
            'estados unidos', 'eua', 'usa', 'orlando', 'miami', 'nova york', 'new york',
            'los angeles', 'las vegas', 'california', 'disney', 'universal', 'canada',
            'toronto', 'vancouver', 'montreal', 'washington', 'chicago', 'boston',
            'san francisco', 'havai', 'hawaii', 'alasca', 'seattle',
        ],
    },
    {
        tag: REGION_TAG.americaLatina,
        keywords: [
            'mexico', 'cidade do mexico', 'argentina', 'buenos aires', 'bariloche',
            'chile', 'santiago', 'atacama', 'peru', 'lima', 'cusco', 'machu picchu',
            'colombia', 'bogota', 'cartagena', 'uruguai', 'montevideu', 'punta del este',
            'bolivia', 'equador', 'paraguai', 'costa rica', 'panama', 'guatemala',
        ],
    },
    {
        tag: REGION_TAG.caribe,
        keywords: [
            'caribe', 'cancun', 'riviera maya', 'punta cana', 'republica dominicana',
            'aruba', 'bahamas', 'jamaica', 'cuba', 'havana', 'curacao', 'barbados',
            'porto rico', 'maldivas', 'st marten', 'sao martinho',
        ],
    },
    {
        tag: REGION_TAG.europa,
        keywords: [
            'europa', 'portugal', 'lisboa', 'porto', 'espanha', 'madri', 'madrid',
            'barcelona', 'franca', 'paris', 'italia', 'roma', 'veneza', 'florenca',
            'milao', 'londres', 'inglaterra', 'reino unido', 'alemanha', 'berlim',
            'munique', 'amsterda', 'holanda', 'paises baixos', 'grecia', 'atenas',
            'santorini', 'suica', 'austria', 'viena', 'irlanda', 'dublin', 'escocia',
            'praga', 'budapeste', 'croacia', 'noruega', 'suecia', 'estocolmo',
            'dinamarca', 'copenhague', 'finlandia', 'belgica', 'polonia', 'islandia',
        ],
    },
    {
        tag: REGION_TAG.asia,
        keywords: [
            'asia', 'japao', 'toquio', 'quioto', 'osaka', 'china', 'pequim', 'xangai',
            'hong kong', 'tailandia', 'bangkok', 'phuket', 'vietna', 'india', 'indonesia',
            'bali', 'singapura', 'coreia', 'seul', 'filipinas', 'camboja', 'nepal',
            'sri lanka', 'taiwan', 'malasia',
        ],
    },
    {
        tag: REGION_TAG.oceania,
        keywords: [
            'oceania', 'australia', 'sydney', 'melbourne', 'nova zelandia', 'auckland',
            'fiji', 'tahiti', 'polinesia', 'bora bora',
        ],
    },
    {
        tag: REGION_TAG.africaOriente,
        keywords: [
            'africa', 'africa do sul', 'cidade do cabo', 'egito', 'cairo', 'marrocos',
            'marrakech', 'quenia', 'safari', 'tanzania', 'zanzibar', 'dubai', 'abu dhabi',
            'emirados', 'catar', 'qatar', 'israel', 'jerusalem', 'jordania', 'petra',
            'namibia', 'mauricio', 'seychelles',
        ],
    },
    {
        tag: REGION_TAG.abertoSurpresa,
        keywords: [
            'surpresa', 'me surpreenda', 'qualquer lugar', 'indeciso', 'nao sei',
            'destino aberto', 'aberto', 'tanto faz',
        ],
    },
];

function normalize(value: string): string {
    return value
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim();
}

function escapeRegExp(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function matchesKeyword(haystack: string, keyword: string): boolean {
    return new RegExp(`\\b${escapeRegExp(keyword)}\\b`).test(haystack);
}

/** Quiz answer ids → region tags (structured, exact lookup). */
export function resolveQuizDestinoTags(destinos: string[] | undefined | null): RegionTagId[] {
    if (!destinos || destinos.length === 0) return [];
    const tags = new Set<RegionTagId>();
    for (const id of destinos) {
        const tag = QUIZ_DESTINO_TO_TAG[id];
        if (tag) tags.add(tag);
    }
    return [...tags];
}

/** Free-text destination → region tags (heuristic). Empty when unrecognized. */
export function resolveRegionTagsFromText(text: string | null | undefined): RegionTagId[] {
    if (!text) return [];
    const normalized = normalize(text);
    if (!normalized) return [];

    const tags = new Set<RegionTagId>();
    for (const { tag, keywords } of REGION_KEYWORDS) {
        if (keywords.some((kw) => matchesKeyword(normalized, kw))) {
            tags.add(tag);
        }
    }
    return [...tags];
}

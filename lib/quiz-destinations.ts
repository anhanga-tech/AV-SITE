import type { ProfileKey } from './quiz-scoring';

export interface MainDestination {
    name: string;
    subtitle: string;
    tag: string;
    region: string;
}

export interface InspirationDestination {
    name: string;
    region: string;
    tag: string;
    imageKey: string;
}

// P1 region IDs that may appear in answers.destino (multi-select)
const P1_REGIONS = ['europa', 'america-norte', 'latam', 'caribe', 'asia', 'africa-oriente'] as const;
type P1Region = typeof P1_REGIONS[number];

// Main destination by profile × P1 region.
// 'surpresa' is the canonical fallback when no specific region is selected.
// Surpresa values are chosen to never overlap with INSPIRATION_DESTINATIONS for that profile.
const MAIN_DESTINATIONS: Record<ProfileKey, Record<P1Region | 'surpresa', MainDestination>> = {
    'escapista': {
        'europa':          { name: 'Algarve',              subtitle: 'Portugal · Sul',             tag: 'Praias + resort',              region: 'Europa' },
        'america-norte':   { name: 'Orlando',              subtitle: 'Flórida · EUA',              tag: 'Parques + diversão',           region: 'América do Norte' },
        'latam':           { name: 'Cartagena das Índias', subtitle: 'Colômbia',                   tag: 'Mar + resort',                 region: 'América Latina' },
        'caribe':          { name: 'Punta Cana',           subtitle: 'República Dominicana',       tag: 'All-inclusive + praia',        region: 'Caribe' },
        'asia':            { name: 'Bali',                 subtitle: 'Indonésia',                  tag: 'Resort + praia tropical',      region: 'Ásia' },
        'africa-oriente':  { name: 'Zanzibar',             subtitle: 'Tanzânia · Ilha',            tag: 'Praia paradisíaca',            region: 'África' },
        'surpresa':        { name: 'Costa do Sauípe',      subtitle: 'Bahia · Brasil',             tag: 'All-inclusive + praia',        region: 'Brasil' },
    },
    'bon-vivant': {
        'europa':          { name: 'Paris',                subtitle: 'França',                     tag: 'Gastronomia + arte',           region: 'Europa' },
        'america-norte':   { name: 'Nova York',            subtitle: 'EUA',                        tag: 'Gastronomia + cultura',        region: 'América do Norte' },
        'latam':           { name: 'Buenos Aires',         subtitle: 'Argentina',                  tag: 'Tango + gastronomia',          region: 'América Latina' },
        'caribe':          { name: 'Aruba',                subtitle: 'Caribe holandês',            tag: 'Resort + vida noturna',        region: 'Caribe' },
        'asia':            { name: 'Tóquio',               subtitle: 'Japão',                      tag: 'Alta gastronomia + estilo',    region: 'Ásia' },
        'africa-oriente':  { name: 'Dubai',                subtitle: 'Emirados Árabes',            tag: 'Luxo + modernidade',           region: 'Oriente Médio' },
        'surpresa':        { name: 'Gramado',              subtitle: 'RS · Brasil',                tag: 'Charme + gastronomia',         region: 'Brasil' },
    },
    'viajante-de-verdade': {
        'europa':          { name: 'Barcelona',            subtitle: 'Espanha',                    tag: 'Cultura + praia + tapas',      region: 'Europa' },
        'america-norte':   { name: 'Nova York',            subtitle: 'EUA',                        tag: 'Cultura + bairros + descoberta', region: 'América do Norte' },
        'latam':           { name: 'Cartagena',            subtitle: 'Colômbia',                   tag: 'História + praias',            region: 'América Latina' },
        'caribe':          { name: 'Cuba',                 subtitle: 'Havana + Varadero',          tag: 'Cultura + mar + charme',       region: 'Caribe' },
        'asia':            { name: 'Tailândia',            subtitle: 'Bangkok + ilhas',            tag: 'Templos + praia',              region: 'Ásia' },
        'africa-oriente':  { name: 'Marrocos',             subtitle: 'Marrakesh + deserto',        tag: 'Medina + aventura',            region: 'África do Norte' },
        'surpresa':        { name: 'Chapada Diamantina',   subtitle: 'Bahia · Brasil',             tag: 'Cachoeiras + trilhas',         region: 'Brasil' },
    },
    'desbravador': {
        'europa':          { name: 'Balcãs',               subtitle: 'Croácia + Montenegro',       tag: 'Trilhas + costa adriática',    region: 'Europa' },
        'america-norte':   { name: 'Parques Nacionais',    subtitle: 'Utah + Colorado · EUA',      tag: 'Grand Canyon + Zion',          region: 'América do Norte' },
        'latam':           { name: 'Patagônia',            subtitle: 'Argentina · Chile',          tag: 'Trilha + glaciar',             region: 'América Latina' },
        'caribe':          { name: 'Cuba interior',        subtitle: 'Trinidad + Vinales',         tag: 'Cultura + caminhos alternativos', region: 'Caribe' },
        'asia':            { name: 'Vietnã',               subtitle: 'Hoi An + Ha Long Bay',       tag: 'Cultura + natureza',           region: 'Ásia' },
        'africa-oriente':  { name: 'Quênia',               subtitle: 'Masai Mara + Nairóbi',       tag: 'Safari + cultura',             region: 'África' },
        'surpresa':        { name: 'Lençóis Maranhenses',  subtitle: 'MA · Brasil',                tag: 'Dunas + lagoas',               region: 'Brasil' },
    },
    'nomade-de-alma': {
        'europa':          { name: 'Geórgia',              subtitle: 'Cáucaso',                    tag: 'Cultura soviética + montanhas', region: 'Europa Oriental' },
        'america-norte':   { name: 'Alaska',               subtitle: 'EUA Norte',                  tag: 'Fauna + paisagens selvagens',  region: 'América do Norte' },
        'latam':           { name: 'Bolívia',              subtitle: 'Salar de Uyuni + La Paz',    tag: 'Altitude + culturas vivas',    region: 'América Latina' },
        'caribe':          { name: 'Trinidad e Tobago',    subtitle: 'Caribe autêntico',           tag: 'Cultura + natureza intocada',  region: 'Caribe' },
        'asia':            { name: 'Japão rural',          subtitle: 'Quioto antigo + Nara',       tag: 'Templos + natureza',           region: 'Ásia' },
        'africa-oriente':  { name: 'Etiópia',              subtitle: 'Lalibela + Vale do Omo',     tag: 'História + culturas únicas',   region: 'África' },
        'surpresa':        { name: 'Islândia',             subtitle: 'Norte da Europa',            tag: 'Vulcões + aurora boreal',      region: 'Europa' },
    },
};

// Primary (0-2) + reserve (3) inspiration per profile.
// Reserve is shown when a primary entry matches the main destination.
// All imageKeys are confirmed in the existing CDN data.
const INSPIRATION_DESTINATIONS: Record<ProfileKey, [InspirationDestination, InspirationDestination, InspirationDestination, InspirationDestination]> = {
    'escapista': [
        { name: 'Maragogi',          region: 'Alagoas · Brasil',  tag: 'Piscinas naturais',      imageKey: 'maragogi' },
        { name: 'Riviera Maya',      region: 'México',            tag: 'Resort + praia',         imageKey: 'riviera-maya' },
        { name: 'Buenos Aires',      region: 'Argentina',         tag: 'Gastronomia + cultura',  imageKey: 'buenos-aires' },
        { name: 'Costa do Sauípe',   region: 'Bahia · Brasil',    tag: 'All-inclusive + praia',  imageKey: 'sauipe' },
    ],
    'bon-vivant': [
        { name: 'Lisboa',            region: 'Portugal',          tag: 'Bairros + fado',         imageKey: 'lisboa' },
        { name: 'Buenos Aires',      region: 'Argentina',         tag: 'Tango + gastronomia',    imageKey: 'buenos-aires' },
        { name: 'Cartagena',         region: 'Colômbia',          tag: 'Histórico + praias',     imageKey: 'cartagena' },
        { name: 'Gramado',           region: 'RS · Brasil',       tag: 'Charme + gastronomia',   imageKey: 'gramado' },
    ],
    'viajante-de-verdade': [
        { name: 'Cartagena',         region: 'Colômbia',          tag: 'Histórico + praias',     imageKey: 'cartagena' },
        { name: 'Santiago',          region: 'Chile',             tag: 'Cidade + vinhedo',       imageKey: 'santiago' },
        { name: 'Patagônia',         region: 'Argentina · Chile', tag: 'Trilha + glaciar',       imageKey: 'patagonia' },
        { name: 'Chapada Diamantina', region: 'Bahia · Brasil',   tag: 'Cachoeiras + trilhas',   imageKey: 'chapada' },
    ],
    'desbravador': [
        { name: 'Patagônia',         region: 'Argentina · Chile', tag: 'Trilha + glaciar',       imageKey: 'patagonia' },
        { name: 'Peru & Machu Picchu', region: 'Peru',            tag: 'Ruínas + aventura',      imageKey: 'machu-picchu' },
        { name: 'Japão',             region: 'Ásia',              tag: 'Templos + trem-bala',    imageKey: 'quioto' },
        { name: 'Lençóis Maranhenses', region: 'MA · Brasil',     tag: 'Dunas + lagoas',         imageKey: 'lencois' },
    ],
    'nomade-de-alma': [
        { name: 'Japão',             region: 'Ásia',              tag: 'Templo + trem-bala',     imageKey: 'quioto' },
        { name: 'Marrocos',          region: 'África do Norte',   tag: 'Deserto + medina',       imageKey: 'marrocos' },
        { name: 'Pantanal',          region: 'MT/MS · Brasil',    tag: 'Onças + natureza',       imageKey: 'pantanal' },
        { name: 'Patagônia',         region: 'Argentina · Chile', tag: 'Trilha + glaciar',       imageKey: 'patagonia' },
    ],
};

/**
 * Selects the main destination for the result screen.
 *
 * Resolution rule for P1 multi-select:
 * 1. Filter out 'surpresa'.
 * 2. If no specific region remains, fall back to the profile canonical ('surpresa' key).
 * 3. Otherwise, use the first region that has an explicit mapping for the profile.
 */
export function selectMainDestination(profileKey: ProfileKey, p1Selected: string[]): MainDestination {
    const regions = p1Selected.filter((r): r is P1Region =>
        (P1_REGIONS as readonly string[]).includes(r),
    );

    for (const region of regions) {
        const dest = MAIN_DESTINATIONS[profileKey][region];
        if (dest) return dest;
    }

    return MAIN_DESTINATIONS[profileKey]['surpresa'];
}

// Returns true if inspiration and mainDest refer to the same place (first-word match).
function namesOverlap(a: string, b: string): boolean {
    const first = (s: string) => s.toLowerCase().split(' ')[0];
    return first(a) === first(b) || a.toLowerCase().startsWith(first(b)) || b.toLowerCase().startsWith(first(a));
}

/**
 * Returns 3 inspiration destinations that do not overlap with mainDest.
 * If a primary entry matches mainDest, it is replaced by the profile reserve (index 3).
 */
export function selectInspirationDestinations(profileKey: ProfileKey, mainDest: MainDestination): InspirationDestination[] {
    const [p0, p1, p2, reserve] = INSPIRATION_DESTINATIONS[profileKey];
    const primaries = [p0, p1, p2];
    const result: InspirationDestination[] = [];

    for (const dest of primaries) {
        if (namesOverlap(dest.name, mainDest.name)) {
            result.push(reserve);
        } else {
            result.push(dest);
        }
    }

    return result;
}

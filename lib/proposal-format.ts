/**
 * Display formatting for the proposal page (#1901, #1926). Plain text in,
 * plain text out: the template escapes everything these return.
 *
 * Calendar days (`YYYY-MM-DD`) and flight times are read from their own
 * digits, never through a Date in the runtime's time zone, so a hotel night
 * or a 18:35 departure never shifts a day or an hour.
 */

const MONTHS = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
const MONTHS_SHORT = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
const WEEKDAYS = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];

function dayParts(day: string): { year: number; month: number; date: number } {
    const [year, month, date] = day.slice(0, 10).split('-').map(Number);
    return { year, month, date };
}

/** `2026-12-06` → `06/12/2026`. */
export function formatDay(day: string): string {
    const [year, month, date] = day.split('-');
    return `${date}/${month}/${year}`;
}

/** `2027-03-10` → `qua, 10 mar`. The weekday comes from the date's digits, read as UTC. */
export function shortDay(day: string): string {
    const { year, month, date } = dayParts(day);
    const weekday = WEEKDAYS[new Date(Date.UTC(year, month - 1, date)).getUTCDay()];
    return `${weekday}, ${date} ${MONTHS_SHORT[month - 1]}`;
}

/** `1º de março de 2027`: the first of the month is an ordinal in Portuguese. */
function longDate(day: string, withYear = true): string {
    const { year, month, date } = dayParts(day);
    return `${date === 1 ? '1º' : date} de ${MONTHS[month - 1]}${withYear ? ` de ${year}` : ''}`;
}

/**
 * `10 a 13 de março de 2027`, `28 de fevereiro a 3 de março de 2027`, and
 * both years in full when the trip crosses New Year.
 */
export function formatPeriod(first: string, last: string): string {
    if (first === last) return longDate(first);
    const start = dayParts(first);
    const end = dayParts(last);
    if (start.year !== end.year) return `${longDate(first)} a ${longDate(last)}`;
    if (start.month !== end.month) return `${longDate(first, false)} a ${longDate(last)}`;
    return `${start.date === 1 ? '1º' : start.date} a ${longDate(last)}`;
}

export function nightsBetween(checkin: string, checkout: string): number {
    return Math.round((Date.parse(`${checkout}T00:00:00Z`) - Date.parse(`${checkin}T00:00:00Z`)) / 86_400_000);
}

/** Local airport time from `2026-12-06T18:35:00-03:00`: `{ day: '2026-12-06', time: '18:35' }`. */
export function flightMoment(value: string): { day: string; time: string } {
    return { day: value.slice(0, 10), time: value.slice(11, 16) };
}

const HAS_OFFSET = /(?:Z|[+-]\d{2}:\d{2})$/;

/**
 * Minutes from an arrival to the next departure at the same airport. Both
 * times are in that airport's zone, so their wall clocks compare directly;
 * with both offsets, the instants do (a daylight-saving change in between).
 */
export function minutesBetween(arrival: string, departure: string): number {
    const instant = (value: string) => (HAS_OFFSET.test(arrival) && HAS_OFFSET.test(departure)
        ? Date.parse(value)
        : Date.parse(`${value.slice(0, 16)}:00Z`));
    return Math.round((instant(departure) - instant(arrival)) / 60_000);
}

/** `01:05` → `1h05min`, `02:00` → `2h`, `00:45` → `45min`. */
export function formatDuration(value: string): string {
    const [hours, minutes] = value.split(':').map(Number);
    if (hours === 0) return `${minutes}min`;
    return minutes === 0 ? `${hours}h` : `${hours}h${String(minutes).padStart(2, '0')}min`;
}

/** `595` → `9h55min`. */
export function formatMinutes(total: number): string {
    return formatDuration(`${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`);
}

export function plural(count: number, one: string, many: string): string {
    return `${count} ${count === 1 ? one : many}`;
}

export function travelersLabel(travelers: { adults: number; children: number; infants?: number }): string {
    const parts = [plural(travelers.adults, 'adulto', 'adultos')];
    if (travelers.children > 0) parts.push(plural(travelers.children, 'criança', 'crianças'));
    if (travelers.infants) parts.push(plural(travelers.infants, 'bebê', 'bebês'));
    return parts.length > 2 ? `${parts.slice(0, -1).join(', ')} e ${parts[parts.length - 1]}` : parts.join(' e ');
}

/** `Navegantes (NVT)` → `NVT`; no code in parentheses → `undefined`. */
export function airportCode(place: string): string | undefined {
    return /\(([A-Z]{3})\)\s*$/.exec(place)?.[1];
}

/** `São Paulo (CGH)` → `São Paulo`. */
export function placeName(place: string): string {
    return place.replace(/\s*\([^)]*\)\s*$/, '').trim() || place;
}

/** `São Paulo (CGH)` and `São Paulo (GRU)` are the same city: a return into another airport is still a return. */
export function sameCity(a: string, b: string): boolean {
    return placeName(a).toLocaleLowerCase('pt-BR') === placeName(b).toLocaleLowerCase('pt-BR');
}

// Words an operator's ALL-CAPS name keeps in lower case once toned down.
const MINOR_WORDS = new Set([
    'a', 'à', 'ao', 'aos', 'as', 'às', 'com', 'da', 'das', 'de', 'do', 'dos', 'e', 'em', 'na', 'nas', 'no', 'nos',
    'o', 'os', 'ou', 'para', 'pela', 'pelas', 'pelo', 'pelos', 'por', 'sem', 'um', 'uma',
]);
const WORD = /\p{L}[\p{L}\p{M}]*/gu;
const isUpper = (word: string) => /\p{Lu}/u.test(word) && !/\p{Ll}/u.test(word);

/** Whether the word at `index` opens a sentence: only spaces, quotes or `**` back to a `.`, `!`, `?`, `:`, `•` or the start. */
function opensSentence(value: string, index: number): boolean {
    let cursor = index - 1;
    while (cursor >= 0 && /[\s*"'“(]/.test(value[cursor])) cursor -= 1;
    return cursor < 0 || /[.!?:•]/.test(value[cursor]);
}

/**
 * Tones down the operator's ALL-CAPS text for display (#1926):
 * `PASSEIO AO BETO CARRERO WORLD (sem ingresso)` → `Passeio ao Beto Carrero
 * World (sem ingresso)`. Only runs of upper-case words change, so mixed text
 * keeps its own casing. A run changes when it is clearly shouting (a word of
 * 4+ letters, or two words of 2+): `BRL` or `VIP` alone are left as they
 * are, and so are airport codes in parentheses, `(NVT)`, `(IN)`.
 *
 * `title` capitalizes every word but the minor ones (names of hotels,
 * excursions, transfers); `sentence` capitalizes only a sentence's first
 * word (descriptions and cancellation terms).
 */
export function displayCase(value: string, mode: 'title' | 'sentence' = 'title'): string {
    const words = [...value.matchAll(WORD)].map((match) => ({ text: match[0], index: match.index }));
    const isCode = (word: { text: string; index: number }) => word.text.length <= 3
        && value[word.index - 1] === '(' && value[word.index + word.text.length] === ')';

    // Runs: consecutive words with no lower-case letter. Codes ride along
    // without changing; a word with a lower-case letter ends the run.
    const runs: { text: string; index: number }[][] = [];
    let current: { text: string; index: number }[] = [];
    for (const word of words) {
        if (/\p{Ll}/u.test(word.text)) {
            if (current.length) runs.push(current);
            current = [];
        } else if (!isCode(word)) {
            current.push(word);
        }
    }
    if (current.length) runs.push(current);

    const replacements = new Map<number, string>();
    for (const run of runs) {
        const shouting = run.filter((word) => isUpper(word.text));
        const loud = shouting.some((word) => word.text.length >= 4) || shouting.filter((word) => word.text.length >= 2).length >= 2;
        if (!loud) continue;
        for (const word of shouting) {
            const lower = word.text.toLocaleLowerCase('pt-BR');
            const capitalized = lower.charAt(0).toLocaleUpperCase('pt-BR') + lower.slice(1);
            const keepLower = mode === 'sentence' ? !opensSentence(value, word.index) : MINOR_WORDS.has(lower) && word.index > 0;
            replacements.set(word.index, keepLower ? lower : capitalized);
        }
    }
    if (replacements.size === 0) return value;

    let result = '';
    let cursor = 0;
    for (const word of words) {
        const replacement = replacements.get(word.index);
        if (replacement === undefined) continue;
        result += value.slice(cursor, word.index) + replacement;
        cursor = word.index + word.text.length;
    }
    return result + value.slice(cursor);
}

/** `ANA` or `ana` → `Ana`; a name already in mixed case stays as typed. */
export function nameCase(value: string): string {
    if (/\p{Lu}/u.test(value.slice(1)) && /\p{Ll}/u.test(value)) return value;
    const lower = value.toLocaleLowerCase('pt-BR');
    return lower.charAt(0).toLocaleUpperCase('pt-BR') + lower.slice(1);
}

/**
 * `Reserva Praia Hotel - Balneário Camboriú` → title and subtitle, at the
 * first ` - ` or ` | `. Short heads (`P. 01 - …`) are not split.
 */
export function splitTitle(value: string): { title: string; subtitle?: string } {
    const match = /\s+[-|–]\s+/.exec(value);
    if (!match || match.index < 8) return { title: value };
    const subtitle = value.slice(match.index + match[0].length).trim();
    return subtitle ? { title: value.slice(0, match.index).trim(), subtitle } : { title: value };
}

/** `**aviso**` → `aviso`: markdown bold marks the operator leaves in its texts. */
export function stripMarkdown(value: string): string {
    return value.replace(/\*\*(.+?)\*\*/g, '$1').replace(/\*\*/g, '').trim();
}

/**
 * A long description split for "ler mais": whole sentences up to about
 * `size` characters, and the rest. A short text, or one long sentence, is
 * not split.
 */
export function splitExcerpt(value: string, size = 220): { excerpt: string; rest?: string } {
    if (value.length <= size + 120) return { excerpt: value };
    const sentences = value.split(/(?<=[.!?])\s+/);
    let excerpt = '';
    let taken = 0;
    while (taken < sentences.length && (excerpt.length < size * 0.6 || excerpt.length + sentences[taken].length <= size)) {
        excerpt = excerpt ? `${excerpt} ${sentences[taken]}` : sentences[taken];
        taken += 1;
    }
    const rest = sentences.slice(taken).join(' ');
    if (!rest || excerpt.length > size * 2) return { excerpt: value };
    return { excerpt, rest };
}

/** `- item;` → `item`: the dashes and semicolons around an operator's bullet. */
function trimBullet(value: string): string {
    const loose = (char: string | undefined) => char !== undefined && /[\s\-–;]/.test(char);
    let start = 0;
    let end = value.length;
    while (start < end && loose(value[start])) start += 1;
    while (end > start && loose(value[end - 1])) end -= 1;
    return value.slice(start, end);
}

/** `Intro - • item.• item` → the intro and its bullet items. */
export function bulletItems(value: string): { intro?: string; items: string[] } {
    const parts = value.split('•').map(trimBullet);
    if (parts.length < 3) return { intro: value, items: [] };
    const [intro, ...items] = parts;
    return { intro: intro || undefined, items: items.filter(Boolean) };
}

/**
 * HTML of a proposal page (#1901, polished in #1926): a hero with the
 * destination and the period, the trip's summary with the total and the
 * WhatsApp button, then the stay, flights (as boarding passes), transfers,
 * extras and conditions, from the validated content (lib/proposal-content.ts).
 *
 * No JavaScript: the page's CSP has no `script-src`, which also keeps
 * Cloudflare-injected trackers out. "Ler mais" and the amenities are
 * `<details>`; the gallery is a CSS scroll-snap row.
 *
 * Every value is escaped through `escapeHtml`. The operator's ALL-CAPS text
 * is toned down before that, for display only; dates and times are read from
 * their own digits (lib/proposal-format.ts).
 */
import type { ProposalContent } from './proposal-content';
import {
    airportCode,
    bulletItems,
    displayCase,
    flightMoment,
    formatDay,
    formatDuration,
    formatMinutes,
    formatPeriod,
    minutesBetween,
    nameCase,
    nightsBetween,
    placeName,
    plural,
    sameCity,
    shortDay,
    splitExcerpt,
    splitTitle,
    stripMarkdown,
    travelersLabel,
} from './proposal-format';
import { icon, iconShapes, type IconName } from './proposal-icons';
import { logo } from './proposal-logo';
import { PROPOSAL_FONT_PRELOADS, PROPOSAL_STYLES } from './proposal-styles';

export const WHATSAPP_NUMBER = '5511955021519';
const PRIVACY_POLICY_URL = 'https://www.anhanga.tur.br/politica-privacidade';
const GALLERY_PHOTOS = 12;
const MAX_LAYOVER_MINUTES = 24 * 60;
// Past this many characters the destination steps down a size, so a long
// "Gramado, Canela e Bento Gonçalves" doesn't fill the whole photo.
const LONG_DESTINATION = 28;

// The operator's payment terms never reach the page (D7: the deal is closed
// with the Anhangá); this is the Anhangá's own wording.
const CONDITIONS_TEXT = 'Valores sujeitos a disponibilidade e a alteração até a confirmação da reserva.';
const PRIVACY_NOTICE = 'Para acompanhar sua proposta, registramos quando esta página é aberta. O registro guarda só a data e a hora: não inclui seu IP, sua localização nem dados do seu aparelho.';
const INTERNAL_PREVIEW_NOTICE = 'Prévia interna: esta visita não conta como abertura do cliente.';

type Flight = ProposalContent['flights'][number];
type Hotel = NonNullable<ProposalContent['hotel']>;

interface Journey {
    label: string;
    flights: Flight[];
}

const BRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const USD = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'USD' });
const SAO_PAULO_DATE_TIME = new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
});

/** The exact cutoff, not just the day: the link stops working at this minute. */
function formatValidUntil(ms: number): string {
    const parts = Object.fromEntries(SAO_PAULO_DATE_TIME.formatToParts(ms).map((part) => [part.type, part.value]));
    return `${parts.day}/${parts.month}/${parts.year} às ${parts.hour}:${parts.minute}`;
}

export function escapeHtml(value: string): string {
    return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

/** A name from the operator (hotel, room, excursion), toned down and escaped. */
const name = (value: string) => escapeHtml(displayCase(value));
/** Running text from the operator (descriptions, cancellation terms). */
const prose = (value: string) => displayCase(stripMarkdown(value), 'sentence');

function whatsappUrl(text: string): string {
    return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
}

function list(items: string[], className = ''): string {
    if (items.length === 0) return '';
    return `<ul${className ? ` class="${className}"` : ''}>${items.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>`;
}

function disclosure(summary: string, body: string, openLabel?: string): string {
    const label = openLabel
        ? `<span class="when-closed">${summary}</span><span class="when-open">${openLabel}</span>`
        : summary;
    return `<details><summary>${label}${icon('chevron')}</summary>${body}</details>`;
}

/** A title and, after ` - ` or ` | `, its subtitle: `Reserva Praia Hotel` / `Balneário Camboriú`. */
function titled(value: string, tag: 'h3' | 'p', className: string): string {
    const { title, subtitle } = splitTitle(displayCase(value));
    return `<${tag} class="${className}">${escapeHtml(title)}</${tag}>${subtitle ? `<p class="subtitle">${escapeHtml(subtitle)}</p>` : ''}`;
}

/** A connection: next flight from the same city within a day, in the same leg. */
function isConnection(previous: Flight, next: Flight): boolean {
    if (previous.leg !== next.leg || !sameCity(previous.to, next.from)) return false;
    const layover = minutesBetween(previous.arrival, next.departure);
    return layover > 0 && layover < MAX_LAYOVER_MINUTES;
}

function groupFlights(flights: Flight[]): Flight[][] {
    const groups: Flight[][] = [];
    for (const flight of flights) {
        const group = groups[groups.length - 1];
        if (group && isConnection(group[group.length - 1], flight)) group.push(flight);
        else groups.push([flight]);
    }
    return groups;
}

/** Legs named Ida and Volta, or two journeys that leave from where the other one lands. */
function isRoundTrip(groups: Flight[][]): boolean {
    const legs = [...new Set(groups.map((group) => group[0].leg?.toLocaleLowerCase('pt-BR')))];
    if (legs.length === 2 && legs[0] === 'ida' && legs[1] === 'volta') return true;
    if (groups.length !== 2) return false;
    const [outbound, inbound] = groups;
    return sameCity(outbound[0].from, inbound[inbound.length - 1].to) && sameCity(outbound[outbound.length - 1].to, inbound[0].from);
}

function journeysOf(flights: Flight[]): { roundTrip: boolean; journeys: Journey[] } {
    const groups = groupFlights(flights);
    const roundTrip = isRoundTrip(groups);
    const label = (group: Flight[], index: number) => {
        if (group[0].leg) return displayCase(group[0].leg);
        if (roundTrip) return index === 0 ? 'Ida' : 'Volta';
        return `Trecho ${index + 1}`;
    };
    return { roundTrip, journeys: groups.map((group, index) => ({ label: label(group, index), flights: group })) };
}

/**
 * The whole trip, from the earliest to the latest day of the stay, every
 * flight's departure and arrival, and the dated extras. `YYYY-MM-DD` strings
 * sort chronologically.
 */
function travelDays(content: ProposalContent): { first: string; last: string } | undefined {
    const days = [
        ...(content.hotel ? [content.hotel.room.checkin, content.hotel.room.checkout] : []),
        ...content.flights.flatMap((flight) => [flight.departure.slice(0, 10), flight.arrival.slice(0, 10)]),
        ...content.extras.flatMap((extra) => (extra.date ? [extra.date] : [])),
    ].sort();
    return days.length ? { first: days[0], last: days[days.length - 1] } : undefined;
}

function placeLabel(place: string): string {
    return displayCase(placeName(place));
}

/** Big airport codes over a dotted arc: the hero of a proposal with no photo. */
function routeArt(journey: Journey): string {
    const from = journey.flights[0].from;
    const to = journey.flights[journey.flights.length - 1].to;
    const end = (place: string) => {
        const code = airportCode(place);
        return code
            ? `<p class="code">${code}<small>${escapeHtml(placeLabel(place))}</small></p>`
            : `<p class="code">${escapeHtml(placeLabel(place))}</p>`;
    };
    return `<div class="route-art" aria-hidden="true">${end(from)}<svg class="route-arc" viewBox="0 0 200 64" preserveAspectRatio="xMidYMax meet"><path class="arc" d="M6 58 Q100 -12 194 58"/><circle cx="6" cy="58" r="3.5"/><circle cx="194" cy="58" r="3.5"/><g class="route-plane" transform="translate(88 11) rotate(45 12 12)">${iconShapes('plane')}</g></svg>${end(to)}</div>`;
}

function hero(content: ProposalContent, journeys: Journey[]): string {
    const photo = content.hotel?.photos[0];
    const days = travelDays(content);
    const lead = content.firstName ? `${nameCase(content.firstName)}, sua viagem para` : 'Sua viagem para';
    const meta = [
        days ? `<li>${icon('calendar')}${escapeHtml(formatPeriod(days.first, days.last))}</li>` : '',
        `<li>${icon('users')}${escapeHtml(travelersLabel(content.travelers))}</li>`,
    ].join('');
    const image = photo && content.hotel
        ? `<img class="hero-photo" src="${escapeHtml(photo)}" alt="${escapeHtml(splitTitle(displayCase(content.hotel.name)).title)}" width="1200" height="800" fetchpriority="high" decoding="async">\n`
        : '';
    const art = !photo && journeys.length ? routeArt(journeys[0]) : '';
    return `<section class="hero ${photo ? 'hero--photo' : 'hero--plain'}" aria-labelledby="titulo">
${image}<div class="hero-text">
${art}<h1 id="titulo"><span class="hero-lead">${escapeHtml(lead)}</span> <span class="hero-place${content.destination.length > LONG_DESTINATION ? ' hero-place--long' : ''}">${name(content.destination)}</span></h1>
<ul class="hero-meta">${meta}</ul>
</div>
</section>`;
}

interface SummaryItem {
    icon: IconName;
    title: string;
    detail?: string;
}

function summaryItems(content: ProposalContent, flights: { roundTrip: boolean; journeys: Journey[] }): SummaryItem[] {
    const items: SummaryItem[] = [];
    const { hotel, transfers, extras } = content;
    if (hotel) {
        const nights = nightsBetween(hotel.room.checkin, hotel.room.checkout);
        const stay = splitTitle(displayCase(hotel.name)).title;
        items.push({ icon: 'bed', title: `Hospedagem por ${plural(nights, 'noite', 'noites')}`, detail: hotel.room.board ? `${stay} · ${displayCase(hotel.room.board)}` : stay });
    }
    const { journeys } = flights;
    if (journeys.length) {
        const first = journeys[0].flights[0];
        const lastJourney = journeys[flights.roundTrip ? 0 : journeys.length - 1].flights;
        const airlines = [...new Set(content.flights.map((flight) => displayCase(flight.airline)))].join(', ');
        items.push({
            icon: 'plane',
            title: flights.roundTrip ? 'Voos de ida e volta' : plural(content.flights.length, 'voo', 'voos'),
            detail: `${placeLabel(first.from)} – ${placeLabel(lastJourney[lastJourney.length - 1].to)} · ${airlines}`,
        });
    }
    if (transfers.length) {
        items.push({ icon: 'car', title: plural(transfers.length, 'traslado', 'traslados'), detail: transfers.length === 1 ? splitTitle(displayCase(transfers[0].name)).title : undefined });
    }
    if (extras.length) {
        const names = extras.map((extra) => splitTitle(displayCase(extra.name)).title);
        items.push({ icon: 'ticket', title: plural(extras.length, 'passeio ou ingresso', 'passeios e ingressos'), detail: names.length <= 3 ? names.join(' · ') : undefined });
    }
    return items;
}

/** The price block: reais, or dollars first and reais below for a customer abroad (#1905). */
function totalAmount(total: ProposalContent['total']): string {
    const brl = BRL.format(total.amount);
    if (!total.usd) return `<p class="amount">${escapeHtml(brl)}</p>`;
    const usd = USD.format(total.usd.amount);
    const [main, other] = total.usd.primary ? [usd, brl] : [brl, usd];
    return `<p class="amount">${escapeHtml(main)}</p>\n<p class="amount-alt">${escapeHtml(other)}</p>`;
}

/** "Resumo da viagem" and the total: what the customer reads before any detail. */
function voucher(content: ProposalContent, flights: { roundTrip: boolean; journeys: Journey[] }, validUntil: string): string {
    const items = summaryItems(content, flights).map((item) => `<li><span class="summary-icon">${icon(item.icon)}</span><div><p class="summary-title">${escapeHtml(item.title)}</p>${item.detail ? `<p class="summary-sub">${escapeHtml(item.detail)}</p>` : ''}</div></li>`);
    const cta = whatsappUrl(`Olá! Vi minha proposta para ${content.destination} e quero conversar.`);
    return `<div class="voucher">
<section class="summary" aria-labelledby="resumo">
<h2 id="resumo">Sua viagem em resumo</h2>
<ul class="summary-list">${items.join('')}</ul>
</section>
<section class="price" aria-labelledby="valor">
<h2 id="valor" class="label">Valor total</h2>
${totalAmount(content.total)}
<p class="price-for">para ${escapeHtml(travelersLabel(content.travelers))}, com tudo o que está no resumo</p>
<a class="cta" href="${escapeHtml(cta)}" rel="noopener noreferrer" target="_blank">${icon('message')}Quero fechar pelo WhatsApp</a>
<p class="valid">${icon('clock')}Proposta válida até ${escapeHtml(validUntil)}</p>
${content.total.note ? `<p class="price-note">${escapeHtml(content.total.note)}</p>` : ''}
</section>
</div>`;
}

function stars(count: number | undefined): string {
    if (!count) return '';
    return ` <span class="stars" role="img" aria-label="${count} estrelas">${'★'.repeat(count)}</span>`;
}

function aboutHotel(description: string): string {
    const { excerpt, rest } = splitExcerpt(prose(description));
    const more = rest ? disclosure('Ler mais', `<p>${escapeHtml(rest)}</p>`, 'Ler menos') : '';
    return `<div class="about"><p>${escapeHtml(excerpt)}</p>${more}</div>`;
}

function hotelSection(hotel: Hotel): string {
    const { room } = hotel;
    const nights = nightsBetween(room.checkin, room.checkout);
    const { title, subtitle } = splitTitle(displayCase(hotel.name));
    const gallery = hotel.photos.slice(1, 1 + GALLERY_PHOTOS);
    const cancellation = room.cancellation.length || room.refundable === undefined
        ? room.cancellation
        : [room.refundable ? 'Tarifa reembolsável' : 'Tarifa não reembolsável'];
    // Check-in and check-out side by side; the rest on full rows.
    const facts: { term: string; value: string; wide?: boolean }[] = [
        { term: 'Quarto', value: `<strong>${name(room.type)}</strong>`, wide: true },
        ...(room.board ? [{ term: 'Regime', value: name(room.board), wide: true }] : []),
        { term: 'Entrada', value: `${shortDay(room.checkin)}${hotel.checkinTime ? `, a partir das ${escapeHtml(hotel.checkinTime)}` : ''}` },
        { term: 'Saída', value: `${shortDay(room.checkout)}${hotel.checkoutTime ? `, até as ${escapeHtml(hotel.checkoutTime)}` : ''}` },
        ...(cancellation.length
            ? [{ term: 'Cancelamento', value: cancellation.length === 1 ? escapeHtml(prose(cancellation[0])) : list(cancellation.map(prose)), wide: true }]
            : []),
    ];

    return `<section class="section" aria-labelledby="hospedagem">
<h2 id="hospedagem">${icon('bed')}Hospedagem</h2>
<p class="lead">${plural(nights, 'noite', 'noites')}, de ${escapeHtml(formatPeriod(room.checkin, room.checkout))}</p>
<div class="hotel-head">
<h3 class="hotel-name">${escapeHtml(title)}${stars(hotel.stars)}</h3>
${subtitle ? `<p class="subtitle">${escapeHtml(subtitle)}</p>\n` : ''}${hotel.address ? `<p class="address">${icon('pin')}${name(hotel.address)}</p>` : ''}
</div>
${gallery.length ? `<div class="gallery" role="region" aria-label="Fotos do hotel" tabindex="0">${gallery.map((photo) => `<img src="${escapeHtml(photo)}" alt="" width="800" height="600" loading="lazy" decoding="async">`).join('')}</div>
${gallery.length > 1 ? `<p class="gallery-hint">Deslize para ver as ${gallery.length} fotos</p>` : ''}` : ''}
<div class="box stay"><dl class="facts">${facts.map((fact) => `<div${fact.wide ? ' class="wide"' : ''}><dt>${fact.term}</dt><dd>${fact.value}</dd></div>`).join('')}</dl></div>
${hotel.description ? aboutHotel(hotel.description) : ''}
${hotel.amenities.length ? disclosure(`Comodidades do hotel (${hotel.amenities.length})`, list(hotel.amenities.map((amenity) => displayCase(amenity)), 'amenities')) : ''}
</section>`;
}

function endpoint(place: string, moment: { day: string; time: string }, side: 'from' | 'to', departureDay?: string): string {
    const code = airportCode(place);
    const label = escapeHtml(placeLabel(place));
    const arrivesLater = side === 'to' && departureDay !== undefined && moment.day !== departureDay;
    return `<div class="end end--${side}"><span class="sr">${side === 'from' ? 'Partida' : 'Chegada'}: </span>`
        + (code ? `<span class="code">${code}</span>` : `<span class="code code--name">${label}</span>`)
        + `<span class="time">${moment.time}</span>`
        + (arrivesLater ? `<span class="next-day">chega ${formatDay(moment.day).slice(0, 5)}</span>` : '')
        + (code ? `<span class="place">${label}</span>` : '')
        + '</div>';
}

function flightBlock(flight: Flight): string {
    const departure = flightMoment(flight.departure);
    const arrival = flightMoment(flight.arrival);
    const stops = flight.stops === undefined ? '' : flight.stops === 0 ? 'Voo direto' : plural(flight.stops, 'parada', 'paradas');
    const duration = flight.duration ? `<span><span class="sr">Duração: </span>${formatDuration(flight.duration)}</span>` : '';
    return `<div class="flight">
<p class="flight-meta"><strong>${name(flight.airline)} ${escapeHtml(flight.number)}</strong>${stops ? `<span>${stops}</span>` : ''}</p>
<div class="leg">${endpoint(flight.from, departure, 'from')}<div class="path"><span class="path-line">${icon('plane')}</span>${duration}</div>${endpoint(flight.to, arrival, 'to', departure.day)}</div>
</div>`;
}

function connection(previous: Flight, next: Flight): string {
    const code = airportCode(previous.to);
    const where = `${placeLabel(previous.to)}${code ? ` (${code})` : ''}`;
    return `<p class="connection">${icon('clock')}<span><strong>Conexão em ${escapeHtml(where)}</strong><small>${formatMinutes(minutesBetween(previous.arrival, next.departure))} entre os voos</small></span></p>`;
}

function boardingPass(journey: Journey): string {
    const { flights } = journey;
    const day = flightMoment(flights[0].departure).day;
    const body = flights.map((flight, index) => (index === 0 ? '' : connection(flights[index - 1], flight)) + flightBlock(flight)).join('\n');
    const fares = [...new Set(flights.flatMap((flight) => (flight.fareFamily ? [displayCase(flight.fareFamily)] : [])))];
    const baggage = [...new Set(flights.flatMap((flight) => (flight.baggage ? [flight.baggage] : [])))];
    const stub = [
        ...fares.map((fare) => `<span>Tarifa ${escapeHtml(fare)}</span>`),
        ...baggage.map((item) => `<span>${icon('luggage')}${escapeHtml(item)}</span>`),
    ];
    return `<article class="pass">
<header class="pass-head"><h3 class="label">${escapeHtml(journey.label)}</h3><p class="pass-date">${shortDay(day)}</p></header>
<div class="pass-body">
${body}
</div>
${stub.length ? `<p class="pass-stub">${stub.join('')}</p>` : ''}
</article>`;
}

function flightsSection(journeys: Journey[]): string {
    if (journeys.length === 0) return '';
    return `<section class="section" aria-labelledby="voos"><h2 id="voos">${icon('plane')}Voos</h2>
${journeys.map(boardingPass).join('\n')}
</section>`;
}

function transfersSection(transfers: ProposalContent['transfers']): string {
    if (transfers.length === 0) return '';
    const cards = transfers.map((transfer) => `<div class="box">${titled(transfer.name, 'h3', 'title')}${transfer.provider ? `<p class="fine">Operado por ${name(transfer.provider)}</p>` : ''}${list(transfer.cancellation.map(prose), 'fine')}</div>`);
    return `<section class="section" aria-labelledby="traslados"><h2 id="traslados">${icon('car')}Traslados</h2>${cards.join('')}</section>`;
}

function extraDetails(description: string): string {
    const { intro, items } = bulletItems(prose(description));
    return `${intro ? `<p>${escapeHtml(intro)}</p>` : ''}${list(items)}`;
}

function extrasSection(extras: ProposalContent['extras']): string {
    if (extras.length === 0) return '';
    const cards = extras.map((extra) => `<div class="box">
${extra.date ? `<p class="when">${icon('calendar')}${shortDay(extra.date)}</p>` : ''}${titled(extra.name, 'h3', 'title')}
${extra.description ? disclosure('Detalhes', extraDetails(extra.description)) : ''}
</div>`);
    return `<section class="section" aria-labelledby="extras"><h2 id="extras">${icon('ticket')}Passeios e ingressos</h2>${cards.join('')}</section>`;
}

function notesSection(notes: ProposalContent['notes']): string {
    if (!notes?.length) return '';
    return `<section class="section" aria-labelledby="bom-saber"><h2 id="bom-saber">Bom saber</h2>${list(notes, 'notes')}</section>`;
}

function conditionsSection(destination: string): string {
    const contact = whatsappUrl(`Olá! Tenho uma dúvida sobre a minha proposta para ${destination}.`);
    return `<section class="section conditions" aria-labelledby="condicoes"><h2 id="condicoes">Condições</h2><p>${escapeHtml(CONDITIONS_TEXT)} Para fechar ou tirar dúvidas, <a href="${escapeHtml(contact)}" rel="noopener noreferrer" target="_blank">fale com a gente pelo WhatsApp</a>.</p></section>`;
}

export function renderProposalContent(
    content: ProposalContent,
    options: { expiresAt: number; internalPreview?: boolean },
): string {
    const flights = journeysOf(content.flights);

    return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="robots" content="noindex, nofollow">
<meta name="referrer" content="no-referrer">
<meta name="color-scheme" content="light dark">
<meta name="theme-color" content="#F4F8FF" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#0f172a" media="(prefers-color-scheme: dark)">
<title>Sua proposta | Anhangá Viagens</title>
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
${PROPOSAL_FONT_PRELOADS}
<style>${PROPOSAL_STYLES}</style>
</head>
<body>
${options.internalPreview ? `<p class="notice" role="note">${escapeHtml(INTERNAL_PREVIEW_NOTICE)}</p>\n` : ''}<header class="shell top">${logo()}<p class="label">Proposta</p></header>
<main>
${hero(content, flights.journeys)}
<div class="shell">
${voucher(content, flights, formatValidUntil(options.expiresAt))}
${content.hotel ? hotelSection(content.hotel) : ''}
${flightsSection(flights.journeys)}
${transfersSection(content.transfers)}
${extrasSection(content.extras)}
${notesSection(content.notes)}
${conditionsSection(content.destination)}
</div>
</main>
<footer><div class="shell">
<p>${escapeHtml(PRIVACY_NOTICE)} <a href="${PRIVACY_POLICY_URL}" rel="noopener noreferrer" target="_blank">Política de Privacidade</a>.</p>
<p>Anhangá Viagens</p>
</div></footer>
</body>
</html>`;
}

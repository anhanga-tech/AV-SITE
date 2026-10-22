/**
 * HTML of a proposal page (#1901): hero, stay, gallery, flights, transfers,
 * extras, total and conditions, from the validated content
 * (lib/proposal-content.ts). No JavaScript: the page's CSP has no
 * `script-src`, which also keeps Cloudflare-injected trackers out.
 *
 * Every value is escaped through `escapeHtml`. Calendar days (`YYYY-MM-DD`)
 * and flight times are formatted from their own digits, never through a
 * Date in UTC, so a hotel night or a 18:35 departure never shifts a day or
 * an hour with the runtime's time zone.
 */
import type { ProposalContent } from './proposal-content';

export const WHATSAPP_NUMBER = '5511955021519';
const PRIVACY_POLICY_URL = 'https://www.anhanga.tur.br/politica-privacidade';
const GALLERY_PHOTOS = 9;

// The operator's payment terms never reach the page (D7: the deal is closed
// with the Anhangá); this is the Anhangá's own wording.
const CONDITIONS_TEXT = 'Valores sujeitos a disponibilidade e a alteração até a confirmação da reserva. Para fechar ou tirar dúvidas, fale com a gente pelo WhatsApp.';
const PRIVACY_NOTICE = 'Para acompanhar sua proposta, registramos quando esta página é aberta: data, hora, cidade aproximada e tipo de aparelho. Não guardamos seu IP.';
const INTERNAL_PREVIEW_NOTICE = 'Prévia interna: esta visita não conta como abertura do cliente.';

const BRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
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

/** `2026-12-06` → `06/12/2026`. */
function formatDay(day: string): string {
    const [year, month, date] = day.split('-');
    return `${date}/${month}/${year}`;
}

function nightsBetween(checkin: string, checkout: string): number {
    return Math.round((Date.parse(`${checkout}T00:00:00Z`) - Date.parse(`${checkin}T00:00:00Z`)) / 86_400_000);
}

/** Local airport time from `2026-12-06T18:35:00-03:00`: `{ day: '06/12', time: '18:35' }`. */
function flightMoment(value: string): { day: string; time: string } {
    const [, month, date, hour, minute] = /^\d{4}-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(value) ?? [];
    return { day: `${date}/${month}`, time: `${hour}:${minute}` };
}

/** `01:05` → `1h05min`, `02:00` → `2h`. */
function formatDuration(value: string): string {
    const [hours, minutes] = value.split(':').map(Number);
    if (hours === 0) return `${minutes}min`;
    return minutes === 0 ? `${hours}h` : `${hours}h${String(minutes).padStart(2, '0')}min`;
}

function plural(count: number, one: string, many: string): string {
    return `${count} ${count === 1 ? one : many}`;
}

function travelersLabel(travelers: ProposalContent['travelers']): string {
    const parts = [plural(travelers.adults, 'adulto', 'adultos')];
    if (travelers.children > 0) parts.push(plural(travelers.children, 'criança', 'crianças'));
    return parts.join(' e ');
}

function whatsappUrl(text: string): string {
    return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
}

function list(items: string[], className = ''): string {
    if (items.length === 0) return '';
    return `<ul${className ? ` class="${className}"` : ''}>${items.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>`;
}

function stars(count: number | undefined): string {
    if (!count) return '';
    return ` <span class="stars" aria-label="${count} estrelas">${'★'.repeat(count)}</span>`;
}

function hotelSection(hotel: NonNullable<ProposalContent['hotel']>): string {
    const { room } = hotel;
    const nights = nightsBetween(room.checkin, room.checkout);
    const gallery = hotel.photos.slice(1, 1 + GALLERY_PHOTOS);
    const times = [
        `Entrada ${formatDay(room.checkin)}${hotel.checkinTime ? ` a partir das ${escapeHtml(hotel.checkinTime)}` : ''}`,
        `Saída ${formatDay(room.checkout)}${hotel.checkoutTime ? ` até as ${escapeHtml(hotel.checkoutTime)}` : ''}`,
    ];
    return `<section aria-labelledby="hospedagem">
<p class="label">Hospedagem · ${plural(nights, 'noite', 'noites')}</p>
<h2 id="hospedagem">${escapeHtml(hotel.name)}${stars(hotel.stars)}</h2>
${hotel.address ? `<p class="muted">${escapeHtml(hotel.address)}</p>` : ''}
<div class="card">
<p class="item-title">${escapeHtml(room.type)}</p>
${room.board ? `<p>${escapeHtml(room.board)}</p>` : ''}
<p class="muted">${times.join('<br>')}</p>
${list(room.cancellation.length || room.refundable === undefined ? room.cancellation : [room.refundable ? 'Tarifa reembolsável' : 'Tarifa não reembolsável'], 'fine')}
</div>
${hotel.description ? `<p>${escapeHtml(hotel.description)}</p>` : ''}
${gallery.length ? `<div class="gallery">${gallery.map((photo) => `<img src="${escapeHtml(photo)}" alt="" loading="lazy" decoding="async">`).join('')}</div>` : ''}
${hotel.amenities.length ? `<details><summary>Comodidades do hotel (${hotel.amenities.length})</summary>${list(hotel.amenities, 'amenities')}</details>` : ''}
</section>`;
}

/** `São Paulo (CGH)` → `são paulo`: São Paulo out of CGH and back into GRU is still a return. */
function city(place: string): string {
    return place.replace(/\(.*\)/, '').trim().toLocaleLowerCase('pt-BR');
}

/** Two flights that leave from where the other one lands: outbound and return. */
function isRoundTrip(flights: ProposalContent['flights']): boolean {
    if (flights.length !== 2) return false;
    const [outbound, inbound] = flights;
    return city(outbound.from) === city(inbound.to) && city(outbound.to) === city(inbound.from);
}

function flightsSection(flights: ProposalContent['flights']): string {
    if (flights.length === 0) return '';
    const roundTrip = isRoundTrip(flights);
    const legLabel = (index: number) => {
        if (roundTrip) return index === 0 ? 'Ida' : 'Volta';
        return `Trecho ${index + 1}`;
    };
    const cards = flights.map((flight, index) => {
        const departure = flightMoment(flight.departure);
        const arrival = flightMoment(flight.arrival);
        const details = [
            flight.stops === undefined ? '' : flight.stops === 0 ? 'Voo direto' : plural(flight.stops, 'parada', 'paradas'),
            flight.duration ? formatDuration(flight.duration) : '',
            flight.fareFamily ? `Tarifa ${flight.fareFamily}` : '',
        ].filter(Boolean);
        return `<div class="card">
<p class="label">${legLabel(index)} · ${departure.day}</p>
<p class="item-title">${escapeHtml(flight.airline)} ${escapeHtml(flight.number)}</p>
<p class="route"><span>${departure.time}<br><small>${escapeHtml(flight.from)}</small></span><span aria-hidden="true">→</span><span>${arrival.time}${arrival.day === departure.day ? '' : ` <small>(chega ${arrival.day})</small>`}<br><small>${escapeHtml(flight.to)}</small></span></p>
<p class="muted">${escapeHtml(details.join(' · '))}</p>
</div>`;
    });
    return `<section aria-labelledby="voos"><h2 id="voos">Voos</h2>${cards.join('')}</section>`;
}

function transfersSection(transfers: ProposalContent['transfers']): string {
    if (transfers.length === 0) return '';
    const cards = transfers.map((transfer) => `<div class="card"><p class="item-title">${escapeHtml(transfer.name)}</p>${transfer.provider ? `<p class="fine">Operado por ${escapeHtml(transfer.provider)}</p>` : ''}${list(transfer.cancellation, 'fine')}</div>`);
    return `<section aria-labelledby="traslados"><h2 id="traslados">Traslados</h2>${cards.join('')}</section>`;
}

function extrasSection(extras: ProposalContent['extras']): string {
    if (extras.length === 0) return '';
    const cards = extras.map((extra) => `<div class="card">
${extra.date ? `<p class="label">${formatDay(extra.date)}</p>` : ''}<p class="item-title">${escapeHtml(extra.name)}</p>
${extra.description ? `<details><summary>Detalhes</summary><p>${escapeHtml(extra.description)}</p></details>` : ''}
</div>`);
    return `<section aria-labelledby="extras"><h2 id="extras">Passeios e ingressos</h2>${cards.join('')}</section>`;
}

/**
 * `06/12/2026 a 09/12/2026 · `: the whole trip, from the earliest to the
 * latest day of the stay, every flight's departure and arrival, and the
 * dated extras. `YYYY-MM-DD` strings sort chronologically.
 */
function travelPeriod(content: ProposalContent): string {
    const days = [
        ...(content.hotel ? [content.hotel.room.checkin, content.hotel.room.checkout] : []),
        ...content.flights.flatMap((flight) => [flight.departure.slice(0, 10), flight.arrival.slice(0, 10)]),
        ...content.extras.flatMap((extra) => (extra.date ? [extra.date] : [])),
    ].sort();
    if (days.length === 0) return '';
    const first = formatDay(days[0]);
    const last = formatDay(days[days.length - 1]);
    return first === last ? `${first} · ` : `${first} a ${last} · `;
}

function includedSummary(content: ProposalContent): string[] {
    const items: string[] = [];
    if (content.hotel) items.push(`Hospedagem por ${plural(nightsBetween(content.hotel.room.checkin, content.hotel.room.checkout), 'noite', 'noites')}`);
    if (content.flights.length) items.push(isRoundTrip(content.flights) ? 'Voos de ida e volta' : plural(content.flights.length, 'voo', 'voos'));
    if (content.transfers.length) items.push(plural(content.transfers.length, 'traslado', 'traslados'));
    if (content.extras.length) items.push(plural(content.extras.length, 'passeio ou ingresso', 'passeios e ingressos'));
    return items;
}

const STYLES = `
*{box-sizing:border-box}
body{margin:0;font-family:Poppins,ui-sans-serif,system-ui,-apple-system,'Segoe UI',sans-serif;line-height:1.6;color:#0f172a;background:#F4F8FF}
main{max-width:42rem;margin:0 auto;padding:24px 16px 48px}
img{display:block;max-width:100%}
h1{margin:4px 0 8px;font-size:clamp(1.75rem,6vw,2.5rem);font-weight:800;line-height:1.1}
h2{margin:0 0 12px;font-size:1.375rem;font-weight:800;line-height:1.2}
section{margin-top:40px}
p{margin:0 0 12px}
ul{margin:8px 0 0;padding-left:20px}
small{font-size:.8125rem;color:#475569}
.label{margin:0 0 4px;font-size:.75rem;font-weight:900;letter-spacing:.1em;text-transform:uppercase;color:#0056D2}
.muted{color:#475569;font-size:.9375rem}
.fine{font-size:.8125rem;color:#475569}
.notice{padding:8px 12px;border-radius:8px;font-size:.875rem;font-weight:600;background:#e0f2fe}
.hero{width:100%;aspect-ratio:16/10;object-fit:cover;margin:20px 0 0;border-radius:16px;background:#e2e8f0}
.card{margin:0 0 12px;padding:20px;border-radius:16px;background:#fff;box-shadow:0 10px 40px -10px rgba(0,0,0,.15)}
.card>:last-child{margin-bottom:0}
.item-title{margin:0 0 4px;font-weight:700}
.stars{color:#b45309;font-size:1rem;letter-spacing:2px}
.route{display:flex;align-items:flex-start;gap:12px;font-size:1.25rem;font-weight:700;line-height:1.3}
.route span:nth-child(2){padding-top:2px;color:#94a3b8}
.gallery{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin:16px 0}
.gallery img{width:100%;aspect-ratio:1;object-fit:cover;border-radius:8px;background:#e2e8f0}
details{margin:12px 0 0}
summary{cursor:pointer;font-weight:600;color:#0056D2;min-height:44px;display:flex;align-items:center}
.amenities{columns:2;column-gap:24px;font-size:.875rem}
.total{margin-top:24px;padding:24px;border-radius:16px;color:rgba(255,255,255,.9);background:#0f172a}
.total .label{color:#7dd3fc}
.amount{margin:4px 0;font-size:clamp(2rem,9vw,2.75rem);font-weight:900;line-height:1.1;color:#fff}
.total ul{margin:12px 0 20px}
.cta{display:flex;align-items:center;justify-content:center;min-height:52px;padding:12px 24px;border-radius:16px;font-weight:700;color:#0f172a;text-decoration:none;background:#FFD600;box-shadow:4px 4px 0 0 #7dd3fc;transition:transform .15s,box-shadow .15s}
.cta:hover{transform:translate(2px,2px);box-shadow:2px 2px 0 0 #7dd3fc;background:#E5C000}
.cta:active{transform:translate(4px,4px);box-shadow:none}
.cta:focus-visible,summary:focus-visible,a:focus-visible{outline:3px solid #0ea5e9;outline-offset:3px}
.valid{margin:12px 0 0;font-size:.875rem;text-align:center}
footer{margin-top:48px;padding-top:20px;border-top:1px solid #e5e7eb;font-size:.8125rem;color:#475569}
footer a{color:#0056D2}
@media (prefers-reduced-motion:reduce){.cta{transition:none}}
`;

export function renderProposalContent(
    content: ProposalContent,
    options: { expiresAt: number; internalPreview?: boolean },
): string {
    const { hotel } = content;
    const greeting = content.firstName ? `${content.firstName}, sua viagem para ${content.destination}` : `Sua viagem para ${content.destination}`;
    const period = travelPeriod(content);
    const heroPhoto = hotel?.photos[0];
    const validUntil = formatValidUntil(options.expiresAt);
    const cta = whatsappUrl(`Olá! Vi minha proposta para ${content.destination} e quero conversar.`);

    return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<meta name="referrer" content="no-referrer">
<title>Sua proposta | Anhangá Viagens</title>
<style>${STYLES}</style>
</head>
<body>
<main>
${options.internalPreview ? `<p class="notice" role="note">${escapeHtml(INTERNAL_PREVIEW_NOTICE)}</p>\n` : ''}<p class="label">Anhangá Viagens · Proposta</p>
<h1>${escapeHtml(greeting)}</h1>
<p class="muted">${period}${escapeHtml(travelersLabel(content.travelers))}</p>
${heroPhoto ? `<img class="hero" src="${escapeHtml(heroPhoto)}" alt="${escapeHtml(hotel.name)}">` : ''}
<div class="total">
<p class="label">Valor total</p>
<p class="amount">${escapeHtml(BRL.format(content.total.amount))}</p>
<p>para ${escapeHtml(travelersLabel(content.travelers))}, com tudo o que está incluso:</p>
${list(includedSummary(content))}
<a class="cta" href="${escapeHtml(cta)}" rel="noopener noreferrer" target="_blank">Quero fechar pelo WhatsApp</a>
<p class="valid">Proposta válida até ${escapeHtml(validUntil)}</p>
</div>
${hotel ? hotelSection(hotel) : ''}
${flightsSection(content.flights)}
${transfersSection(content.transfers)}
${extrasSection(content.extras)}
<section aria-labelledby="condicoes"><h2 id="condicoes">Condições</h2><p>${escapeHtml(CONDITIONS_TEXT)}</p></section>
<footer>
<p>${escapeHtml(PRIVACY_NOTICE)} <a href="${PRIVACY_POLICY_URL}" rel="noopener noreferrer" target="_blank">Política de Privacidade</a>.</p>
<p>Anhangá Viagens</p>
</footer>
</main>
</body>
</html>`;
}

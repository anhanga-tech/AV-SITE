import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import { proposalContentSchema, type ProposalContentInput } from '../lib/proposal-content.ts';
import { fromInfotravelNormalized } from '../lib/proposal-infotravel.ts';
import { handleProposalRequest } from '../lib/proposal-page.ts';
import { createProposalPreviewSignature } from '../lib/proposal-preview.ts';
import { opensKey } from '../lib/proposal-opens.ts';
import { saveProposal } from '../lib/proposal-store.ts';
import { renderProposalContent } from '../lib/proposal-template.ts';
import { createFakeProposalRedis } from './helpers/fake-proposal-redis.ts';
import { pageText } from './helpers/page-text.ts';

// Issue #1901: the proposal page, rendered from the normalized Infotravel
// quotation. The fixture is the real test quotation with the itinerary
// shifted and the flight numbers, booking id and ages made up; it keeps the
// fields the page must never show (per-item values, commission, the
// operator's payment terms, the supplier) so the tests below are not vacuous.

const NORMALIZED = JSON.parse(readFileSync(new URL('./fixtures/proposta-infotravel-normalizado.json', import.meta.url), 'utf8'));
const ORIGIN = 'https://www.anhanga.tur.br';
const IPHONE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Mobile/15E148 Safari/604.1';
const PREVIEW_SECRET = 'test-proposal-preview-secret';
const EXPIRES_AT = Date.UTC(2027, 1, 4, 15, 0);

function content(firstName = 'Ana Maria Silva') {
    return fromInfotravelNormalized(NORMALIZED, { firstName });
}

/** Intl puts a no-break space after "R$"; compare on plain spaces. */
function render(value = content(), internalPreview = false): string {
    return renderProposalContent(value, { expiresAt: EXPIRES_AT, internalPreview }).replace(/\u00a0/g, ' ');
}

function setup() {
    const clock = { now: Date.UTC(2027, 0, 20, 15, 30) };
    const fake = createFakeProposalRedis(clock);
    return { clock, ...fake, deps: { redis: fake.redis, now: () => clock.now } };
}

function open(id: string, options: { userAgent?: string; query?: string; method?: string } = {}): Request {
    return new Request(`${ORIGIN}/proposta/${id}${options.query ?? ''}`, {
        method: options.method ?? 'GET',
        headers: { 'user-agent': options.userAgent ?? IPHONE, 'cf-connecting-ip': '203.0.113.42' },
    });
}

test('the Infotravel test quotation renders hotel, flights, transfer, extras and the total', () => {
    const text = pageText(render());

    for (const expected of [
        'Ana, sua viagem para Balneario Camboriu',
        '10 a 13 de março de 2027 2 adultos',
        'R$ 6.633,45',
        'Reserva Praia Hotel ★★★★ Balneário Camboriú',
        'Quarto Suíte com Vista ao Mar',
        'Regime Café da manhã com buffet incluido',
        'Hospedagem 3 noites, de 10 a 13 de março de 2027',
        'Entrada qua, 10 mar, a partir das 15:00',
        'Saída sáb, 13 mar, até as 12:00',
        'Cancelamento Tarifa não reembolsável',
        'Ida qua, 10 mar',
        'Volta sáb, 13 mar',
        'Latam 9101 Voo direto Partida: CGH 18:35 São Paulo Duração: 1h05min Chegada: NVT 19:40 Navegantes',
        'Tarifa Light',
        'Traslado Ida (IN) + Retorno (OUT) Aeroporto Navegantes (NVT) Balneário Camboriú',
        'qui, 11 mar Passeio ao Beto Carrero World (sem ingresso) Saindo dos hotéis de Balneário Camboriú',
        'P. 01 Dia Antecipado 2º Lote',
        'Comodidades do hotel (62)',
        // The exact cutoff (12:00 in São Paulo), not just the day.
        'Proposta válida até 04/02/2027 às 12:00',
    ]) {
        assert.ok(text.includes(expected), `missing: ${expected}`);
    }
});

test('the trip summary and the total come before any detail', () => {
    const html = render();
    const text = pageText(html);

    const order = ['id="titulo"', 'id="resumo"', 'id="valor"', 'id="hospedagem"', 'id="voos"', 'id="traslados"', 'id="extras"', 'id="condicoes"'].map((id) => html.indexOf(id));
    assert.ok(order.every((index) => index > 0), String(order));
    assert.deepEqual(order, [...order].sort((a, b) => a - b));
    for (const expected of [
        'Sua viagem em resumo',
        'Hospedagem por 3 noites Reserva Praia Hotel · Café da manhã com buffet incluido',
        'Voos de ida e volta São Paulo – Navegantes · Latam',
        '1 traslado',
        '2 passeios e ingressos Passeio ao Beto Carrero World (sem ingresso) · P. 01 Dia Antecipado',
        'Valor total R$ 6.633,45 para 2 adultos',
    ]) {
        assert.ok(text.includes(expected), `missing: ${expected}`);
    }
});

test('the operator\'s ALL-CAPS names are toned down for display only', () => {
    const value = content();
    const text = pageText(render(value));

    assert.doesNotMatch(text, /PASSEIO AO BETO|RETORNO|ANTECIPADO|TURISMO|LIGHT|CANCELAMENTO|PASSAPORTE ACESSO/);
    // Airport codes and short acronyms stay as they are.
    assert.match(text, /\(NVT\)/);
    assert.match(text, /BRL 380,00/);
    // The stored content keeps the operator's own text.
    assert.equal(value.extras[0].name, 'PASSEIO AO BETO CARRERO WORLD (sem ingresso) - Saindo dos hotéis de Balneário Camboriú');
});

test('a long hotel description is cut at a sentence, with the rest behind "Ler mais"', () => {
    const html = render();

    const about = /<div class="about"><p>([^<]+)<\/p><details><summary><span class="when-closed">Ler mais<\/span><span class="when-open">Ler menos<\/span>/.exec(html);
    assert.ok(about, 'missing the excerpt and its "Ler mais"');
    assert.match(about[1], /e sauna\.$/);
    assert.ok(about[1].length < 260, String(about[1].length));
    assert.ok(pageText(html).includes('Os hóspedes também podem desfrutar de uma piscina infantil.'), 'the rest of the description is still on the page');
});

test('the gallery scrolls without JavaScript and every photo has its size', () => {
    const html = render();

    assert.match(html, /<div class="gallery" role="region" aria-label="Fotos do hotel" tabindex="0">/);
    const images = html.match(/<img [^>]+>/g) ?? [];
    // The hero plus 12 gallery photos.
    assert.equal(images.length, 13);
    for (const image of images) assert.match(image, /width="\d+" height="\d+"/);
    assert.match(images[0], /class="hero-photo"[^>]+fetchpriority="high"/);
    for (const image of images.slice(1)) assert.match(image, /loading="lazy"/);
});

test('the page follows the system dark mode and loads Poppins from its own origin', () => {
    const html = render();

    assert.match(html, /<meta name="color-scheme" content="light dark">/);
    assert.match(html, /@media \(prefers-color-scheme:dark\)\{:root\{--bg:#0f172a;/);
    const fonts = [...html.matchAll(/url\((\/fonts\/[^)]+)\)/g)].map((match) => match[1]);
    assert.deepEqual(fonts, ['/fonts/v1/poppins-400-latin.woff2', '/fonts/v1/poppins-700-latin.woff2', '/fonts/v1/poppins-900-latin.woff2']);
    for (const font of fonts) assert.ok(html.includes(`<link rel="preload" href="${font}" as="font" type="font/woff2" crossorigin>`), font);
    // Nothing else outside the page: no stylesheet, script or third-party font.
    assert.doesNotMatch(html, /<link rel="stylesheet"|<script|fonts\.googleapis|@import/);
});

test('the header shows the Anhangá logo, drawn inline in the brand colors', () => {
    const html = render();
    const header = /<header class="shell top">([\s\S]*?)<\/header>/.exec(html)?.[1] ?? '';

    assert.match(header, /^<svg class="logo" viewBox="[\d .]+" width="\d+" height="\d+" role="img" aria-label="Anhangá Viagens"/);
    assert.match(header, /<g fill="currentColor"><path /);
    // Inline shapes only: nothing for the CSP to load, no link out of the page.
    assert.doesNotMatch(header, /https?:|<img|<image|<use|href=/);
    // Official blue lettering in light mode, the white of the BRANCO file in dark mode.
    assert.match(html, /:root\{[^}]*--logo:#1762a7;/);
    assert.match(html, /@media \(prefers-color-scheme:dark\)\{:root\{[^}]*--logo:#fff;/);
});

test('every font the page references is served from public/ and matches src/fonts', () => {
    const html = render();

    for (const [, path] of html.matchAll(/url\((\/fonts\/v\d+\/([^)]+))\)/g)) {
        const served = readFileSync(new URL(`../public${path}`, import.meta.url));
        const source = readFileSync(new URL(`../src/fonts/${path.split('/').pop()}`, import.meta.url));
        assert.ok(served.equals(source), `${path} differs from src/fonts: copy it to a new /fonts/vN/`);
    }
});

test('only the first name, the total and what is included reach the page (D2, D6)', () => {
    const html = render();

    assert.ok(!html.includes('Maria') && !html.includes('Silva'));
    // No per-item value and no commission, in any spelling.
    for (const value of ['2316', '2.316', '3097', '3.097', '517,01', '517.01', '204,08', '204.08', '345,73', '345.73', '152,85', '152.85']) {
        assert.ok(!html.includes(value), `item value leaked: ${value}`);
    }
    // Nothing about the operator or its agency unit; no booking id or ages.
    assert.doesNotMatch(html, /\bRCA\b|rcaturismo|Santander|CNPJ|9900001|QUOTATION/i);
    // The transfer's local supplier is named once, discreetly, in fine print.
    assert.equal(html.match(/VIP MAR/gi)?.length, 1);
    assert.ok(html.includes('<p class="fine">Operado por Vip Mar Turismo &amp; Receptivo</p>'));
    const stored = JSON.stringify(content());
    // No key for any of them, so nothing about them can be stored.
    assert.doesNotMatch(stored, /"(?:idades|booking_id|ajuste_comissao|valor|voos_valor|logo|condicoes)"/);
    assert.doesNotMatch(stored, /9900001|Santander|rcaturismo/i);
});

test('the conditions are the Anhangá\'s own, never the operator\'s payment terms (D7)', () => {
    const html = render();

    assert.match(html, /Valores sujeitos a disponibilidade/);
    assert.doesNotMatch(html, /Formas de Pagamento|Parcelado|PIX/i);
    // The single call to action is the Anhangá's WhatsApp.
    assert.equal(html.match(/class="cta"/g)?.length, 1);
    assert.match(html, /href="https:\/\/wa\.me\/5511955021519\?text=/);
});

test('calendar days and flight times never shift with the time zone', () => {
    const html = render();

    // `2027-03-10T00:00:00` read as UTC and shown in São Paulo would be 09/03.
    assert.ok(!html.includes('09/03/2027') && !html.includes('ter, 9 mar') && !html.includes('9 a 13 de março'));
    assert.ok(pageText(html).includes('Ida qua, 10 mar'));
});

test('photos load over https from the operator hosts only', () => {
    const value = content();

    assert.ok(value.hotel && value.hotel.photos.length > 0);
    for (const photo of value.hotel.photos) assert.match(photo, /^https:\/\/media\.staticontent\.com\//);
    // The airline logos sit on the operator's domain: never carried over.
    assert.doesNotMatch(JSON.stringify(value), /logo|\.png/);

    const mixed = fromInfotravelNormalized({
        ...NORMALIZED,
        hotel: { ...NORMALIZED.hotel, fotos: ['http://media.staticontent.com/a', 'https://evil.example/b.jpg', 'javascript:alert(1)'] },
    });
    assert.deepEqual(mixed.hotel?.photos, ['https://media.staticontent.com/a']);
    assert.equal(proposalContentSchema.safeParse({ ...mixed, hotel: { ...mixed.hotel, photos: ['https://evil.example/b.jpg'] } }).success, false);
});

test('every value is escaped', () => {
    const value = content();
    assert.ok(value.hotel);
    const hostile = proposalContentSchema.parse({
        ...value,
        firstName: '<b>Ana</b>',
        destination: '"><img src=x onerror=alert(1)>',
        hotel: { ...value.hotel, name: '<script>alert(1)</script>', description: '</p><script>x</script>' },
        extras: [{ name: "Passeio' onmouseover='x", description: '<iframe>' }],
    } satisfies ProposalContentInput);

    const html = render(hostile);

    assert.doesNotMatch(html, /<script|<img src=x|<iframe|<b>Ana/);
    assert.ok(html.includes('&lt;script&gt;alert(1)&lt;/script&gt;'));
    assert.ok(!html.includes("' onmouseover='"));
});

test('the page has no script and a privacy notice linking to the policy', () => {
    const html = render();

    assert.doesNotMatch(html, /<script/i);
    // The notice must match what lib/proposal-opens.ts stores: the instant only.
    assert.match(html, /registramos quando esta página é aberta/);
    assert.match(html, /O registro guarda só a data e a hora: não inclui seu IP, sua localização nem dados do seu aparelho/);
    assert.match(html, /href="https:\/\/www\.anhanga\.tur\.br\/politica-privacidade"/);
});

test('a stored page proposal is served to the customer and counts the open', async () => {
    const { deps, listOf } = setup();
    const { id } = await saveProposal({ content: content(), leadId: 4821 }, deps);

    const response = await handleProposalRequest(open(id), id, deps);
    const text = pageText(await response.text());

    assert.equal(response.status, 200);
    assert.ok(text.includes('Ana, sua viagem para Balneario Camboriu'));
    assert.ok(text.includes('R$ 6.633,45'));
    assert.equal(listOf(opensKey(id)).length, 1);
    const csp = response.headers.get('Content-Security-Policy') ?? '';
    assert.match(csp, /img-src 'self' https:\/\/media\.staticontent\.com https:\/\/media\.infotravel\.com\.br;/);
    // Fonts from our own origin only (#1926); still no script of any kind.
    assert.match(csp, /; font-src 'self';/);
    assert.doesNotMatch(csp, /script-src|font-src[^;]*(?:https?:|data:)/);
    assert.equal(response.headers.get('Referrer-Policy'), 'no-referrer');
});

test('link previews get the generic page: no first name, hotel or price for the preview servers', async () => {
    const { deps } = setup();
    const { id } = await saveProposal({ content: content() }, deps);

    const html = await (await handleProposalRequest(open(id, { userAgent: 'WhatsApp/2.24.21.80 A' }), id, deps)).text();

    assert.doesNotMatch(html, /Ana|Reserva Praia|6\.633|staticontent/);
});

test('the signed internal preview shows the page with the notice and counts nothing', async (t) => {
    process.env.PROPOSAL_PREVIEW_SECRET = PREVIEW_SECRET;
    t.after(() => {
        delete process.env.PROPOSAL_PREVIEW_SECRET;
    });
    const { deps, listOf } = setup();
    const { id } = await saveProposal({ content: content() }, deps);
    const signature = await createProposalPreviewSignature(id, PREVIEW_SECRET);

    const html = await (await handleProposalRequest(open(id, { query: `?previa=${signature}` }), id, deps)).text();

    assert.match(html, /Prévia interna/);
    assert.match(html, /Reserva Praia Hotel/);
    assert.equal(listOf(opensKey(id)).length, 0);
});

test('a proposal is either a page or a redirect, and invalid content is refused', async () => {
    const { deps } = setup();
    const redirectUrl = 'https://premium.infotravel.com.br/orcamento-web/pt/link?token=abc';

    await assert.rejects(saveProposal({ content: content(), redirectUrl }, deps), /either a redirect or a page/);
    await assert.rejects(
        saveProposal({ content: { ...content(), total: { amount: 10, currency: 'USD' } } as unknown as ProposalContentInput }, deps),
        /content failed validation/,
    );
});

test('an impossible or inverted stay is refused before it reaches a page', () => {
    const value = content();
    assert.ok(value.hotel);
    const withRoom = (room: Partial<typeof value.hotel.room>) =>
        proposalContentSchema.safeParse({ ...value, hotel: { ...value.hotel, room: { ...value.hotel?.room, ...room } } }).success;

    assert.equal(withRoom({}), true);
    assert.equal(withRoom({ checkin: '2027-13-45' }), false);
    assert.equal(withRoom({ checkout: '2027-02-30' }), false);
    assert.equal(withRoom({ checkout: '2027-03-10' }), false);
    assert.equal(withRoom({ checkout: '2027-03-09' }), false);
});

test('flights: real round trips only, overnight arrivals dated, impossible times refused', () => {
    const value = content();
    const [outbound, inbound] = value.flights;

    const oneWay = pageText(render({ ...value, flights: [outbound, { ...inbound, from: 'Navegantes (NVT)', to: 'Porto Alegre (POA)' }] }));
    assert.ok(oneWay.includes('Trecho 1') && oneWay.includes('Trecho 2'));
    assert.ok(!oneWay.includes('Volta') && !oneWay.includes('Voos de ida e volta'));

    const overnight = pageText(render({ ...value, flights: [{ ...outbound, departure: '2027-03-10T23:50:00-03:00', arrival: '2027-03-11T08:10:00+01:00' }] }));
    assert.ok(overnight.includes('08:10 chega 11/03'), overnight);

    for (const departure of ['2027-02-31T10:00:00-03:00', '2027-03-10T25:00:00-03:00', '2027-03-10T10:61:00-03:00']) {
        assert.equal(proposalContentSchema.safeParse({ ...value, flights: [{ ...outbound, departure }] }).success, false, departure);
    }
});

test('the refundability is shown when the operator sends no cancellation text', () => {
    const value = content();
    assert.ok(value.hotel);

    const html = render({ ...value, hotel: { ...value.hotel, room: { ...value.hotel.room, cancellation: [], refundable: false } } });

    assert.ok(html.includes('Tarifa não reembolsável'));
});

test('partial data never turns into a false claim', () => {
    const value = content();
    const [outbound, inbound] = value.flights;

    // Unknown stops: no "Voo direto".
    const unknownStops = fromInfotravelNormalized({ ...NORMALIZED, voos: NORMALIZED.voos.map((voo: object) => ({ ...voo, stopsCount: null })) });
    assert.ok(!render(unknownStops).includes('Voo direto'));

    // Flights only: the year still shows, from the flights.
    const { hotel: _hotel, ...withoutHotel } = value;
    assert.ok(pageText(render({ ...withoutHotel, flights: [outbound, inbound] })).includes('10 a 13 de março de 2027 2 adultos'));

    // The whole trip: an overnight flight the day before check-in widens the period.
    const earlyFlight = { ...outbound, departure: '2027-03-09T23:30:00-03:00', arrival: '2027-03-10T07:05:00-03:00' };
    assert.ok(pageText(render({ ...value, flights: [earlyFlight, inbound] })).includes('9 a 13 de março de 2027 2 adultos'));

    // Impossible or incomplete data: refused instead of rendered.
    assert.equal(proposalContentSchema.safeParse({ ...value, flights: [{ ...outbound, arrival: '2027-03-10T17:40:00-03:00' }] }).success, false);
    assert.equal(proposalContentSchema.safeParse({ ...value, flights: [{ ...outbound, duration: '01:75' }] }).success, false);
    assert.throws(() => fromInfotravelNormalized({ ...NORMALIZED, quarto: null }), /hotel and room/);
    assert.throws(() => fromInfotravelNormalized({ ...NORMALIZED, hotel: null }), /hotel and room/);
    assert.throws(() => fromInfotravelNormalized({ ...NORMALIZED, passageiros: { adultos: 2, idades: null } }));
    assert.throws(() => fromInfotravelNormalized({ ...NORMALIZED, passageiros: { adultos: 2, idades: [30] } }));

    // Nothing included: refused.
    assert.equal(proposalContentSchema.safeParse({ ...withoutHotel, flights: [], transfers: [], extras: [] }).success, false);

    // A long full name still yields the first name.
    const longName = fromInfotravelNormalized(NORMALIZED, { firstName: `Ana ${'Beatriz Cavalcanti de Albuquerque '.repeat(3)}` });
    assert.equal(longName.firstName, 'Ana');
});

test('children are counted from the passengers beyond the adults, without storing ages', () => {
    const family = fromInfotravelNormalized({ ...NORMALIZED, passageiros: { adultos: 2, idades: [40, 38, 7] } });

    assert.deepEqual(family.travelers, { adults: 2, children: 1 });
    assert.match(render(family), /2 adultos e 1 criança/);
});

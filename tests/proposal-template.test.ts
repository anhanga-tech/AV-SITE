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
    const html = render();

    for (const expected of [
        'Ana, sua viagem para Balneario Camboriu',
        '10/03/2027 a 13/03/2027 · 2 adultos',
        'R$ 6.633,45',
        'Reserva Praia Hotel - Balneário Camboriú',
        'Suíte com Vista ao Mar',
        'Café da manhã com buffet incluido',
        'Hospedagem · 3 noites',
        'Entrada 10/03/2027 a partir das 15:00',
        'Saída 13/03/2027 até as 12:00',
        'Tarifa não reembolsável',
        'Ida · 10/03',
        'Volta · 13/03',
        'Latam 9101',
        '18:35',
        '19:40',
        'Voo direto · 1h05min · Tarifa LIGHT',
        'Traslado IDA (IN) + RETORNO (OUT) Aeroporto Navegantes (NVT) | Balneário Camboriú',
        'PASSEIO AO BETO CARRERO WORLD',
        'Comodidades do hotel (62)',
        // The exact cutoff (12:00 in São Paulo), not just the day.
        'Proposta válida até 04/02/2027 às 12:00',
    ]) {
        assert.ok(html.includes(expected), `missing: ${expected}`);
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
    assert.equal(html.match(/VIP MAR/g)?.length, 1);
    assert.ok(html.includes('<p class="fine">Operado por VIP MAR TURISMO &amp; RECEPTIVO</p>'));
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
    assert.ok(!html.includes('09/03/2027'));
    assert.ok(html.includes('Ida · 10/03'));
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
    assert.match(html, /registramos quando esta página é aberta/);
    // #1925: the notice must match the policy — a hash derived from the IP is stored.
    assert.match(html, /código derivado do IP/);
    assert.doesNotMatch(html, /Não guardamos seu IP/);
    assert.match(html, /href="https:\/\/www\.anhanga\.tur\.br\/politica-privacidade"/);
});

test('a stored page proposal is served to the customer and counts the open', async () => {
    const { deps, listOf } = setup();
    const { id } = await saveProposal({ content: content(), leadId: 4821 }, deps);

    const response = await handleProposalRequest(open(id), id, deps);
    const html = (await response.text()).replace(/\u00a0/g, ' ');

    assert.equal(response.status, 200);
    assert.ok(html.includes('Ana, sua viagem para Balneario Camboriu'));
    assert.ok(html.includes('R$ 6.633,45'));
    assert.equal(listOf(opensKey(id)).length, 1);
    const csp = response.headers.get('Content-Security-Policy') ?? '';
    assert.match(csp, /img-src 'self' https:\/\/media\.staticontent\.com https:\/\/media\.infotravel\.com\.br;/);
    assert.doesNotMatch(csp, /script-src/);
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

    const oneWay = render({ ...value, flights: [outbound, { ...inbound, from: 'Navegantes (NVT)', to: 'Porto Alegre (POA)' }] });
    assert.ok(oneWay.includes('Trecho 1') && oneWay.includes('Trecho 2'));
    assert.ok(!oneWay.includes('Volta') && !oneWay.includes('Voos de ida e volta'));

    const overnight = render({ ...value, flights: [{ ...outbound, departure: '2027-03-10T23:50:00-03:00', arrival: '2027-03-11T08:10:00+01:00' }] });
    assert.match(overnight, /08:10 <small>\(chega 11\/03\)<\/small>/);

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
    assert.ok(render({ ...withoutHotel, flights: [outbound, inbound] }).includes('10/03/2027 a 13/03/2027 · 2 adultos'));

    // The whole trip: an overnight flight the day before check-in widens the period.
    const earlyFlight = { ...outbound, departure: '2027-03-09T23:30:00-03:00', arrival: '2027-03-10T07:05:00-03:00' };
    assert.ok(render({ ...value, flights: [earlyFlight, inbound] }).includes('09/03/2027 a 13/03/2027 · 2 adultos'));

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

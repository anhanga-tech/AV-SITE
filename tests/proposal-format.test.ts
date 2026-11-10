import test from 'node:test';
import assert from 'node:assert/strict';

import {
    airportCode,
    bulletItems,
    displayCase,
    formatMinutes,
    formatPeriod,
    minutesBetween,
    nameCase,
    placeName,
    sameCity,
    shortDay,
    splitExcerpt,
    splitTitle,
    stripMarkdown,
} from '../lib/proposal-format.ts';

// #1926: display formatting of the proposal page. The ALL-CAPS strings are
// the Infotravel test quotation's own (tests/fixtures/), plus the shapes the
// rule must leave alone.

test('ALL-CAPS runs in names are toned down; codes, acronyms and mixed text are kept', () => {
    const cases: [string, string][] = [
        [
            'PASSEIO AO BETO CARRERO WORLD (sem ingresso) - Saindo dos hotéis de Balneário Camboriú',
            'Passeio ao Beto Carrero World (sem ingresso) - Saindo dos hotéis de Balneário Camboriú',
        ],
        [
            'Traslado IDA (IN) + RETORNO (OUT) Aeroporto Navegantes (NVT) | Balneário Camboriú',
            'Traslado Ida (IN) + Retorno (OUT) Aeroporto Navegantes (NVT) | Balneário Camboriú',
        ],
        ['P. 01 DIA ANTECIPADO - 2º Lote', 'P. 01 Dia Antecipado - 2º Lote'],
        ['VIP MAR TURISMO & RECEPTIVO', 'Vip Mar Turismo & Receptivo'],
        ['LIGHT', 'Light'],
        ['DAY USE', 'Day Use'],
        ['SAO PAULO (GRU)', 'Sao Paulo (GRU)'],
        ['HOTEL DE LA PLAYA', 'Hotel de La Playa'],
        ['A PARTIR DE AMANHÃ', 'A Partir de Amanhã'],
        // Left as they are.
        ['Reserva Praia Hotel - Balneário Camboriú', 'Reserva Praia Hotel - Balneário Camboriú'],
        ['São Paulo (CGH)', 'São Paulo (CGH)'],
        ['Ingresso VIP', 'Ingresso VIP'],
        ['BRL', 'BRL'],
        ['GOL', 'GOL'],
        ['Suíte com Vista ao Mar', 'Suíte com Vista ao Mar'],
        ['', ''],
    ];
    for (const [input, expected] of cases) assert.equal(displayCase(input), expected, input);
});

test('ALL-CAPS runs in running text become sentence case', () => {
    assert.equal(
        displayCase('CANCELAMENTO A partir de 08/03/2027 às 00:00:00 será cobrado BRL 380,00 de penalização.', 'sentence'),
        'Cancelamento a partir de 08/03/2027 às 00:00:00 será cobrado BRL 380,00 de penalização.',
    );
    assert.equal(
        displayCase(stripMarkdown('certidão de nascimento original.**EM CASO DE NO-SHOW PRODUTO NÃO REEMBOLSÁVEL!** - Validade: 10/03/2027'), 'sentence'),
        'certidão de nascimento original.Em caso de no-show produto não reembolsável! - Validade: 10/03/2027',
    );
    assert.equal(displayCase('PASSAPORTE ACESSO - • Adquira o Passaporte', 'sentence'), 'Passaporte acesso - • Adquira o Passaporte');
});

test('first names: shouted or lower-case names are capitalized, mixed case is kept', () => {
    assert.equal(nameCase('ANA'), 'Ana');
    assert.equal(nameCase('ana'), 'Ana');
    assert.equal(nameCase('ÉRICA'), 'Érica');
    assert.equal(nameCase('Ana'), 'Ana');
    assert.equal(nameCase('McKenzie'), 'McKenzie');
});

test('periods read like a person would say them, across months and years', () => {
    assert.equal(formatPeriod('2027-03-10', '2027-03-13'), '10 a 13 de março de 2027');
    assert.equal(formatPeriod('2027-02-28', '2027-03-03'), '28 de fevereiro a 3 de março de 2027');
    assert.equal(formatPeriod('2026-12-28', '2027-01-04'), '28 de dezembro de 2026 a 4 de janeiro de 2027');
    assert.equal(formatPeriod('2027-03-01', '2027-03-05'), '1º a 5 de março de 2027');
    assert.equal(formatPeriod('2027-04-01', '2027-04-01'), '1º de abril de 2027');
});

test('a calendar day gets its weekday from its own digits', () => {
    assert.equal(shortDay('2027-03-10'), 'qua, 10 mar');
    assert.equal(shortDay('2026-12-20'), 'dom, 20 dez');
    // A flight's local time: the day of the airport, whatever the offset.
    assert.equal(shortDay('2027-03-13T23:30:00-03:00'), 'sáb, 13 mar');
});

test('layovers compare the airport\'s wall clock, or the instants when both offsets are known', () => {
    assert.equal(minutesBetween('2026-12-20T10:05', '2026-12-20T20:00'), 595);
    assert.equal(formatMinutes(595), '9h55min');
    assert.equal(formatMinutes(45), '45min');
    assert.equal(formatMinutes(120), '2h');
    // Daylight saving ends between the flights: the offsets tell the real wait.
    assert.equal(minutesBetween('2026-11-01T00:30:00-04:00', '2026-11-01T01:30:00-05:00'), 120);
});

test('airports: code, city and same-city returns', () => {
    assert.equal(airportCode('Navegantes (NVT)'), 'NVT');
    assert.equal(airportCode('Campinas'), undefined);
    assert.equal(placeName('São Paulo (CGH)'), 'São Paulo');
    assert.ok(sameCity('São Paulo (CGH)', 'São Paulo (GRU)'));
    assert.ok(!sameCity('Navegantes (NVT)', 'Porto Alegre (POA)'));
});

test('long names split into a title and a subtitle; short heads do not', () => {
    assert.deepEqual(splitTitle('Reserva Praia Hotel - Balneário Camboriú'), { title: 'Reserva Praia Hotel', subtitle: 'Balneário Camboriú' });
    assert.deepEqual(splitTitle('Traslado Ida (IN) | Balneário Camboriú'), { title: 'Traslado Ida (IN)', subtitle: 'Balneário Camboriú' });
    assert.deepEqual(splitTitle('Wi-Fi grátis'), { title: 'Wi-Fi grátis' });
    assert.deepEqual(splitTitle('P. 1 - Lote'), { title: 'P. 1 - Lote' });
});

test('a long description is cut at a sentence; a short one is kept whole', () => {
    const sentence = 'Uma frase de exemplo com algumas palavras a mais.';
    const long = Array.from({ length: 12 }, () => sentence).join(' ');
    const { excerpt, rest } = splitExcerpt(long);
    assert.ok(excerpt.endsWith('.') && excerpt.length <= 220, excerpt);
    assert.equal(`${excerpt} ${rest}`, long);

    assert.deepEqual(splitExcerpt(sentence), { excerpt: sentence });
    // One huge sentence: nothing sensible to cut, shown whole.
    const huge = `${'palavra '.repeat(80)}fim.`;
    assert.deepEqual(splitExcerpt(huge), { excerpt: huge });
});

test('the operator\'s inline bullets become a list', () => {
    const { intro, items } = bulletItems('Passaporte acesso - • Adquira com antecedência.• Sujeito a alteração.• Lote limitado;• Não cumulativo.');
    assert.equal(intro, 'Passaporte acesso');
    assert.deepEqual(items, ['Adquira com antecedência.', 'Sujeito a alteração.', 'Lote limitado', 'Não cumulativo.']);
    assert.deepEqual(bulletItems('Sem marcadores.'), { intro: 'Sem marcadores.', items: [] });
});

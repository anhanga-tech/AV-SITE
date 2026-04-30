import test from 'node:test';
import assert from 'node:assert/strict';
import { scoreField, matchProfile, SCORES, NEUTRAL_SCORE } from '../lib/quiz-scoring';

// ---------------------------------------------------------------------------
// scoreField
// ---------------------------------------------------------------------------

test('scoreField returns the direct score for a single known option', () => {
    assert.equal(scoreField(SCORES.destino, ['caribe']), 1);
    assert.equal(scoreField(SCORES.destino, ['asia']), 5);
    assert.equal(scoreField(SCORES.ritmo, ['planejado']), 1);
    assert.equal(scoreField(SCORES.ritmo, ['livre']), 5);
});

test('scoreField averages and rounds for multi-select', () => {
    // caribe=1, asia=5 → avg 3.0
    assert.equal(scoreField(SCORES.destino, ['caribe', 'asia']), 3);
    // europa=3, latam=4, africa-oriente=5 → avg 4.0
    assert.equal(scoreField(SCORES.destino, ['europa', 'latam', 'africa-oriente']), 4);
    // caribe=1, surpresa=3 → avg 2.0
    assert.equal(scoreField(SCORES.destino, ['caribe', 'surpresa']), 2);
});

test('scoreField falls back to NEUTRAL_SCORE for unknown option ids', () => {
    assert.equal(scoreField(SCORES.destino, ['desconhecido']), NEUTRAL_SCORE);
    // mix of known and unknown: (1 + NEUTRAL_SCORE) / 2 = 2.0
    assert.equal(scoreField(SCORES.destino, ['caribe', 'desconhecido']), Math.round((1 + NEUTRAL_SCORE) / 2));
});

test('scoreField returns 0 for empty selection', () => {
    assert.equal(scoreField(SCORES.destino, []), 0);
});

// ---------------------------------------------------------------------------
// matchProfile — boundary conditions
// ---------------------------------------------------------------------------

// Score reference for boundary tests:
// destino: caribe=1, surpresa=3, latam=4, asia=5
// cena: wellness=1, familia=2, microescapada=3, natureza=4, aventura=5
// companhia: familia=1, parceiro=3, variado=3, solo=5
// frustracao: hotel-ruim=2, caro-demais=2, genericas=3, multidao=4, sem-liberdade=5
// ritmo: planejado=1, semi-planejado=3, quase-livre=4, livre=5

test('matchProfile returns escapista for score at upper boundary (9)', () => {
    // cena=wellness(1) + companhia=familia(1) + frustracao=hotel-ruim(2) + ritmo=planejado(1) + destino=asia(5) = 10, overshoot
    // Use: destino=latam(4)+cena=wellness(1)+companhia=familia(1)+frustracao=hotel-ruim(2)+ritmo=planejado(1) = 9
    const answers = {
        destino: ['latam'],
        cena: ['wellness'],
        companhia: ['familia'],
        frustracao: ['hotel-ruim'],
        horizonte: ['tempo'],
        ritmo: ['planejado'],
    };
    assert.equal(matchProfile(answers), 'escapista');
});

test('matchProfile returns bon-vivant at lower boundary (10)', () => {
    // destino=asia(5)+cena=wellness(1)+companhia=familia(1)+frustracao=hotel-ruim(2)+ritmo=planejado(1) = 10
    const answers = {
        destino: ['asia'],
        cena: ['wellness'],
        companhia: ['familia'],
        frustracao: ['hotel-ruim'],
        horizonte: ['destino'],
        ritmo: ['planejado'],
    };
    assert.equal(matchProfile(answers), 'bon-vivant');
});

test('matchProfile returns bon-vivant at upper boundary (13)', () => {
    // destino=surpresa(3)+cena=familia(2)+companhia=variado(3)+frustracao=genericas(3)+ritmo=semi-planejado(3) = 14, overshoot
    // destino=surpresa(3)+cena=familia(2)+companhia=parceiro(3)+frustracao=hotel-ruim(2)+ritmo=semi-planejado(3) = 13
    const answers = {
        destino: ['surpresa'],
        cena: ['familia'],
        companhia: ['parceiro'],
        frustracao: ['hotel-ruim'],
        horizonte: ['budget'],
        ritmo: ['semi-planejado'],
    };
    assert.equal(matchProfile(answers), 'bon-vivant');
});

test('matchProfile returns viajante-de-verdade at lower boundary (14)', () => {
    // destino=surpresa(3)+cena=familia(2)+companhia=variado(3)+frustracao=genericas(3)+ritmo=semi-planejado(3) = 14
    const answers = {
        destino: ['surpresa'],
        cena: ['familia'],
        companhia: ['variado'],
        frustracao: ['genericas'],
        horizonte: ['companhia'],
        ritmo: ['semi-planejado'],
    };
    assert.equal(matchProfile(answers), 'viajante-de-verdade');
});

test('matchProfile returns viajante-de-verdade at upper boundary (17)', () => {
    // destino=latam(4)+cena=natureza(4)+companhia=variado(3)+frustracao=multidao(4)+ritmo=semi-planejado(3) = 18, overshoot
    // destino=latam(4)+cena=natureza(4)+companhia=variado(3)+frustracao=hotel-ruim(2)+ritmo=semi-planejado(3) = 16, undershoot
    // destino=latam(4)+cena=natureza(4)+companhia=variado(3)+frustracao=genericas(3)+ritmo=semi-planejado(3) = 17
    const answers = {
        destino: ['latam'],
        cena: ['natureza'],
        companhia: ['variado'],
        frustracao: ['genericas'],
        horizonte: ['tempo'],
        ritmo: ['semi-planejado'],
    };
    assert.equal(matchProfile(answers), 'viajante-de-verdade');
});

test('matchProfile returns desbravador at lower boundary (18)', () => {
    // destino=latam(4)+cena=natureza(4)+companhia=variado(3)+frustracao=multidao(4)+ritmo=semi-planejado(3) = 18
    const answers = {
        destino: ['latam'],
        cena: ['natureza'],
        companhia: ['variado'],
        frustracao: ['multidao'],
        horizonte: ['destino'],
        ritmo: ['semi-planejado'],
    };
    assert.equal(matchProfile(answers), 'desbravador');
});

test('matchProfile returns desbravador at upper boundary (21)', () => {
    // destino=africa-oriente(5)+cena=aventura(5)+companhia=solo(5)+frustracao=sem-liberdade(5)+ritmo=quase-livre(4) = 24, overshoot
    // destino=latam(4)+cena=aventura(5)+companhia=solo(5)+frustracao=sem-liberdade(5)+ritmo=semi-planejado(3) = 22, overshoot
    // destino=surpresa(3)+cena=aventura(5)+companhia=solo(5)+frustracao=multidao(4)+ritmo=semi-planejado(3) = 20, undershoot
    // destino=latam(4)+cena=aventura(5)+companhia=solo(5)+frustracao=hotel-ruim(2)+ritmo=quase-livre(4) = 20, undershoot
    // destino=latam(4)+cena=aventura(5)+companhia=solo(5)+frustracao=multidao(4)+ritmo=semi-planejado(3) = 21
    const answers = {
        destino: ['latam'],
        cena: ['aventura'],
        companhia: ['solo'],
        frustracao: ['multidao'],
        horizonte: ['budget'],
        ritmo: ['semi-planejado'],
    };
    assert.equal(matchProfile(answers), 'desbravador');
});

test('matchProfile returns nomade-de-alma for score above 21 (22)', () => {
    // destino=latam(4)+cena=aventura(5)+companhia=solo(5)+frustracao=sem-liberdade(5)+ritmo=semi-planejado(3) = 22
    const answers = {
        destino: ['latam'],
        cena: ['aventura'],
        companhia: ['solo'],
        frustracao: ['sem-liberdade'],
        horizonte: ['destino'],
        ritmo: ['semi-planejado'],
    };
    assert.equal(matchProfile(answers), 'nomade-de-alma');
});

// ---------------------------------------------------------------------------
// horizonte (P5/BANT) must not affect score
// ---------------------------------------------------------------------------

test('matchProfile is not affected by horizonte field (BANT excluded)', () => {
    const base = {
        destino: ['surpresa'],
        cena: ['wellness'],
        companhia: ['familia'],
        frustracao: ['hotel-ruim'],
        ritmo: ['planejado'],
    };
    const bantValues = ['budget', 'tempo', 'companhia', 'destino'];
    const results = bantValues.map((v) => matchProfile({ ...base, horizonte: [v] }));
    assert.ok(results.every((r) => r === results[0]), 'horizonte value must not change the profile');
});

// ---------------------------------------------------------------------------
// SCORES does not include horizonte (structural guarantee)
// ---------------------------------------------------------------------------

test('SCORES table excludes the horizonte/BANT field', () => {
    assert.ok(!('horizonte' in SCORES), 'horizonte must not be in SCORES');
    assert.ok('destino' in SCORES);
    assert.ok('cena' in SCORES);
    assert.ok('companhia' in SCORES);
    assert.ok('frustracao' in SCORES);
    assert.ok('ritmo' in SCORES);
    assert.equal(Object.keys(SCORES).length, 5);
});

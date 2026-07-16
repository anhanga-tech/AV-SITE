import test from 'node:test';
import assert from 'node:assert/strict';

import { isOfferExpired, getActiveOffers } from '../lib/cruise-offers-schedule.js';
import { CRUISE_OFFERS } from '../data/cruiseOffers.ts';

// Data fixa em vez do relógio: o filtro é determinístico e os testes não podem
// depender de quando rodam nem de process.env — mesmo princípio de
// tests/blog-schedule.test.ts.
const HOJE = '2027-01-15';

test('isOfferExpired: expira só a partir do dia seguinte a expiraEm', () => {
  // Válida no próprio dia de expiraEm.
  assert.equal(isOfferExpired('2027-01-15', HOJE), false);
  // Válida antes.
  assert.equal(isOfferExpired('2027-02-01', HOJE), false);
  // Expirada no dia seguinte.
  assert.equal(isOfferExpired('2027-01-14', HOJE), true);
});

test('isOfferExpired: sem expiraEm nunca expira', () => {
  assert.equal(isOfferExpired(undefined, HOJE), false);
});

test('getActiveOffers: remove só as vencidas e preserva a ordem', () => {
  const offers = [
    { id: 'a', expiraEm: '2027-02-01' },
    { id: 'b', expiraEm: '2027-01-10' }, // vencida
    { id: 'c', expiraEm: '2027-01-15' }, // último dia — ainda válida
    { id: 'd', expiraEm: '2026-12-31' }, // vencida
  ];
  const ativos = getActiveOffers(offers, HOJE);
  assert.deepEqual(
    ativos.map((o) => o.id),
    ['a', 'c'],
  );
});

test('getActiveOffers: lista vazia quando tudo expirou', () => {
  const offers = [
    { id: 'a', expiraEm: '2020-01-01' },
    { id: 'b', expiraEm: '2019-06-30' },
  ];
  assert.deepEqual(getActiveOffers(offers, HOJE), []);
});

test('CRUISE_OFFERS: dados-semente são bem formados', () => {
  assert.ok(CRUISE_OFFERS.length >= 4 && CRUISE_OFFERS.length <= 8, 'entre 4 e 8 ofertas');
  // No máximo uma featured (o layout destaca uma só).
  const featured = CRUISE_OFFERS.filter((o) => o.featured);
  assert.ok(featured.length <= 1, 'no máximo uma oferta featured');
  // ids únicos (viram React key / data-tracking).
  const ids = new Set(CRUISE_OFFERS.map((o) => o.id));
  assert.equal(ids.size, CRUISE_OFFERS.length, 'ids únicos');
  for (const o of CRUISE_OFFERS) {
    assert.ok(/^\d{4}-\d{2}-\d{2}$/.test(o.expiraEm), `expiraEm ISO em ${o.id}`);
    assert.ok(o.roteiro.length >= 2, `roteiro com escalas em ${o.id}`);
    assert.ok(o.notaCuratorial.length > 0, `nota curatorial em ${o.id}`);
  }
});

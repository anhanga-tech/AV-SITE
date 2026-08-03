import test from 'node:test';
import assert from 'node:assert/strict';

import { getActiveOffers, isOfferExpired } from '../lib/cruise-offers-schedule.js';
import { PASTORE_PACKAGES } from '../data/pastorePackages.ts';

// Data fixa em vez do relógio: mesmo princípio de tests/cruise-offers-schedule.test.ts.
const HOJE = '2027-01-15';

test('PASTORE_PACKAGES: ids são únicos (drivam React key e data-tracking)', () => {
  const ids = PASTORE_PACKAGES.map((p) => p.id);
  assert.equal(new Set(ids).size, ids.length);
});

test('PASTORE_PACKAGES: no máximo um pacote em destaque', () => {
  const featuredCount = PASTORE_PACKAGES.filter((p) => p.featured).length;
  assert.ok(featuredCount <= 1, `esperado no máximo 1 featured, encontrado ${featuredCount}`);
});

test('PASTORE_PACKAGES: getActiveOffers remove os pacotes vencidos e preserva a ordem', () => {
  const active = getActiveOffers(PASTORE_PACKAGES, HOJE);
  for (const pacote of active) {
    assert.equal(isOfferExpired(pacote.expiraEm, HOJE), false, `${pacote.id} deveria estar ativo`);
  }
  const activeIds = active.map((p) => p.id);
  const expectedIds = PASTORE_PACKAGES.filter((p) => !isOfferExpired(p.expiraEm, HOJE)).map((p) => p.id);
  assert.deepEqual(activeIds, expectedIds);
});

test('PASTORE_PACKAGES: todos os pacotes cadastrados têm noites e categoria válidas', () => {
  for (const pacote of PASTORE_PACKAGES) {
    assert.ok(pacote.noites > 0, `${pacote.id} deveria ter noites > 0`);
    assert.ok(
      pacote.categoria === 'Nacional' || pacote.categoria === 'Internacional',
      `${pacote.id} tem categoria inválida: ${pacote.categoria}`
    );
  }
});

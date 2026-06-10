import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

// Regressão da auditoria Ahrefs jun/2026: propriedades fora do vocabulário schema.org
// ("keywords" em Service, "blog" em Organization) geravam erro de validação em 8 páginas.

const readRepoFile = (path: string) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('ServiceSchema does not emit "keywords" (invalid for Service type)', async () => {
  const source = await readRepoFile('components/schemas/ServiceSchema.tsx');
  assert.doesNotMatch(source, /keywords\s*[:=]/);
});

test('OrganizationSchema does not emit "blog" (not a schema.org property)', async () => {
  const source = await readRepoFile('components/schemas/OrganizationSchema.tsx');
  assert.doesNotMatch(source, /"blog"\s*:/);
});

test('no page passes the removed keywords prop to ServiceSchema', async () => {
  const pages = [
    'pages/Home.tsx',
    'pages/landings/BetoCarreroLanding.tsx',
    'pages/landings/OrlandoLanding.tsx',
    'pages/landings/MelhorIdadeLanding.tsx',
    'pages/landings/LollapaloozaLanding.tsx',
    'pages/landings/CuradoriaCruzeirosBrasilLanding.tsx',
    'pages/landings/ConsultoriaDeViagemLanding.tsx',
  ];
  for (const page of pages) {
    const source = await readRepoFile(page);
    assert.doesNotMatch(source, /keywords=\{/, `${page} still passes keywords prop`);
  }
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import { BASE_PRERENDER_ROUTES } from '../lib/prerender-routes.js';
import { STATIC_SITEMAP_ENTRIES } from '../lib/site-routes.js';
import {
  BOOKABLE_PARKS,
  CREDENTIALED_PARKS,
  PARKS,
  PARQUES_FAQ_ITEMS,
} from '../components/parques-brasil/constants.ts';

const HUB_ROUTE = '/parques-brasil';

async function readRepoFile(relativePath: string): Promise<string> {
  return readFile(new URL(`../${relativePath}`, import.meta.url), 'utf8');
}

test('o hub está registrado como rota estática e é prerenderizado', () => {
  const routes = STATIC_SITEMAP_ENTRIES.map((entry) => entry.route);
  assert.ok(routes.includes(HUB_ROUTE), `${HUB_ROUTE} ausente de STATIC_SITEMAP_ENTRIES`);
  // BASE_PRERENDER_ROUTES deriva do sitemap: sem a entrada acima, o hub seria
  // servido como shell vazio e o conteúdo não existiria para crawler nem LLM.
  assert.ok(BASE_PRERENDER_ROUTES.includes(HUB_ROUTE), `${HUB_ROUTE} não entra no prerender`);
});

test('só parques com credenciamento declarado são marcados como credenciados', async () => {
  // O OrganizationSchema é a declaração pública de credenciamento da agência.
  // Marcar um parque como `credenciado` sem constar lá seria prometer emissão
  // oficial de ingresso que a Anhangá não pode entregar.
  const organizationSchema = await readRepoFile('components/schemas/OrganizationSchema.tsx');

  for (const park of CREDENTIALED_PARKS) {
    assert.ok(
      organizationSchema.includes(`"name": "${park.name}"`),
      `${park.name} está como credenciado mas não consta no OrganizationSchema`,
    );
  }

  assert.deepEqual(
    CREDENTIALED_PARKS.map((park) => park.name).sort(),
    ['Beto Carrero World', 'Hopi Hari'],
  );
});

test('parque sem página própria não declara href', () => {
  const routedParks = PARKS.filter((park) => park.href);
  const appSource = () => readRepoFile('App.tsx');

  return appSource().then((source) => {
    for (const park of routedParks) {
      assert.ok(
        source.includes(`path="${park.href}"`),
        `${park.name} aponta para ${park.href}, que não é uma rota registrada`,
      );
    }
  });
});

test('parque em obras fica fora da comparação e do que se vende', () => {
  const upcoming = PARKS.filter((park) => park.tier === 'emBreve');
  assert.ok(upcoming.length > 0, 'fixture esperava ao menos um parque em obras');

  for (const park of upcoming) {
    assert.ok(
      !BOOKABLE_PARKS.some((bookable) => bookable.slug === park.slug),
      `${park.name} ainda não abriu e não pode entrar na tabela comparativa`,
    );
  }
});

test('a filha declara o hub como pai no breadcrumb', async () => {
  const betoCarrero = await readRepoFile('pages/landings/BetoCarreroLanding.tsx');
  assert.ok(
    betoCarrero.includes('https://www.anhanga.tur.br/parques-brasil/'),
    'BetoCarreroLanding deve listar o hub no BreadcrumbSchema',
  );
});

test('o FAQ não promete credenciamento nos parques aquáticos', () => {
  const waterParkNames = PARKS.filter((park) => park.kind === 'Parque aquático').map(
    (park) => park.name,
  );

  const credentialClaim = PARQUES_FAQ_ITEMS.find((item) =>
    item.question.toLowerCase().includes('credenciada'),
  );
  assert.ok(credentialClaim, 'FAQ deve responder sobre credenciamento');

  for (const name of waterParkNames) {
    // Anotação explícita: `assert.ok` é assertion function e, sem o tipo
    // declarado, o TS tenta inferir a partir de um uso posterior da própria
    // variável (TS7022).
    const sentenceWithPark: string | undefined = credentialClaim.answer
      .split('.')
      .find((sentence) => sentence.includes(name));
    assert.ok(sentenceWithPark, `${name} deve ser citado na resposta sobre credenciamento`);
    assert.ok(
      /não temos credenciamento/.test(sentenceWithPark),
      `a frase que cita ${name} precisa deixar claro que não há credenciamento`,
    );
  }
});

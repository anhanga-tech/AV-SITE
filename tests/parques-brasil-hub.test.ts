import React from 'react';
import test from 'node:test';
import assert from 'node:assert/strict';
import { renderToStaticMarkup } from 'react-dom/server';

import { OrganizationSchema } from '../components/schemas/OrganizationSchema';
import { createHeadManager, HeadContext } from '../lib/head';
import { BASE_PRERENDER_ROUTES } from '../lib/prerender-routes.js';
import { STATIC_SITEMAP_ENTRIES } from '../lib/site-routes.js';
import { render } from '../ssr.tsx';
import {
  BOOKABLE_PARKS,
  CREDENTIALED_PARKS,
  PARKS,
  PARQUES_FAQ_ITEMS,
} from '../components/parques-brasil/constants.ts';

const HUB_ROUTE = '/parques-brasil';
const NOT_FOUND_MARKER = 'data-testid="not-found-section"';

interface BreadcrumbListItem {
  name: string;
  item: string;
}

// `render()` (ssr.tsx) compõe a árvore real da rota — Head tags incluem o JSON-LD
// emitido por StructuredData, marcado com `data-av-head="script:ld-json:<id>"`
// (lib/head.tsx). Extrair daqui prova o que a página realmente produz, em vez de
// regex sobre o texto-fonte do componente.
function extractBreadcrumbList(headHtml: string): BreadcrumbListItem[] {
  const match = headHtml.match(
    /<script[^>]*data-av-head="script:ld-json:breadcrumb"[^>]*>(.*?)<\/script>/s,
  );
  assert.ok(match, 'headHtml deve conter o script JSON-LD do breadcrumb');
  const data = JSON.parse(match[1]) as { itemListElement: Array<{ name: string; item: string }> };
  return data.itemListElement.map(({ name, item }) => ({ name, item }));
}

test('o hub está registrado como rota estática e é prerenderizado', () => {
  const routes = STATIC_SITEMAP_ENTRIES.map((entry) => entry.route);
  assert.ok(routes.includes(HUB_ROUTE), `${HUB_ROUTE} ausente de STATIC_SITEMAP_ENTRIES`);
  // BASE_PRERENDER_ROUTES deriva do sitemap: sem a entrada acima, o hub seria
  // servido como shell vazio e o conteúdo não existiria para crawler nem LLM.
  assert.ok(BASE_PRERENDER_ROUTES.includes(HUB_ROUTE), `${HUB_ROUTE} não entra no prerender`);
});

test('só parques com credenciamento declarado são marcados como credenciados', () => {
  // A lista é a fonte de verdade do credenciamento público da agência.
  assert.deepEqual(
    CREDENTIALED_PARKS.map((park) => park.name).sort(),
    ['Beto Carrero World', 'Hopi Hari'],
  );
});

test('OrganizationSchema deriva memberOf da lista de parques credenciados', () => {
  const additionalPark = {
    ...CREDENTIALED_PARKS[0],
    name: 'Parque Credenciado de Teste',
  };
  CREDENTIALED_PARKS.push(additionalPark);

  try {
    const headManager = createHeadManager();
    renderToStaticMarkup(
      React.createElement(
        HeadContext.Provider,
        { value: headManager },
        React.createElement(OrganizationSchema),
      ),
    );

    const organizationTag = headManager
      .getTags()
      .find((tag) => tag.key === 'script:ld-json:organization');
    assert.ok(organizationTag?.innerHTML, 'OrganizationSchema deve emitir JSON-LD');

    const organizationData = JSON.parse(organizationTag.innerHTML) as {
      memberOf?: Array<Record<string, string>>;
    };
    assert.deepEqual(
      organizationData.memberOf,
      CREDENTIALED_PARKS.map((park) => ({
        '@type': 'Organization',
        name: park.name,
        description: 'Agente Credenciado',
      })),
    );
  } finally {
    CREDENTIALED_PARKS.pop();
  }
});

test('parque sem página própria não declara href', async () => {
  const routedParks = PARKS.filter((park) => park.href);

  for (const park of routedParks) {
    const { appHtml } = await render(park.href as string);
    assert.ok(
      !appHtml.includes(NOT_FOUND_MARKER),
      `${park.name} aponta para ${park.href}, que não é uma rota registrada (renderizou NotFound)`,
    );
  }
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
  const { headHtml } = await render('/beto-carrero');
  const items = extractBreadcrumbList(headHtml);

  const hubItem = items.find((item) => item.name === 'Parques no Brasil');
  const hubIndex = items.findIndex((item) => item.name === 'Parques no Brasil');
  const childIndex = items.findIndex((item) => item.name === 'Pacote Beto Carrero');

  assert.equal(
    hubItem?.item,
    'https://www.anhanga.tur.br/parques-brasil/',
    'BetoCarreroLanding deve listar o hub como item do BreadcrumbSchema',
  );
  assert.ok(
    hubIndex !== -1 && hubIndex < childIndex,
    'o hub precisa vir antes da própria página na ordem do breadcrumb',
  );
});

test('hopi-hari declara o hub como pai no breadcrumb', async () => {
  const { headHtml } = await render('/hopi-hari');
  const items = extractBreadcrumbList(headHtml);

  const hubItem = items.find((item) => item.name === 'Parques no Brasil');
  const hubIndex = items.findIndex((item) => item.name === 'Parques no Brasil');
  const childIndex = items.findIndex((item) => item.name === 'Pacote Hopi Hari');

  assert.equal(
    hubItem?.item,
    'https://www.anhanga.tur.br/parques-brasil/',
    'HopiHariLanding deve listar o hub como item do BreadcrumbSchema',
  );
  assert.ok(
    hubIndex !== -1 && hubIndex < childIndex,
    'o hub precisa vir antes da própria página na ordem do breadcrumb',
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

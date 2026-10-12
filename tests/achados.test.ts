import test from 'node:test';
import assert from 'node:assert/strict';

import achadosContent from '../content/achados.json';
import { linksPageConfig } from '../data/linksPage.ts';
import {
  MAX_ACHADOS_VISIVEIS,
  formatIsoDateBR,
  getActiveAchados,
  isValidIsoDate,
  type Achado,
} from '../lib/achados.ts';
import { BASE_PRERENDER_ROUTES, NOINDEX_PRERENDER_ROUTES } from '../lib/prerender-routes.js';
import { STATIC_SITEMAP_ENTRIES } from '../lib/site-routes.js';
import { render } from '../ssr.tsx';

const makeAchado = (id: string, validoAte: string): Achado => ({
  id,
  titulo: `Achado ${id}`,
  destino: 'Destino',
  fornecedor: 'Operadora',
  porQueVale: 'Porque sim.',
  condicoes: 'Condições.',
  validoAte,
  mensagemWhatsapp: `Olá! Vi o achado ${id}.`,
});

test('oferta vencida sai da lista; o último dia de reserva ainda conta', () => {
  const achados = [makeAchado('ontem', '2026-10-28'), makeAchado('hoje', '2026-10-29'), makeAchado('amanha', '2026-10-30')];

  assert.deepEqual(
    getActiveAchados(achados, '2026-10-29').map((achado) => achado.id),
    ['hoje', 'amanha'],
  );
});

test('o prazo mais curto aparece primeiro e a página nunca passa do limite', () => {
  const achados = [
    makeAchado('d', '2026-12-01'),
    makeAchado('a', '2026-11-01'),
    makeAchado('c', '2026-11-20'),
    makeAchado('b', '2026-11-10'),
  ];

  const active = getActiveAchados(achados, '2026-10-01');

  assert.equal(active.length, MAX_ACHADOS_VISIVEIS);
  assert.deepEqual(active.map((achado) => achado.id), ['a', 'b', 'c']);
});

test('data de validade inválida tira a oferta do ar em vez de mantê-la para sempre', () => {
  const achados = [makeAchado('formato-br', '29/10/2026'), makeAchado('dia-inexistente', '2026-02-30'), makeAchado('ok', '2026-11-01')];

  assert.deepEqual(getActiveAchados(achados, '2026-10-01').map((achado) => achado.id), ['ok']);
});

test('isValidIsoDate só aceita datas de calendário reais em YYYY-MM-DD', () => {
  assert.equal(isValidIsoDate('2026-10-29'), true);
  assert.equal(isValidIsoDate('2028-02-29'), true);
  assert.equal(isValidIsoDate('2026-02-29'), false);
  assert.equal(isValidIsoDate('2026-13-01'), false);
  assert.equal(isValidIsoDate('2026-1-01'), false);
});

test('formatIsoDateBR exibe a data no formato brasileiro', () => {
  assert.equal(formatIsoDateBR('2026-10-29'), '29/10/2026');
});

// O conteúdo é editado pelo Decap CMS: estes testes são o portão de qualidade de cada
// alteração, já que o editorial workflow abre PR e o CI roda antes de publicar.
test('todo achado em content/achados.json está completo e bem-formado', () => {
  const achados = achadosContent.achados as Achado[];
  const ids = achados.map((achado) => achado.id);
  assert.equal(new Set(ids).size, ids.length, 'ids de achados duplicados');

  for (const achado of achados) {
    assert.match(achado.id, /^[a-z0-9-]+$/, `id inválido: ${achado.id}`);
    for (const field of ['titulo', 'destino', 'fornecedor', 'porQueVale', 'condicoes', 'mensagemWhatsapp'] as const) {
      assert.ok(achado[field].trim().length > 0, `${achado.id}: campo ${field} vazio`);
    }
    assert.ok(isValidIsoDate(achado.validoAte), `${achado.id}: validoAte deve ser YYYY-MM-DD válido`);
  }
});

// Preço anunciado vincula quem anuncia (CDC, art. 30): sem "a partir de", um valor de uma
// saída específica seria lido como o preço de qualquer saída.
test('preço de achado é sempre "a partir de"', () => {
  for (const achado of achadosContent.achados as Achado[]) {
    if (achado.preco === undefined) continue;
    assert.match(achado.preco, /^A partir de /, `${achado.id}: preço precisa começar com "A partir de"`);
  }
});

test('/achados é prerenderizada e fica fora do sitemap', () => {
  assert.ok(BASE_PRERENDER_ROUTES.includes('/achados'));
  assert.ok(NOINDEX_PRERENDER_ROUTES.includes('/achados'));
  assert.ok(!STATIC_SITEMAP_ENTRIES.some((entry) => entry.route === '/achados'));
});

test('/achados declara noindex e renderiza título com cards ou estado vazio', async () => {
  const { appHtml, headHtml } = await render('/achados');

  assert.match(headHtml, /<meta[^>]*name="robots"[^>]*content="noindex, follow"/);
  assert.match(appHtml, /Achados da quinzena/);
  assert.ok(
    appHtml.includes('data-testid="achado-card"') || appHtml.includes('data-testid="achados-vazio"'),
    'a página deve mostrar achados ou o estado vazio',
  );
});

test('o link de achados do /links aponta para a página', () => {
  const link = linksPageConfig.links.find((item) => item.id === 'achados');
  assert.ok(link, 'link achados ausente de data/linksPage.ts');
  assert.equal(link.type, 'internal');
  assert.equal(link.href, '/achados');
});

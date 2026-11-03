import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import handler from '../api/not-found.ts';

// Rotas inexistentes sob /api/ respondem 404 em JSON (functions/api/[[path]].ts), não o
// 404.html do site: agentes que chamam a API esperam um corpo que conseguem ler.
test('unknown API routes answer 404 with a JSON error body', async () => {
  const response = handler(new Request('https://www.anhanga.tur.br/api/rota-inexistente'));

  assert.equal(response.status, 404);
  assert.match(response.headers.get('Content-Type') ?? '', /^application\/json/);
  assert.equal(response.headers.get('Cache-Control'), 'no-store');
  assert.deepEqual(await response.json(), {
    ok: false,
    code: 'NOT_FOUND',
    error: 'API route not found. See /openapi.json for the available operations.',
  });
});

test('HEAD on an unknown API route keeps the 404 without a body', async () => {
  const response = handler(new Request('https://www.anhanga.tur.br/api/x', { method: 'HEAD' }));
  assert.equal(response.status, 404);
  assert.equal(await response.text(), '');
});

test('the /api catch-all function delegates to the JSON 404 handler', async () => {
  const source = await readFile(new URL('../functions/api/[[path]].ts', import.meta.url), 'utf8');
  assert.match(source, /from '\.\.\/\.\.\/api\/not-found'/);
});

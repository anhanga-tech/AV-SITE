import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const readQuizLanding = (): Promise<string> =>
  readFile(new URL('../pages/landings/QuizAnhangaLanding.tsx', import.meta.url), 'utf8');

test('quiz landing should expose the six Plog question fields from FEL-129', async () => {
  const source = await readQuizLanding();
  const questionIds = [...source.matchAll(/^\s*id:\s*['"]([^'"]+)['"],\r?\n\s*eyebrow:\s*['"]Pergunta \d\d['"]/gm)]
    .map((match) => match[1]);

  assert.deepEqual(questionIds, [
    'destino',
    'cena',
    'companhia',
    'frustracao',
    'horizonte',
    'ritmo',
  ]);

  assert.match(source, /title: 'Você acabou de pousar\. Onde chegou\?'/);
  assert.match(source, /title: 'Como você organiza uma viagem antes de sair\?'/);
  assert.match(source, /6 perguntas rápidas/);
});

test('quiz destination options should use Mautic-aligned destination ids', async () => {
  const source = await readQuizLanding();

  assert.doesNotMatch(source, /id: 'america-n'/);
  assert.match(source, /id: 'america-norte'/);
  assert.match(source, /id: 'africa-oriente'/);
  assert.match(source, /id: 'surpresa'/);
});

test('quiz result submit failure message should announce itself as an alert', async () => {
  const source = await readQuizLanding();
  const submitFailedBranch = source.match(/submitFailed \? \(\s*([\s\S]*?)\s*\) : \(/)?.[1];
  const submitFailedWarning = submitFailedBranch?.match(/<p\b[^>]*>/)?.[0];

  assert.ok(submitFailedBranch, 'missing submitFailed result branch');
  assert.ok(submitFailedWarning, 'missing submit failure warning paragraph');
  assert.match(submitFailedWarning, /\srole="alert"/);
});

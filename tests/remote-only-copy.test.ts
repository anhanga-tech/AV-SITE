import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

// A Anhangá trabalha 100% online (home office): o endereço é só o de registro
// da empresa. Nenhuma página institucional pode prometer atendimento presencial.
const INSTITUTIONAL_FILES = [
  'pages/Contato.tsx',
  'pages/About.tsx',
  'components/about/TrustSection.tsx',
  'components/about/HistoriaSection.tsx',
];

const IN_PERSON_CLAIM = /atendimento presencial|presencialmente|virtual ou presencial|sede f[ií]sica|sede pr[oó]pria/i;
// A pergunta do FAQ de /sobre cita o termo para respondê-lo com "Não".
const ALLOWED_QUESTION = 'A Anhangá tem atendimento presencial?';

test('institutional pages do not promise in-person service', () => {
  for (const file of INSTITUTIONAL_FILES) {
    const source = readFileSync(file, 'utf8').replaceAll(ALLOWED_QUESTION, '');
    const match = source.match(IN_PERSON_CLAIM);
    assert.equal(match, null, `${file} still claims in-person service: "${match?.[0]}"`);
  }
});

test('the in-person FAQ on /sobre answers no', () => {
  const source = readFileSync('pages/About.tsx', 'utf8');
  const answer = source.split(ALLOWED_QUESTION)[1]?.match(/answer:\s*'([^']+)'/)?.[1] ?? '';
  assert.match(answer, /^Não\./);
});

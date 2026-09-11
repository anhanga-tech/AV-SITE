import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

// A Política de Privacidade precisa bater com a matriz de operadores
// (docs/compliance/transferencias-internacionais.md, issue #1542). Achado LGPD-04:
// operadores que recebem dados do site sem constar da seção 6.1. Achado LGPD-05:
// a seção 10 afirmava garantias de transferência sem evidência contratual.

const ROOT = process.cwd();
const read = (rel: string) => fs.readFileSync(path.resolve(ROOT, rel), 'utf8');

const SHARING = read('components/privacy/PrivacySection6Compartilhamento.tsx');
const TRANSFER = read('components/privacy/PrivacySection10TransferenciaInternacional.tsx');

// Um por seção "2.x" da matriz. Ao adicionar ou aposentar um operador na matriz,
// atualize esta lista e a seção 6.1 no mesmo PR.
const ACTIVE_OPERATORS = [
  'Cloudflare, Inc.',
  'Google LLC',
  'Meta Platforms, Inc.',
  'TikTok Pte. Ltd.',
  'Odoo S.A.',
  'Upstash, Inc.',
  'Functional Software, Inc.',
  'Cal.com, Inc.',
  // Conteúdo de terceiros carregado no navegador (seção 2.9 da matriz).
  'OpenStreetMap Foundation',
  'Iconify',
  'Spotify AB',
];

test('seção 6.1 da política lista todos os operadores ativos da matriz', () => {
  const missing = ACTIVE_OPERATORS.filter((name) => !SHARING.includes(name));
  assert.deepEqual(missing, [], `operadores ausentes da seção 6.1: ${missing.join(', ')}`);
});

test('matriz de transferências internacionais cobre os mesmos operadores', () => {
  const matrix = read('docs/compliance/transferencias-internacionais.md');
  const missing = ACTIVE_OPERATORS.filter((name) => !matrix.includes(name));
  assert.deepEqual(missing, [], `operadores ausentes da matriz: ${missing.join(', ')}`);
});

// Afirmações removidas por falta de evidência. Só devem voltar à política quando a
// matriz registrar a evidência correspondente (coluna "Evidência" + revisão do DPO) —
// nesse caso, ajuste este teste no mesmo PR que restaura o texto.
test('seção 10 não afirma garantias de transferência sem evidência', () => {
  const unverifiedClaims = [
    /certifica[çc][õo]es de adequa[çc][ãa]o/i,
    /cl[áa]usulas contratuais padr[ãa]o aprovadas pela ANPD/i,
  ];
  for (const claim of unverifiedClaims) {
    assert.doesNotMatch(TRANSFER, claim);
  }
});

// CRMs aposentados no cut-over para o Odoo (jun/2026) — a página de exclusão
// não pode indicar ao titular um sistema onde os dados dele não estão mais.
test('página de exclusão de dados não cita CRMs aposentados', () => {
  const deletionPage = read('pages/ExclusaoDados.tsx');
  assert.doesNotMatch(deletionPage, /Salesforce|HubSpot/);
});

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
const MATRIX = read('docs/compliance/transferencias-internacionais.md');

// A lista de operadores é DERIVADA da matriz, não mantida à mão. Uma terceira
// cópia manual deixava os dois testes verdes quando um operador entrava só na
// matriz, que é o oposto do invariante prometido (achado de review,
// chatgpt-codex-connector[bot]).
//
// Só a seção 2 conta: um `MATRIX.includes(nome)` cru casaria também com a seção 3
// (fornecedores aposentados) e com o histórico, então um operador *removido* da
// matriz continuaria "presente" pela própria menção da aposentadoria.
function activeMatrixSection(): string {
  const start = MATRIX.indexOf('## 2. Matriz de operadores ativos');
  const end = MATRIX.indexOf('## 3. Fornecedores aposentados');
  assert.ok(start >= 0 && end > start, 'seções 2 e 3 da matriz não localizadas — o parser precisa ser revisto');
  return MATRIX.slice(start, end);
}

/** Subseções `### 2.x` que descrevem fluxo sem nomear um fornecedor próprio. */
const NON_OPERATOR_HEADINGS = /^(Conteúdo de terceiros|Fora do escopo)/;

/**
 * Entradas da matriz que não são destinatários a declarar na seção 6.1, com o
 * motivo. Uma entrada nova na matriz que não esteja aqui **precisa** aparecer na
 * política, ou o teste falha — é isso que garante o invariante.
 */
const NOT_A_RECIPIENT: Record<string, string> = {
  'Traks (software de analytics self-hosted)':
    'software rodando na conta Cloudflare da própria controladora (seção 2.3): o operador é a Cloudflare, já declarada',
};

/**
 * Nome usado na matriz -> nome(s) esperado(s) na seção 6.1, quando os dois
 * diferem. A matriz usa o nome do grupo ou do serviço; a política precisa da
 * entidade. Alias ausente = teste falha apontando o nome extraído, então
 * esquecer de mapear é ruidoso, nunca silencioso.
 */
const POLICY_ALIASES: Record<string, string[]> = {
  'Meta Platforms, Inc. e TikTok Pte. Ltd.': ['Meta Platforms, Inc.', 'TikTok Pte. Ltd.'],
  'WhatsApp (Meta Platforms)': ['WhatsApp Ireland Ltd.'],
  'Functional Software, Inc. (Sentry)': ['Functional Software, Inc.'],
  'unpkg (Cloudflare)': ['unpkg'],
};

function policyNamesFor(matrixName: string): string[] {
  return POLICY_ALIASES[matrixName] ?? [matrixName];
}

/** Operadores com título próprio: `### 2.x <Nome> — <escopo>`. */
function operatorsFromHeadings(): string[] {
  const names: string[] = [];
  for (const [, title] of activeMatrixSection().matchAll(/^### 2\.\d+ (.+)$/gm)) {
    if (NON_OPERATOR_HEADINGS.test(title)) continue;
    // O travessão separa o nome do escopo: "Google LLC — Gemini, GA4, …".
    names.push(title.split('—')[0].trim());
  }
  return names;
}

/**
 * Destinatários da tabela da seção 2.9 (requisições diretas do navegador), que
 * não têm título próprio. Lê a primeira coluna das linhas de dados.
 */
function browserRecipients(): string[] {
  const section = activeMatrixSection();
  const start = section.indexOf('### 2.9 ');
  const end = section.indexOf('### 2.10 ');
  assert.ok(start >= 0 && end > start, 'seção 2.9 da matriz não localizada — o parser precisa ser revisto');
  const table = section.slice(start, end);
  const names: string[] = [];
  for (const [, cell] of table.matchAll(/^\| ([^|]+?) \|/gm)) {
    const name = cell.trim();
    // Cabeçalhos, separadores e a tabela de campos que segue a dos destinatários.
    if (!name || /^(Destinatário|Fornecedor|Campo|-+|:?-+:?)$/.test(name)) continue;
    if (name.startsWith('**')) continue;
    names.push(name);
  }
  return names;
}

const MATRIX_ENTRIES = [...operatorsFromHeadings(), ...browserRecipients()];
const ACTIVE_OPERATORS = MATRIX_ENTRIES.filter((name) => !(name in NOT_A_RECIPIENT)).flatMap(policyNamesFor);

test('o parser encontra os operadores declarados na matriz', () => {
  // Sem isto, uma renomeação de seção ou mudança de formato da tabela faria os
  // testes abaixo virarem no-op silencioso em vez de falhar.
  assert.ok(
    MATRIX_ENTRIES.length >= 12,
    `o parser extraiu só ${MATRIX_ENTRIES.length} entradas da seção 2 — o formato mudou?`
  );
  for (const name of MATRIX_ENTRIES) {
    assert.ok(name.length > 2 && !name.includes('|'), `nome suspeito extraído da matriz: "${name}"`);
  }
});

test('seção 6.1 da política lista todos os operadores ativos da matriz', () => {
  const missing = ACTIVE_OPERATORS.filter((name) => !SHARING.includes(name));
  assert.deepEqual(missing, [], `operadores ausentes da seção 6.1: ${missing.join(', ')}`);
});

test('todo alias e exclusão aponta para um nome que a matriz realmente usa', () => {
  // Órfão indica que a matriz renomeou a entrada e o mapa ficou para trás.
  const orphans = Object.keys(POLICY_ALIASES).filter((name) => !MATRIX_ENTRIES.includes(name));
  assert.deepEqual(orphans, [], `aliases sem entrada correspondente na matriz: ${orphans.join(', ')}`);
  const stale = Object.keys(NOT_A_RECIPIENT).filter((name) => !MATRIX_ENTRIES.includes(name));
  assert.deepEqual(stale, [], `exclusões sem entrada na matriz: ${stale.join(', ')}`);
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

// Sistemas aposentados — CRMs no cut-over para o Odoo (jun/2026), GTM na migração
// para o Zaraz (set/2026). A página de exclusão não pode indicar ao titular um
// sistema onde os dados dele não estão mais.
test('página de exclusão de dados não cita sistemas aposentados', () => {
  const deletionPage = read('pages/ExclusaoDados.tsx');
  assert.doesNotMatch(deletionPage, /Salesforce|HubSpot|\bGTM\b|Google Tag Manager/);
});

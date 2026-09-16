import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

// Guard de segurança para GitHub Actions: toda referência a action de terceiro
// (`uses: owner/repo@ref`) precisa apontar para um SHA de commit completo, não
// para uma tag. Tags são mutáveis — se a conta upstream for comprometida ou a
// tag for re-apontada, o job passa a executar código diferente do que foi
// revisado, com as permissões do `GITHUB_TOKEN` daquele job.
//
// Motivador: #1687 (auto-approve-dependabot.yml), um job `pull_request_target`
// com `pull-requests: write` que entrou usando `@v4`.

const WORKFLOWS_DIR = path.resolve(process.cwd(), '.github/workflows');

// `uses:` com ou sem aspas, em step de job ou em composite action.
const USES_LINE = /^\s*(?:- )?uses:\s*["']?([^"'\s#]+)["']?/;
const FULL_SHA = /^[0-9a-f]{40}$/;

interface UsesRef {
  file: string;
  line: number; // 1-based
  value: string;
}

function extractUses(yamlText: string, file: string): UsesRef[] {
  const refs: UsesRef[] = [];
  yamlText.split('\n').forEach((text, index) => {
    const match = USES_LINE.exec(text);
    if (!match) return;
    refs.push({ file, line: index + 1, value: match[1] });
  });
  return refs;
}

// Actions locais (`./path`) e containers (`docker://`) não têm ref de commit
// para pinar — são versionados pelo próprio repo ou pela tag da imagem.
function requiresPinning(value: string): boolean {
  return !value.startsWith('./') && !value.startsWith('docker://');
}

function isPinned(value: string): boolean {
  const ref = value.split('@')[1];
  return ref !== undefined && FULL_SHA.test(ref);
}

function listWorkflowFiles(): string[] {
  if (!fs.existsSync(WORKFLOWS_DIR)) return [];
  return fs
    .readdirSync(WORKFLOWS_DIR)
    .filter((file) => file.endsWith('.yml') || file.endsWith('.yaml'))
    .map((file) => path.join(WORKFLOWS_DIR, file));
}

// Provas de que o detector funciona (um guard cujo detector está quebrado passa
// vazio e não protege nada).
test('detecta action de terceiro presa a tag mutável', () => {
  const bad = ['jobs:', '  a:', '    steps:', '      - uses: hmarr/auto-approve-action@v4'].join('\n');
  const refs = extractUses(bad, 'bad.yml').filter((ref) => requiresPinning(ref.value));
  assert.equal(refs.length, 1);
  assert.equal(isPinned(refs[0].value), false);
});

test('aceita SHA completo, action local e imagem docker', () => {
  const good = [
    'jobs:',
    '  a:',
    '    steps:',
    '      - uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1',
    '      - uses: "alstr/todo-to-issue-action@37bb7b56e58569ef273b60678048030a7f0c261a" # v5.1.15',
    '      - uses: ./.github/actions/setup',
    '      - uses: docker://alpine:3.20',
  ].join('\n');
  const refs = extractUses(good, 'good.yml');
  assert.equal(refs.length, 4);
  const unpinned = refs.filter((ref) => requiresPinning(ref.value) && !isPinned(ref.value));
  assert.deepEqual(unpinned, []);
});

test('nenhum workflow do repo referencia action de terceiro por tag mutável', () => {
  const offenders = listWorkflowFiles()
    .flatMap((file) => extractUses(fs.readFileSync(file, 'utf8'), path.basename(file)))
    .filter((ref) => requiresPinning(ref.value) && !isPinned(ref.value))
    .map((ref) => `${ref.file}:${ref.line} -> ${ref.value}`);

  assert.deepEqual(
    offenders,
    [],
    `Actions de terceiro devem ser pinadas em SHA completo (com \`# vX.Y.Z\` ao lado):\n${offenders.join('\n')}`,
  );
});

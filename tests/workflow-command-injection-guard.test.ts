import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

// Guard de segurança para GitHub Actions: nenhum bloco `run:` pode interpolar
// diretamente contexto controlável por terceiros — `${{ github.event.* }}`,
// `${{ github.head_ref }}` ou `${{ inputs.* }}` — no corpo do shell. Expressões
// `${{ }}` são substituídas ANTES do shell parsear o script, então um valor com
// command substitution (ex.: um nome de branch `$(comando)`) executaria comandos
// arbitrários no runner. Regressão do #1016 (update-snapshots.yml).
//
// O padrão SEGURO — e o que este guard permite — é mapear a entrada para uma env
// var num bloco `env:` e referenciá-la como `${VAR}` (shell), nunca `${{ }}`.

const WORKFLOWS_DIR = path.resolve(process.cwd(), '.github/workflows');

// Contextos que um terceiro consegue influenciar. `github.event.*` cobre título
// de issue, corpo de PR/comentário, inputs de dispatch, mensagens de commit etc.
// O ponto final em `github.event.` é intencional: não casa `github.event_name`,
// que é o tipo do evento (não controlável pelo atacante).
const UNSAFE_CONTEXT = /\$\{\{[^}]*\b(github\.event\.|github\.head_ref\b|inputs\.)/;

interface RunScript {
  file: string;
  line: number; // 1-based, onde a chave `run:` aparece
  script: string;
}

// Extrai o corpo de cada passo `run:` de um workflow. Cobre block scalars
// (`run: |`, `run: >`) e a forma inline (`run: cmd`). Não usa parser YAML: os
// workflows deste repo são bem-formados e a estrutura por indentação é
// suficiente para isolar o script do resto do mapeamento (env:, with:, etc.),
// evitando falsos positivos no padrão seguro de env var.
function extractRunScripts(yamlText: string, file: string): RunScript[] {
  const lines = yamlText.split('\n');
  const scripts: RunScript[] = [];
  for (let i = 0; i < lines.length; i++) {
    const match = /^(\s*)(- )?run:(\s*)(.*)$/.exec(lines[i]);
    if (!match) continue;
    const keyCol = match[1].length + (match[2] ? 2 : 0);
    const rest = match[4];
    if (/^[|>][+-]?\d*\s*$/.test(rest)) {
      // Block scalar: coleta as linhas seguintes indentadas além da chave `run:`.
      const body: string[] = [];
      let j = i + 1;
      for (; j < lines.length; j++) {
        const bodyLine = lines[j];
        if (bodyLine.trim() === '') {
          body.push('');
          continue;
        }
        const indent = bodyLine.length - bodyLine.trimStart().length;
        if (indent > keyCol) {
          body.push(bodyLine);
        } else {
          break;
        }
      }
      scripts.push({ file, line: i + 1, script: body.join('\n') });
      i = j - 1;
    } else if (rest.trim() !== '') {
      // Forma inline: `run: echo hi`.
      scripts.push({ file, line: i + 1, script: rest });
    }
  }
  return scripts;
}

function listWorkflowFiles(): string[] {
  if (!fs.existsSync(WORKFLOWS_DIR)) return [];
  return fs
    .readdirSync(WORKFLOWS_DIR)
    .filter((file) => file.endsWith('.yml') || file.endsWith('.yaml'))
    .map((file) => path.join(WORKFLOWS_DIR, file));
}

// Provas de que o detector funciona (um guard cujo detector está quebrado passa
// vazio e não protege nada). O caso ruim reproduz a forma exata do #1016.
test('detecta interpolação direta de input não confiável em bloco run (regressão #1016)', () => {
  const vulnerable = [
    'jobs:',
    '  x:',
    '    steps:',
    '    - name: push',
    '      run: |',
    '        git push origin "HEAD:refs/heads/${{ github.event.inputs.branch }}"',
  ].join('\n');
  const flagged = extractRunScripts(vulnerable, 'synthetic-bad.yml').filter((s) =>
    UNSAFE_CONTEXT.test(s.script),
  );
  assert.equal(flagged.length, 1, 'a interpolação vulnerável deveria ter sido detectada');
});

test('permite input não confiável passado via env var (padrão seguro)', () => {
  const hardened = [
    'jobs:',
    '  x:',
    '    steps:',
    '    - name: push',
    '      env:',
    '        BRANCH: ${{ github.event.inputs.branch }}',
    '      run: |',
    '        git push origin "HEAD:refs/heads/${BRANCH}"',
  ].join('\n');
  const flagged = extractRunScripts(hardened, 'synthetic-good.yml').filter((s) =>
    UNSAFE_CONTEXT.test(s.script),
  );
  assert.equal(flagged.length, 0, 'referência via ${BRANCH} no shell não deve ser sinalizada');
});

// O guard precisa ter o que varrer — senão passaria vazio por engano.
test('há workflows e blocos run para o guard varrer', () => {
  const files = listWorkflowFiles();
  assert.ok(files.length > 0, 'nenhum workflow encontrado em .github/workflows');
  const runCount = files.reduce(
    (total, file) => total + extractRunScripts(fs.readFileSync(file, 'utf8'), file).length,
    0,
  );
  assert.ok(runCount > 0, 'nenhum bloco run extraído dos workflows');
});

test('nenhum workflow interpola contexto não confiável em bloco run', () => {
  const findings: string[] = [];
  for (const file of listWorkflowFiles()) {
    const text = fs.readFileSync(file, 'utf8');
    for (const scriptBlock of extractRunScripts(text, path.basename(file))) {
      if (UNSAFE_CONTEXT.test(scriptBlock.script)) {
        findings.push(`${scriptBlock.file}:${scriptBlock.line}`);
      }
    }
  }
  assert.deepEqual(
    findings,
    [],
    `blocos run com interpolação de contexto não confiável (use env var + $VAR): ${findings.join(', ')}`,
  );
});

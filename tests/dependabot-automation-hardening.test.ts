import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

// Cobertura dos dois workflows privilegiados que reagem a PRs do Dependabot.
// Ambos rodam em `pull_request_target` — ou seja, com token de escrita no
// contexto do repositório base — e o de merge tem `contents: write`, que é o
// que efetivamente coloca código em produção via `main`.
//
// Os invariantes travados aqui são os que, se afrouxados, transformariam um PR
// de terceiro em merge automático:
//   1. o gatilho exige Dependabot como ator E como autor da PR;
//   2. o auto-merge só cobre semver-patch/minor (major continua manual);
//   3. nenhum passo faz checkout do código da PR (o token privilegiado nunca
//      encosta em código não revisado).

const APPROVE = new URL('../.github/workflows/auto-approve-dependabot.yml', import.meta.url);
const MERGE = new URL('../.github/workflows/auto-merge-dependabot.yml', import.meta.url);

const DEPENDABOT_GUARD =
  "github.actor == 'dependabot[bot]' && github.event.pull_request.user.login == 'dependabot[bot]'";

test('ambos os workflows exigem Dependabot como ator e como autor da PR', async () => {
  for (const url of [APPROVE, MERGE]) {
    const workflow = await readFile(url, 'utf8');
    assert.ok(
      workflow.includes(`if: ${DEPENDABOT_GUARD}`),
      `${url.pathname} deve gatilhar só para o Dependabot (ator + autor da PR)`,
    );
  }
});

test('nenhum dos workflows faz checkout do código da PR', async () => {
  for (const url of [APPROVE, MERGE]) {
    const workflow = await readFile(url, 'utf8');
    assert.doesNotMatch(
      workflow,
      /uses:\s*actions\/checkout/,
      `${url.pathname} roda em pull_request_target: um checkout traria código não revisado para um job privilegiado`,
    );
  }
});

// Isola o bloco YAML de um step pelo seu conteúdo. Asserção sobre o arquivo
// inteiro não serve aqui: um step de merge incondicional convivendo com outro
// step gated passaria, que é exatamente o furo que este teste existe pra pegar.
function stepContaining(workflow: string, needle: string): string {
  const steps = workflow.split(/^ {6}- /m).slice(1);
  const match = steps.filter((step) => step.includes(needle));
  assert.equal(match.length, 1, `esperava exatamente um step contendo ${needle}`);
  return match[0];
}

test('o próprio step de merge é gated em semver-patch e semver-minor', async () => {
  const workflow = await readFile(MERGE, 'utf8');
  const mergeStep = stepContaining(workflow, 'gh pr merge --auto');

  const gate = mergeStep.split(/\r?\n/).find((line) => /^\s*if:/.test(line));
  assert.ok(gate, 'o step de merge precisa ter um `if:` próprio');
  assert.match(gate, /steps\.metadata\.outputs\.update-type/);
  assert.match(gate, /'version-update:semver-patch'/);
  assert.match(gate, /'version-update:semver-minor'/);
  assert.doesNotMatch(
    gate,
    /semver-major/,
    'major bumps devem ficar fora do auto-merge, para revisão humana',
  );
});

test('auto-merge usa o auto-merge nativo do GitHub, não um merge direto', async () => {
  const workflow = await readFile(MERGE, 'utf8');
  // `--auto` faz o GitHub esperar os required checks. Sem a flag, o job mergearia
  // na hora, ignorando o CI inteiro.
  assert.match(workflow, /gh pr merge --auto\b/);
});

test('o check e2e roda em PRs contra qualquer base, para não travar stacked PRs', async () => {
  // `test` (playwright.yml) é required check na `main`. Com `pull_request:
  // branches: [main]` ele não dispara em PRs stacked, que ficariam presas com o
  // check pendente para sempre — mesma regressão já documentada em `ci.yml`.
  const workflow = await readFile(
    new URL('../.github/workflows/playwright.yml', import.meta.url),
    'utf8',
  );
  const trigger = workflow.slice(workflow.indexOf('on:'), workflow.indexOf('permissions:'));
  assert.match(trigger, /pull_request:\s*\{\}/);
  assert.doesNotMatch(trigger, /pull_request:\s*\n\s*branches:/);
});

import test, { afterEach, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

/*
  `pnpm update:dates` (`--all`) forçava `dateModified = hoje` em todos os MDX e
  reinflava o `lastmod` do sitemap que o hook (#1969/#1973) já protegia. Agora
  o `--all` usa o mesmo critério do hook: só bumpa quando o CORPO mudou em relação
  ao HEAD. O script roda de verdade num repo git temporário.
*/

const SCRIPTS = path.resolve(import.meta.dirname, '..', 'scripts');
const TODAY = new Date().toISOString().slice(0, 10);

const post = (frontmatter: string, body: string) => `---\n${frontmatter}\n---\n\n${body}\n`;

let repo: string;

function git(...args: string[]) {
  const result = spawnSync(
    'git',
    ['-c', 'user.name=Teste', '-c', 'user.email=teste@example.com', '-c', 'commit.gpgsign=false', ...args],
    { cwd: repo, encoding: 'utf8' },
  );
  assert.equal(result.status, 0, `git ${args.join(' ')} falhou: ${result.stderr}`);
  return result.stdout;
}

function write(file: string, content: string) {
  writeFileSync(path.join(repo, file), content, 'utf8');
}

function read(file: string) {
  return readFileSync(path.join(repo, file), 'utf8');
}

function runAll() {
  const result = spawnSync('node', ['scripts/update-post-dates.mjs', '--all'], { cwd: repo, encoding: 'utf8' });
  assert.equal(result.status, 0, `update-post-dates --all falhou: ${result.stderr}`);
  return result.stdout;
}

beforeEach(() => {
  repo = mkdtempSync(path.join(tmpdir(), 'update-post-dates-'));
  mkdirSync(path.join(repo, 'content', 'blog'), { recursive: true });
  mkdirSync(path.join(repo, 'scripts'), { recursive: true });
  copyFileSync(path.join(SCRIPTS, 'update-post-dates.mjs'), path.join(repo, 'scripts', 'update-post-dates.mjs'));
  copyFileSync(path.join(SCRIPTS, 'post-date-diff.mjs'), path.join(repo, 'scripts', 'post-date-diff.mjs'));
  // O gerador real depende do repo inteiro; aqui só interessa que o script o chame.
  write('scripts/generate-blog-manifest.ts', '// stub\n');

  write('content/blog/a.mdx', post('title: "A"\ndate: "2026-01-10"', 'Corpo A.'));
  write('content/blog/b.mdx', post('title: "B"\ndate: "2026-01-10"\ndateModified: "2026-02-01"', 'Corpo B.'));
  git('init', '-q');
  git('add', '.');
  git('commit', '-q', '-m', 'init');
});

afterEach(() => {
  rmSync(repo, { recursive: true, force: true });
});

test('--all numa árvore sem mudança de corpo não reescreve nenhuma data', () => {
  const stdout = runAll();

  assert.equal(git('status', '--porcelain').trim(), '');
  assert.doesNotMatch(stdout, /dateModified →/);
  assert.equal(read('content/blog/b.mdx').match(/^dateModified: "(.+)"$/m)?.[1], '2026-02-01');
  assert.doesNotMatch(read('content/blog/a.mdx'), /dateModified/);
});

test('--all não bumpa quando só o frontmatter mudou', () => {
  write('content/blog/a.mdx', post('title: "A"\ndate: "2026-01-10"\nimageCredit: "Foto: X"', 'Corpo A.'));

  runAll();

  assert.doesNotMatch(read('content/blog/a.mdx'), /dateModified/);
});

test('--all bumpa só os posts cujo corpo mudou em relação ao HEAD', () => {
  write('content/blog/a.mdx', post('title: "A"\ndate: "2026-01-10"', 'Corpo A revisado.'));
  write('content/blog/b.mdx', post('title: "B"\ndate: "2026-01-10"\ndateModified: "2026-02-01"', 'Corpo B revisado.'));
  write('content/blog/c.mdx', post('title: "C"\ndate: "2026-01-10"', 'Corpo C.'));
  git('add', 'content/blog/c.mdx'); // novo no índice, sem versão no HEAD

  const stdout = runAll();

  assert.match(read('content/blog/a.mdx'), new RegExp(`^dateModified: "${TODAY}"$`, 'm'));
  assert.match(read('content/blog/b.mdx'), new RegExp(`^dateModified: "${TODAY}"$`, 'm'));
  assert.doesNotMatch(read('content/blog/b.mdx'), /2026-02-01/);
  assert.match(read('content/blog/c.mdx'), new RegExp(`^dateModified: "${TODAY}"$`, 'm'));
  assert.equal(stdout.match(/dateModified →/g)?.length, 3);
});

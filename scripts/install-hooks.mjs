/**
 * Instala os git hooks do projeto copiando de scripts/hooks/ para .git/hooks/.
 * Executado automaticamente em `pnpm install` via "prepare".
 */

import { copyFileSync, chmodSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const GIT_HOOKS_DIR = '.git/hooks';

if (!existsSync(GIT_HOOKS_DIR)) {
  // CI ou clone sem git — não instala
  process.exit(0);
}

const hooks = ['pre-commit'];

for (const hook of hooks) {
  const src = join('scripts', 'hooks', hook);
  const dest = join(GIT_HOOKS_DIR, hook);
  copyFileSync(src, dest);
  chmodSync(dest, 0o755);
  console.log(`✓ Hook instalado: ${dest}`);
}

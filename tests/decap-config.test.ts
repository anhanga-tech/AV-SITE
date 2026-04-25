import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const adminConfigPath = path.resolve(process.cwd(), 'public/admin/config.yml');
const adminIndexPath = path.resolve(process.cwd(), 'public/admin/index.html');

const adminConfig = fs.readFileSync(adminConfigPath, 'utf8');
const adminIndex = fs.readFileSync(adminIndexPath, 'utf8');

test('Decap CMS config points GitHub OAuth to the production auth proxy', () => {
  assert.match(adminConfig, /base_url:\s+https:\/\/www\.anhanga\.tur\.br\b/);
  assert.match(adminConfig, /auth_endpoint:\s+api\/auth\b/);
});

test('Decap CMS admin HTML sets an explicit base path for config resolution', () => {
  assert.match(adminIndex, /<base\s+href="\/admin\/"\s*\/?>/i);
});

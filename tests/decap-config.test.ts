import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { AUTHORS } from '../data/blogData.ts';

const adminConfigPath = path.resolve(process.cwd(), 'public/admin/config.yml');
const adminIndexPath = path.resolve(process.cwd(), 'public/admin/index.html');

const adminConfig = fs.readFileSync(adminConfigPath, 'utf8');
const adminIndex = fs.readFileSync(adminIndexPath, 'utf8');

interface SelectOption {
  label: string;
  value: string;
}

function extractAuthorOptions(configText: string): SelectOption[] {
  const authorField = configText.match(
    /^\s+- label: Autor\n\s+name: author\n\s+widget: select\n\s+options:\n(?<options>(?:\s+- \{ label: .+\n?)+)/m,
  );

  assert.ok(authorField?.groups?.options, 'Expected Decap author field options to be declared');

  return [...authorField.groups.options.matchAll(/label: ([^,]+), value: ([^ }]+)/g)].map(
    ([, label, value]) => ({ label, value }),
  );
}

test('Decap CMS config points GitHub OAuth to the production auth proxy', () => {
  assert.match(adminConfig, /base_url:\s+https:\/\/www\.anhanga\.tur\.br\b/);
  assert.match(adminConfig, /auth_endpoint:\s+api\/auth\b/);
});

test('Decap CMS author select mirrors the site author registry', () => {
  const authorOptions = extractAuthorOptions(adminConfig).sort((a, b) => a.value.localeCompare(b.value));
  const registeredAuthors = Object.values(AUTHORS)
    .map((author) => ({ label: author.name, value: author.id }))
    .sort((a, b) => a.value.localeCompare(b.value));

  assert.deepEqual(authorOptions, registeredAuthors);
});

test('Decap CMS admin HTML sets an explicit base path for config resolution', () => {
  assert.match(adminIndex, /<base\s+href="\/admin\/"\s*\/?>/i);
});

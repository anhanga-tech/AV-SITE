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
    /^\s+- label: Autor\r?\n\s+name: author\r?\n\s+widget: select\r?\n\s+options:\r?\n(?<options>(?:\s+- \{ label: .+\r?\n?)+)/m,
  );

  const options = authorField?.groups?.options;
  assert.ok(options, 'Expected Decap author field options to be declared');

  return [...options.matchAll(/label: ([^,]+), value: ([^ }]+)/g)].map(
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

test('Decap CMS author select parser accepts CRLF line endings', () => {
  const configWithCrlf = adminConfig.replace(/\n/g, '\r\n');

  assert.deepEqual(extractAuthorOptions(configWithCrlf), extractAuthorOptions(adminConfig));
});

test('Decap CMS admin HTML sets an explicit base path for config resolution', () => {
  assert.match(adminIndex, /<base\s+href="\/admin\/"\s*\/?>/i);
});

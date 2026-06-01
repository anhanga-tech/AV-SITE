import test from 'node:test';
import assert from 'node:assert/strict';

// The regex extracted from api/auth/callback.ts
// We use a literal string and new RegExp to avoid double-escaping issues in the test file itself
// In the source file it was: /^https:\\/\\/(?:[a-zA-Z0-9-]+\\.)*anhanga\\.tur\\.br$/
const originRegex = /^https:\/\/(?:[a-zA-Z0-9-]+\.)*anhanga\.tur\.br$/;

test('OAuth Origin Regex Validation', async (t) => {
  const cases = [
    { origin: 'https://www.anhanga.tur.br', expected: true },
    { origin: 'https://anhanga.tur.br', expected: true },
    { origin: 'https://preview.anhanga.tur.br', expected: true },
    { origin: 'https://dev-123.anhanga.tur.br', expected: true },
    { origin: 'https://sub.sub.anhanga.tur.br', expected: true },
    { origin: 'http://anhanga.tur.br', expected: false }, // Must be https
    { origin: 'https://evil-anhanga.tur.br', expected: false },
    { origin: 'https://anhanga.tur.br.evil.com', expected: false },
    { origin: 'https://notanhanga.tur.br', expected: false },
    { origin: 'https://anhanga.tur.br/path', expected: false }, // Origins don't have paths
    { origin: 'https://attacker.com?.anhanga.tur.br', expected: false },
  ];

  for (const { origin, expected } of cases) {
    await t.test(`should ${expected ? 'accept' : 'reject'} ${origin}`, () => {
      assert.equal(originRegex.test(origin), expected);
    });
  }
});

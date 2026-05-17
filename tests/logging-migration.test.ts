import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const MIGRATED_API_FILES = [
    'api/generate.ts',
    'api/submit-lead.ts',
];

async function readProjectFile(path: string): Promise<string> {
    return await readFile(new URL(`../${path}`, import.meta.url), 'utf8');
}

test('logger service should exist and document DEBUG gating', async () => {
    const [loggerSource, envExample] = await Promise.all([
        readProjectFile('lib/logger.ts'),
        readProjectFile('.env.example'),
    ]);

    assert.match(loggerSource, /export const logger/);
    assert.match(loggerSource, /process\.env\.DEBUG/);
    assert.match(envExample, /^DEBUG=/m);
});

for (const filePath of MIGRATED_API_FILES) {
    test(`${filePath} should use the shared logger instead of direct console calls`, async () => {
        const source = await readProjectFile(filePath);

        assert.match(source, /from ['"]\.\.\/lib\/logger['"]/);
        assert.doesNotMatch(source, /\bconsole\.(?:log|warn|error)\b/);
    });
}

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { logger } from '../lib/logger.ts';

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

test('logger should normalize DEBUG and omit missing optional data', () => {
    const originalDebug = process.env.DEBUG;
    const originalConsoleLog = console.log;
    const originalConsoleInfo = console.info;
    const calls: unknown[][] = [];

    console.log = ((...args: unknown[]) => {
        calls.push(args);
    }) as typeof console.log;
    console.info = ((...args: unknown[]) => {
        calls.push(args);
    }) as typeof console.info;

    try {
        process.env.DEBUG = 'TRUE';

        logger.debug('debug enabled');
        logger.info('info without data');

        assert.deepEqual(calls, [
            ['[debug]', 'debug enabled'],
            ['[info]', 'info without data'],
        ]);
    } finally {
        console.log = originalConsoleLog;
        console.info = originalConsoleInfo;

        if (originalDebug === undefined) {
            delete process.env.DEBUG;
        } else {
            process.env.DEBUG = originalDebug;
        }
    }
});

for (const filePath of MIGRATED_API_FILES) {
    test(`${filePath} should use the shared logger instead of direct console calls`, async () => {
        const source = await readProjectFile(filePath);

        assert.match(source, /from ['"]\.\.\/lib\/logger['"]/);
        assert.doesNotMatch(source, /\bconsole\.(?:log|info|warn|error)\b/);
    });
}

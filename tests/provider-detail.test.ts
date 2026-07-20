import test from 'node:test';
import assert from 'node:assert/strict';
import {
    MAX_PROVIDER_DETAIL_LENGTH,
    readTruncatedProviderDetail,
} from '../lib/conversions/provider-detail.ts';

test('readTruncatedProviderDetail returns a short body unchanged', async () => {
    const detail = await readTruncatedProviderDetail(new Response('boom', { status: 400 }));
    assert.equal(detail, 'boom');
});

test('readTruncatedProviderDetail caps an oversized upstream body', async () => {
    const huge = 'x'.repeat(50_000);
    const detail = await readTruncatedProviderDetail(new Response(huge, { status: 500 }));

    assert.ok(detail.length < huge.length);
    assert.ok(detail.length <= MAX_PROVIDER_DETAIL_LENGTH + '… [truncated]'.length);
    assert.ok(detail.startsWith('x'.repeat(MAX_PROVIDER_DETAIL_LENGTH)));
    assert.ok(detail.endsWith('… [truncated]'));
});

test('readTruncatedProviderDetail honours a custom max length', async () => {
    const detail = await readTruncatedProviderDetail(new Response('abcdef', { status: 400 }), 3);
    assert.equal(detail, 'abc… [truncated]');
});

test('readTruncatedProviderDetail returns empty string when the body cannot be read', async () => {
    const failing = {
        text: () => Promise.reject(new Error('stream error')),
    } as unknown as Response;

    const detail = await readTruncatedProviderDetail(failing);
    assert.equal(detail, '');
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { AuthCallbackQuerySchema } from '../lib/schemas/auth-callback.ts';

test('aceita code e state válidos', () => {
    const result = AuthCallbackQuerySchema.safeParse({ code: 'abc123', state: 'xyz789' });
    assert.equal(result.success, true);
});

test('rejeita code ausente', () => {
    const result = AuthCallbackQuerySchema.safeParse({ state: 'xyz789' });
    assert.equal(result.success, false);
});

test('rejeita state ausente', () => {
    const result = AuthCallbackQuerySchema.safeParse({ code: 'abc123' });
    assert.equal(result.success, false);
});

test('rejeita code como string vazia', () => {
    const result = AuthCallbackQuerySchema.safeParse({ code: '', state: 'xyz789' });
    assert.equal(result.success, false);
});

test('rejeita state como string vazia', () => {
    const result = AuthCallbackQuerySchema.safeParse({ code: 'abc123', state: '' });
    assert.equal(result.success, false);
});

test('rejeita code como null (valor de searchParams.get quando ausente)', () => {
    const result = AuthCallbackQuerySchema.safeParse({ code: null, state: 'xyz789' });
    assert.equal(result.success, false);
});

test('rejeita ambos ausentes', () => {
    const result = AuthCallbackQuerySchema.safeParse({});
    assert.equal(result.success, false);
});

test('preserva valores exatos no resultado parseado', () => {
    const result = AuthCallbackQuerySchema.safeParse({ code: 'my-code', state: 'my-state' });
    assert.equal(result.success, true);
    if (result.success) {
        assert.equal(result.data.code, 'my-code');
        assert.equal(result.data.state, 'my-state');
    }
});

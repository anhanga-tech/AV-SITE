import test from 'node:test';
import assert from 'node:assert/strict';
import { GenerateRequestSchema } from '../lib/schemas/generate.ts';

function validMsg(role: 'user' | 'model' = 'user', text = 'Olá') {
    return { role, parts: [{ text }] };
}

test('aceita payload válido com role user', () => {
    const result = GenerateRequestSchema.safeParse({ contents: [validMsg('user')] });
    assert.equal(result.success, true);
});

test('aceita payload válido com role model', () => {
    const result = GenerateRequestSchema.safeParse({ contents: [validMsg('model')] });
    assert.equal(result.success, true);
});

test('aceita múltiplas mensagens até o limite de 50', () => {
    const contents = Array.from({ length: 50 }, (_, i) => validMsg(i % 2 === 0 ? 'user' : 'model'));
    const result = GenerateRequestSchema.safeParse({ contents });
    assert.equal(result.success, true);
});

test('rejeita contents vazio', () => {
    const result = GenerateRequestSchema.safeParse({ contents: [] });
    assert.equal(result.success, false);
});

test('rejeita contents ausente', () => {
    const result = GenerateRequestSchema.safeParse({});
    assert.equal(result.success, false);
});

test('rejeita contents não-array', () => {
    const result = GenerateRequestSchema.safeParse({ contents: 'invalid' });
    assert.equal(result.success, false);
});

test('rejeita mais de 50 mensagens', () => {
    const contents = Array.from({ length: 51 }, () => validMsg());
    const result = GenerateRequestSchema.safeParse({ contents });
    assert.equal(result.success, false);
});

test('rejeita role inválido', () => {
    const result = GenerateRequestSchema.safeParse({
        contents: [{ role: 'admin', parts: [{ text: 'Olá' }] }],
    });
    assert.equal(result.success, false);
});

test('rejeita parts vazio', () => {
    const result = GenerateRequestSchema.safeParse({
        contents: [{ role: 'user', parts: [] }],
    });
    assert.equal(result.success, false);
});

test('aceita até 20 parts por mensagem', () => {
    const parts = Array.from({ length: 20 }, () => ({ text: 'Olá' }));
    const result = GenerateRequestSchema.safeParse({ contents: [{ role: 'user', parts }] });
    assert.equal(result.success, true);
});

test('rejeita mais de 20 parts por mensagem (DoS guard)', () => {
    const parts = Array.from({ length: 21 }, () => ({ text: 'Olá' }));
    const result = GenerateRequestSchema.safeParse({ contents: [{ role: 'user', parts }] });
    assert.equal(result.success, false);
});

test('rejeita text com mais de 5000 chars', () => {
    const result = GenerateRequestSchema.safeParse({
        contents: [{ role: 'user', parts: [{ text: 'a'.repeat(5001) }] }],
    });
    assert.equal(result.success, false);
});

test('aceita text exatamente com 5000 chars', () => {
    const result = GenerateRequestSchema.safeParse({
        contents: [{ role: 'user', parts: [{ text: 'a'.repeat(5000) }] }],
    });
    assert.equal(result.success, true);
});

test('rejeita part sem campo text', () => {
    const result = GenerateRequestSchema.safeParse({
        contents: [{ role: 'user', parts: [{}] }],
    });
    assert.equal(result.success, false);
});

test('flatten retorna fieldErrors ao falhar', () => {
    const result = GenerateRequestSchema.safeParse({ contents: [] });
    assert.equal(result.success, false);
    if (!result.success) {
        const flat = result.error.flatten();
        assert.ok(flat.fieldErrors || flat.formErrors);
    }
});

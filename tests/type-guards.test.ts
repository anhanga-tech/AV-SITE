import test from 'node:test';
import assert from 'node:assert/strict';
import { isRecord, isObjectWithProp } from '../lib/type-guards.ts';

test('isRecord retorna true para objetos simples', () => {
    assert.equal(isRecord({}), true);
    assert.equal(isRecord({ a: 1 }), true);
});

test('isRecord retorna false para não-objetos', () => {
    assert.equal(isRecord(null), false);
    assert.equal(isRecord([]), false);
    assert.equal(isRecord('string'), false);
    assert.equal(isRecord(42), false);
    assert.equal(isRecord(undefined), false);
});

test('isObjectWithProp retorna true quando prop existe', () => {
    assert.equal(isObjectWithProp({ message: 'erro' }, 'message'), true);
    assert.equal(isObjectWithProp({ message: undefined }, 'message'), true);
});

test('isObjectWithProp retorna false quando prop não existe', () => {
    assert.equal(isObjectWithProp({}, 'message'), false);
    assert.equal(isObjectWithProp(null, 'message'), false);
    assert.equal(isObjectWithProp('string', 'message'), false);
    assert.equal(isObjectWithProp(42, 'message'), false);
});

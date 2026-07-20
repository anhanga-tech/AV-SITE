import test from 'node:test';
import assert from 'node:assert/strict';
import { deriveRotation } from '../components/ui/PassportStamp';

test('deriveRotation is deterministic for the same seed', () => {
    assert.equal(deriveRotation('abc123'), deriveRotation('abc123'));
});

test('deriveRotation stays within the -15..15 range', () => {
    const seeds = ['', 'a', 'r0', 'r1', 'r2', 'r3', 'r4', 'stamp-instance-42', 'São Paulo'];
    for (const seed of seeds) {
        const rotation = deriveRotation(seed);
        assert.ok(rotation >= -15 && rotation <= 15, `rotation ${rotation} out of range for seed "${seed}"`);
    }
});

test('deriveRotation varies across different seeds', () => {
    const rotations = new Set(['r0', 'r1', 'r2', 'r3', 'r4'].map(deriveRotation));
    assert.ok(rotations.size > 1, 'expected different seeds to produce more than one distinct rotation');
});

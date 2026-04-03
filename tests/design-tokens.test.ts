import test from 'node:test';
import assert from 'node:assert/strict';

// Importar os tokens como valor de runtime
import { tokens } from '../lib/design-tokens.ts';

test('tokens exporta as categorias esperadas', () => {
    assert.ok('color'  in tokens, 'tokens.color deve existir');
    assert.ok('shadow' in tokens, 'tokens.shadow deve existir');
    assert.ok('radius' in tokens, 'tokens.radius deve existir');
});

test('tokens.color contém todos os papéis semânticos', () => {
    const expectedKeys = ['action', 'actionDark', 'accent', 'accentHover', 'brand', 'surface', 'surfaceAlt', 'dark', 'muted'];
    for (const key of expectedKeys) {
        assert.ok(key in tokens.color, `tokens.color.${key} deve existir`);
    }
});

test('tokens.shadow contém os tokens de sombra', () => {
    const expectedKeys = ['hard', 'hardYellow', 'hardLg', 'float', 'floatLg', 'glow'];
    for (const key of expectedKeys) {
        assert.ok(key in tokens.shadow, `tokens.shadow.${key} deve existir`);
    }
});

test('tokens.color.action aponta para a classe Tailwind correta', () => {
    assert.equal(tokens.color.action, 'anhanga-action');
});

test('tokens.color.dark aponta para a classe Tailwind correta', () => {
    assert.equal(tokens.color.dark, 'anhanga-dark');
});

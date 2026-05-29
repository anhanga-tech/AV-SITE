import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Button } from '../components/ui/Button.tsx';

test('Button isLoading=true renderiza com disabled e aria-disabled="true"', () => {
    const html = renderToStaticMarkup(
        React.createElement(Button, { isLoading: true }, 'Enviar')
    );
    assert.ok(html.includes('disabled=""'), 'deve conter o atributo disabled=""');
    assert.ok(html.includes('aria-disabled="true"'), 'deve conter aria-disabled="true"');
});

test('Button isLoading=false não tem disabled', () => {
    const html = renderToStaticMarkup(
        React.createElement(Button, { isLoading: false }, 'Enviar')
    );
    assert.ok(!html.includes('disabled=""'), 'não deve ter o atributo disabled=""');
    assert.ok(!html.includes('aria-disabled'), 'não deve ter aria-disabled em botão habilitado');
});

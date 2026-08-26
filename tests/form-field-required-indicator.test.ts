import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { FormField } from '../components/forms/FormField.tsx';

const baseProps = {
  id: 'field-name',
  label: 'Nome',
  value: '',
  onChange: () => {},
  inputClassName: '',
};

test('FormField com required=true mostra indicador visual "*" separado do texto do label', () => {
  const html = renderToStaticMarkup(React.createElement(FormField, { ...baseProps, required: true }));

  // The asterisk is its own element, not baked into the label string (keeps the accessible name clean).
  assert.match(html, /<label[^>]*for="field-name"[^>]*>Nome<span[^>]*aria-hidden="true"[^>]*> \*<\/span><\/label>/);
});

test('FormField sem required não renderiza indicador algum', () => {
  const html = renderToStaticMarkup(React.createElement(FormField, baseProps));

  assert.doesNotMatch(html, /aria-hidden="true"/);
  assert.match(html, /<label[^>]*for="field-name"[^>]*>Nome<\/label>/);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { TextField, validateLeadForm } from '../components/ChatLeadForm.tsx';

const baseProps = {
  id: 'lead-email',
  label: 'E-mail',
  type: 'email' as const,
  value: '',
  placeholder: 'E-mail',
  onChange: () => {},
};

test('TextField com erro associa a mensagem ao input via aria-describedby', () => {
  const html = renderToStaticMarkup(
    React.createElement(TextField, { ...baseProps, error: 'E-mail inválido' })
  );

  // Input is flagged invalid and points at the error message id.
  assert.ok(html.includes('aria-invalid="true"'), 'input deve ter aria-invalid="true"');
  assert.ok(
    html.includes('aria-describedby="lead-email-error"'),
    'input deve referenciar o id da mensagem de erro'
  );
  // Error message carries the matching id and is exposed to assistive tech.
  assert.ok(html.includes('id="lead-email-error"'), 'mensagem de erro deve ter o id correspondente');
  assert.ok(html.includes('role="alert"'), 'mensagem de erro deve ter role="alert"');
  assert.ok(html.includes('E-mail inválido'), 'mensagem de erro deve ser renderizada');
});

test('TextField sem erro não adiciona atributos de erro', () => {
  const html = renderToStaticMarkup(React.createElement(TextField, baseProps));

  assert.ok(!html.includes('aria-invalid'), 'não deve ter aria-invalid sem erro');
  assert.ok(!html.includes('aria-describedby'), 'não deve ter aria-describedby sem erro');
  assert.ok(!html.includes('role="alert"'), 'não deve ter role="alert" sem erro');
});

const validLeadValues = {
  firstName: 'Ana',
  lastName: 'Silva',
  email: 'ana@example.com',
  whatsapp: '11999998888',
  countryCode: '+55',
  destination: 'Orlando',
  defaultBantSummary: 'Need: Disney',
};

test('validateLeadForm — lead válido carrega o consentimento de marketing (→ x_lgpd_consent)', () => {
  const result = validateLeadForm({ ...validLeadValues, acceptedLGPD: true });

  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.marketingOptIn, true);
  }
});

test('validateLeadForm — sem aceite de LGPD a submissão é bloqueada', () => {
  const result = validateLeadForm({ ...validLeadValues, acceptedLGPD: false });

  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.ok(result.fieldErrors);
    assert.equal(result.fieldErrors.lgpd, 'Você deve aceitar os termos');
  }
});

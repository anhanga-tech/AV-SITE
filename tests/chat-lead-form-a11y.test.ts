import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { ChatLeadForm, TextField } from '../components/ChatLeadForm.tsx';
import { validateLeadForm } from '../lib/chat-lead-form-logic.ts';

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

test('TextField renderiza label visual, não apenas placeholder', () => {
  const html = renderToStaticMarkup(React.createElement(TextField, baseProps));

  assert.match(html, /<label[^>]*for="lead-email"[^>]*>E-mail<\/label>/);
  assert.doesNotMatch(html, /<label[^>]*class="sr-only"/);
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

test('ChatLeadForm oferece caminho direto para WhatsApp sem salvar lead', () => {
  const html = renderToStaticMarkup(
    React.createElement(ChatLeadForm, {
      destination: 'Orlando',
      defaultBantSummary: 'Need: Disney',
      getWhatsAppUrl: () => 'https://wa.me/5511999999999',
      prepareLeadSubmitPayload: () => ({
        firstName: 'Ana',
        lastName: 'Silva',
        email: 'ana@example.com',
        whatsapp: '+5511999999999',
        bantSummary: 'Need: Disney',
        destination: 'Orlando',
        event_id: 'lead_test',
        utms: {
          utm_source: null,
          utm_medium: null,
          utm_campaign: null,
          utm_term: null,
          utm_content: null,
        },
      }),
      isSubmittingLead: false,
      onFinalizeLead: async () => ({ ok: true }),
    }),
  );

  assert.match(html, /Ir direto para o WhatsApp/);
});

test('ChatLeadForm não duplica o <label> do campo WhatsApp (regressão: TextField já renderiza o seu)', () => {
  const html = renderToStaticMarkup(
    React.createElement(ChatLeadForm, {
      destination: 'Orlando',
      defaultBantSummary: 'Need: Disney',
      getWhatsAppUrl: () => 'https://wa.me/5511999999999',
      prepareLeadSubmitPayload: () => ({
        firstName: 'Ana',
        lastName: 'Silva',
        email: 'ana@example.com',
        whatsapp: '+5511999999999',
        bantSummary: 'Need: Disney',
        destination: 'Orlando',
        event_id: 'lead_test',
        utms: {
          utm_source: null,
          utm_medium: null,
          utm_campaign: null,
          utm_term: null,
          utm_content: null,
        },
      }),
      isSubmittingLead: false,
      onFinalizeLead: async () => ({ ok: true }),
    }),
  );

  const labelMatches = html.match(/<label[^>]*for="lead-whatsapp"/g) || [];
  assert.equal(labelMatches.length, 1, 'deve haver exatamente um <label htmlFor="lead-whatsapp">');
});

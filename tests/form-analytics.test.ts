import test from 'node:test';
import assert from 'node:assert/strict';
import {
  pushFormAnalyticsEvent,
  type FormAnalyticsEvent,
} from '../utils/formAnalytics.ts';

test('pushFormAnalyticsEvent sends a non-PII form event to dataLayer', () => {
  const pushed: unknown[] = [];
  const previousWindow = globalThis.window;
  Object.defineProperty(globalThis, 'window', {
    value: {
      location: { href: 'https://www.anhanga.tur.br/?email=ana@example.com' },
      dataLayer: { push: (event: unknown) => pushed.push(event) },
    },
    configurable: true,
  });

  try {
    const event: FormAnalyticsEvent = {
      event: 'field_complete',
      formType: 'contact_modal',
      formId: 'contact-modal',
      fieldName: 'email',
      destination: 'ana@example.com',
    };

    pushFormAnalyticsEvent(event);
  } finally {
    Object.defineProperty(globalThis, 'window', {
      value: previousWindow,
      configurable: true,
    });
  }

  assert.equal(pushed.length, 1);
  assert.deepEqual(pushed[0], {
    event: 'field_complete',
    form_type: 'contact_modal',
    form_id: 'contact-modal',
    field_name: 'email',
    page_location: 'https://www.anhanga.tur.br/?email=redacted',
  });
});

test('pushFormAnalyticsEvent redige todos os e-mails/telefones no fallback de URL malformada', () => {
  const pushed: unknown[] = [];
  const previousWindow = globalThis.window;
  // href sem origin válido força o catch de currentPageLocation (new URL() lança),
  // exercitando o fallback baseado em regex global — que deve redigir TODAS as
  // ocorrências, não só a primeira.
  Object.defineProperty(globalThis, 'window', {
    value: {
      location: { href: 'a@b.com and c@d.com and +5511999999999' },
      dataLayer: { push: (event: unknown) => pushed.push(event) },
    },
    configurable: true,
  });

  try {
    pushFormAnalyticsEvent({
      event: 'form_view',
      formType: 'quiz_lead',
      formId: 'quiz-anhanga',
    });
  } finally {
    Object.defineProperty(globalThis, 'window', {
      value: previousWindow,
      configurable: true,
    });
  }

  const pageLocation = (pushed[0] as Record<string, string>).page_location;
  assert.doesNotMatch(pageLocation, /@/, 'nenhum e-mail deve sobrar');
  assert.doesNotMatch(pageLocation, /\d{5,}/, 'nenhum telefone deve sobrar');
});

test('pushFormAnalyticsEvent ignores unknown field names and sensitive destinations', () => {
  const pushed: unknown[] = [];
  const previousWindow = globalThis.window;
  Object.defineProperty(globalThis, 'window', {
    value: {
      location: { href: 'https://www.anhanga.tur.br/quiz/' },
      dataLayer: { push: (event: unknown) => pushed.push(event) },
    },
    configurable: true,
  });

  try {
    pushFormAnalyticsEvent({
      event: 'submit_failure',
      formType: 'quiz_lead',
      formId: 'quiz-anhanga',
      fieldName: 'full_email',
      errorType: 'validation',
      destination: '+5511999999999',
    });
  } finally {
    Object.defineProperty(globalThis, 'window', {
      value: previousWindow,
      configurable: true,
    });
  }

  assert.deepEqual(pushed[0], {
    event: 'submit_failure',
    form_type: 'quiz_lead',
    form_id: 'quiz-anhanga',
    error_type: 'validation',
    page_location: 'https://www.anhanga.tur.br/quiz/',
  });
});

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

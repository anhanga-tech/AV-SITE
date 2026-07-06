import test from 'node:test';
import assert from 'node:assert/strict';
import {
  isFieldCompleteForAnalytics,
  validateContactFormFields,
  validateNpsFormFields,
  validateWaitlistFormFields,
} from '../lib/form-v1-validation.ts';

test('validateContactFormFields rejects optional email when it is malformed', () => {
  const result = validateContactFormFields({
    firstName: 'Ana Silva',
    whatsapp: '(11) 99999-0000',
    email: 'ana@',
  });

  assert.equal(result.valid, false);
  assert.equal(result.errors.email, 'Informe um e-mail válido ou deixe em branco.');
});

test('validateContactFormFields normalizes WhatsApp using the shared backend rule', () => {
  const result = validateContactFormFields({
    firstName: 'Ana Silva',
    whatsapp: '(11) 99999-0000',
    email: '',
  });

  assert.equal(result.valid, true);
  assert.equal(result.normalized.whatsapp, '+5511999990000');
});

test('validateWaitlistFormFields blocks invalid email without requiring opt-in', () => {
  const invalid = validateWaitlistFormFields({ name: 'Ana Maria', email: 'ana@' });
  assert.equal(invalid.valid, false);
  assert.equal(invalid.errors.email, 'Informe um e-mail válido.');

  const valid = validateWaitlistFormFields({ name: 'Ana Maria', email: 'ana@example.com' });
  assert.equal(valid.valid, true);
});

test('validateNpsFormFields requires missing URL identity fields locally', () => {
  const result = validateNpsFormFields({
    firstname: '',
    email: '',
    score: 10,
  });

  assert.equal(result.valid, false);
  assert.equal(result.errors.firstname, 'Informe seu nome.');
  assert.equal(result.errors.email, 'Informe seu e-mail.');
});

test('isFieldCompleteForAnalytics only completes contact fields when useful', () => {
  assert.equal(isFieldCompleteForAnalytics('email', 'ana@'), false);
  assert.equal(isFieldCompleteForAnalytics('email', 'ana@example.com'), true);
  assert.equal(isFieldCompleteForAnalytics('whatsapp', '123'), false);
  assert.equal(isFieldCompleteForAnalytics('whatsapp', '(11) 99999-0000'), true);
  assert.equal(isFieldCompleteForAnalytics('firstName', 'A'), true);
});

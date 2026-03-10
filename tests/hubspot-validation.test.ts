import test from 'node:test';
import assert from 'node:assert/strict';
import { validateHubSpotSignature } from '../lib/hubspot-validation.ts';
import { createHubSpotTestSignature } from './helpers/hubspot-signature.ts';

test('validateHubSpotSignature should normalize supported encoded URL characters', async () => {
  const method = 'POST';
  const body = JSON.stringify([]);
  const timestamp = Date.now().toString();
  const secret = 'test-secret';
  const encodedUrl = 'https://example.com/api/hubspot-webhook?redirect=https%3A%2F%2Ffoo.com%2Ftrip%3Fcontact%40example.com';
  const normalizedUrl = 'https://example.com/api/hubspot-webhook?redirect=https://foo.com/trip?contact@example.com';
  const signature = await createHubSpotTestSignature(method, normalizedUrl, body, timestamp, secret);

  const isValid = await validateHubSpotSignature(signature, timestamp, body, encodedUrl, method, secret);

  assert.equal(isValid, true);
});

test('validateHubSpotSignature should reject a tampered body', async () => {
  const method = 'POST';
  const originalBody = JSON.stringify([{ objectId: 123 }]);
  const tamperedBody = JSON.stringify([{ objectId: 456 }]);
  const timestamp = Date.now().toString();
  const secret = 'test-secret';
  const url = 'https://example.com/api/hubspot-webhook';
  const signature = await createHubSpotTestSignature(method, url, originalBody, timestamp, secret);

  const isValid = await validateHubSpotSignature(signature, timestamp, tamperedBody, url, method, secret);

  assert.equal(isValid, false);
});

test('validateHubSpotSignature should reject a tampered method', async () => {
  const body = JSON.stringify([]);
  const timestamp = Date.now().toString();
  const secret = 'test-secret';
  const url = 'https://example.com/api/hubspot-webhook';
  const signature = await createHubSpotTestSignature('POST', url, body, timestamp, secret);

  const isValid = await validateHubSpotSignature(signature, timestamp, body, url, 'GET', secret);

  assert.equal(isValid, false);
});

test('validateHubSpotSignature should reject a tampered URL', async () => {
  const method = 'POST';
  const body = JSON.stringify([]);
  const timestamp = Date.now().toString();
  const secret = 'test-secret';
  const signedUrl = 'https://example.com/api/hubspot-webhook?deal=123';
  const tamperedUrl = 'https://example.com/api/hubspot-webhook?deal=456';
  const signature = await createHubSpotTestSignature(method, signedUrl, body, timestamp, secret);

  const isValid = await validateHubSpotSignature(signature, timestamp, body, tamperedUrl, method, secret);

  assert.equal(isValid, false);
});

test('validateHubSpotSignature should reject malformed base64 signatures', async () => {
  const isValid = await validateHubSpotSignature(
    'not-base64@@@',
    Date.now().toString(),
    JSON.stringify([]),
    'https://example.com/api/hubspot-webhook',
    'POST',
    'test-secret'
  );

  assert.equal(isValid, false);
});

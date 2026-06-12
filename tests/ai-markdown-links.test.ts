import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sanitizeAiLinkUrl } from '../lib/ai/safe-link';

test('allows internal relative links', () => {
  assert.equal(sanitizeAiLinkUrl('/blog'), '/blog');
});

test('allows internal anchors', () => {
  assert.equal(sanitizeAiLinkUrl('#secao'), '#secao');
});

test('allows https links to www.anhanga.tur.br', () => {
  assert.equal(
    sanitizeAiLinkUrl('https://www.anhanga.tur.br/consultoria'),
    'https://www.anhanga.tur.br/consultoria',
  );
});

test('allows https links to anhanga.tur.br', () => {
  assert.equal(sanitizeAiLinkUrl('https://anhanga.tur.br/x'), 'https://anhanga.tur.br/x');
});

test('blocks links to other domains', () => {
  assert.equal(sanitizeAiLinkUrl('https://phishing.example/login'), '');
});

test('blocks http (non-https) links to anhanga.tur.br', () => {
  assert.equal(sanitizeAiLinkUrl('http://anhanga.tur.br'), '');
});

test('blocks javascript: links', () => {
  assert.equal(sanitizeAiLinkUrl('javascript:alert(1)'), '');
});

test('blocks data: links', () => {
  assert.equal(sanitizeAiLinkUrl('data:text/html,...'), '');
});

test('blocks lookalike subdomains that are actually other domains', () => {
  assert.equal(sanitizeAiLinkUrl('https://anhanga.tur.br.evil.com'), '');
});

test('blocks unparseable strings', () => {
  assert.equal(sanitizeAiLinkUrl('not a url'), '');
});

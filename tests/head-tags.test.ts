import './helpers/dom-setup.ts';

import React from 'react';
import test, { afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { render, cleanup, act } from '@testing-library/react';

import { Seo } from '../components/Seo.tsx';

/*
  useHeadTags used to JSON.stringify the tags array for its effect dependency
  key, then JSON.parse that same string right back inside the effect instead
  of just using the `tags` closure it already had — a pure-waste round trip
  (full re-parse of the JSON-LD/meta payload) on every mount and on every
  re-render whose content actually changed. These tests pin down the two
  behaviors that fix must preserve: tags are applied to <head>, and a
  re-render with content-equal (but new-identity) tags is a no-op rather than
  a remove/recreate churn.
*/

afterEach(() => {
  cleanup();
  document.head.innerHTML = '';
});

test('applies title and meta tags to document.head on mount', async () => {
  await act(async () => {
    render(React.createElement(Seo, { title: 'Página de teste', description: 'Descrição de teste' }));
  });

  assert.equal(document.title, 'Página de teste | Anhangá Viagens');
  const description = document.head.querySelector('meta[name="description"]');
  assert.equal(description?.getAttribute('content'), 'Descrição de teste');
});

test('re-rendering with content-equal props keeps the same DOM elements', async () => {
  const { rerender } = render(React.createElement(Seo, { title: 'Estável', description: 'Estável' }));
  await act(async () => {});

  const before = document.head.querySelector('meta[name="description"]');
  assert.ok(before);

  await act(async () => {
    rerender(React.createElement(Seo, { title: 'Estável', description: 'Estável' }));
  });

  const after = document.head.querySelector('meta[name="description"]');
  assert.equal(after, before, 'element identity should be preserved when tag content is unchanged');
});

test('removes its tags from document.head on unmount', async () => {
  const { unmount } = render(React.createElement(Seo, { title: 'Sai', description: 'Sai' }));
  await act(async () => {});

  assert.ok(document.head.querySelector('meta[name="description"]'));

  await act(async () => {
    unmount();
  });

  assert.equal(document.head.querySelector('meta[name="description"]'), null);
});

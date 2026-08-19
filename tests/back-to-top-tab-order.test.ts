import './helpers/dom-setup.ts';

import React from 'react';
import test, { afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { render, cleanup, act } from '@testing-library/react';

import BackToTop from '../components/ui/BackToTop.tsx';

/*
  BackToTop hides via opacity/translate only (no `hidden`/`display:none`), so
  without an explicit tabIndex it stayed in the keyboard tab order even while
  invisible — a keyboard user tabbing through the page would land on an
  unlabeled focus stop with no visible indicator. Proves the button is pulled
  out of the tab order (and out of the accessibility tree) until scroll makes
  it visible.
*/

afterEach(() => {
  cleanup();
});

test('is hidden from keyboard and screen-reader users before the page is scrolled', () => {
  const { container } = render(React.createElement(BackToTop));

  const button = container.querySelector('button[aria-label="Voltar ao topo"]');
  assert.ok(button);
  assert.equal(button.getAttribute('aria-hidden'), 'true');
  assert.equal(button.getAttribute('tabindex'), '-1');
});

test('re-enters the tab order once scrolling makes it visible', async () => {
  const { container } = render(React.createElement(BackToTop));

  Object.defineProperty(window, 'scrollY', { value: 500, configurable: true });
  await act(async () => {
    window.dispatchEvent(new Event('scroll'));
    await new Promise((resolve) => requestAnimationFrame(resolve));
  });

  const button = container.querySelector('button[aria-label="Voltar ao topo"]');
  assert.ok(button);
  assert.equal(button.getAttribute('aria-hidden'), 'false');
  assert.equal(button.getAttribute('tabindex'), '0');
});

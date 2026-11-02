import './helpers/dom-setup.ts';

import React from 'react';
import test, { afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { render, cleanup } from '@testing-library/react';

import AIResearchBar from '../components/AIResearchBar.tsx';

/*
  Auditoria 01/11/2026 (#1969): os logos usavam o formato antigo da API Iconify
  com dois-pontos (`logos:openai-icon.svg`), que responde 404 — derrubou o Best
  Practices da home. O formato vigente separa prefixo e ícone por barra.
*/

afterEach(cleanup);

const ICONIFY_PATH = /^https:\/\/api\.iconify\.design\/[a-z0-9-]+\/[a-z0-9-]+\.svg$/;

test('logos das IAs usam o caminho Iconify com barra, não dois-pontos', () => {
  const { container } = render(React.createElement(AIResearchBar));
  const sources = [...container.querySelectorAll('img')].map((img) => img.getAttribute('src') ?? '');

  assert.equal(sources.length, 5);
  for (const src of sources) {
    assert.match(src, ICONIFY_PATH);
  }
});

test('grupo da barra reserva altura mínima para não deslocar o hero', () => {
  const { container } = render(React.createElement(AIResearchBar));
  const group = container.querySelector('[role="group"]');

  assert.ok(group);
  // 80px = texto (20px) + mb-3 (12px) + botões size-12 (48px): reserva a altura real
  // da barra numa linha. Um valor maior abria espaço vazio no desktop e quebrava o
  // snapshot visual da home (5.5rem = 88px, +8px).
  assert.match(group.className, /\bmin-h-20\b/);
});

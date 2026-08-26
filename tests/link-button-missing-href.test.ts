import './helpers/dom-setup.ts';

import React from 'react';
import test, { afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { render, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import { LinkButton } from '../components/links/LinkButton.tsx';
import type { LinkItem } from '../data/linksPage.ts';

/*
  warnMissingHref (LinkButton.tsx) reads import.meta.env.DEV to decide whether to
  console.error a config mistake. Under `tsx --test` (the runner behind
  `pnpm test:regression`), `import.meta` exists but `.env` does not — an unguarded
  `.DEV` read throws a TypeError from inside the mount effect, crashing the render
  instead of just skipping the dev-only warning. Proves LinkButton stays mountable
  with a missing href regardless of test runtime (claude[bot] review, PR #1519).
*/

afterEach(cleanup);

function renderLinkButton(item: LinkItem) {
    return render(
        React.createElement(MemoryRouter, null, React.createElement(LinkButton, { item, search: null }))
    );
}

test('renders an external link with a missing href without throwing', () => {
    const item: LinkItem = { id: 'sem-href-externo', label: 'Sem href', type: 'external', visible: true };
    assert.doesNotThrow(() => renderLinkButton(item));
});

test('renders an internal link with a missing href without throwing', () => {
    const item: LinkItem = { id: 'sem-href-interno', label: 'Sem href', type: 'internal', visible: true };
    assert.doesNotThrow(() => renderLinkButton(item));
});

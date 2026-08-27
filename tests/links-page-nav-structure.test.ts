import './helpers/dom-setup.ts';

import React from 'react';
import test, { afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { render, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import LinksPage from '../pages/LinksPage.tsx';
import { FEATURED_DESTINATION_IDS } from '../utils/linksPageLayout.ts';

/*
  P1 da crítica de /links de 2026-08-27: quiz + os 4 destinos em destaque viviam no mesmo
  <nav>, expondo 5 escolhas simultâneas acima do limite de carga cognitiva de 4 por grupo.
  A correção separa os dois em landmarks distintos (pages/LinksPage.tsx). Sem este teste
  (apontado pelo claude[bot] na review da PR #1526) um merge futuro poderia juntar as duas
  listas de volta sem que nenhum teste existente percebesse — links-page-data.test.ts só
  cobre o config, e links-page.spec.ts não afirma nada sobre estrutura de nav/aria-label.
*/
afterEach(cleanup);

test('quiz e destinos em destaque vivem em <nav>s separados, cada um com ≤4 itens', () => {
    const { container } = render(
        React.createElement(MemoryRouter, null, React.createElement(LinksPage))
    );

    const quizNav = container.querySelector('nav[aria-label="Quiz de perfil de viagem"]');
    assert.ok(quizNav, 'nav do quiz não encontrado');
    assert.equal(quizNav!.querySelectorAll('a').length, 1, 'nav do quiz deveria ter exatamente 1 link');

    const destinosNav = container.querySelector('nav[aria-label="Destinos em destaque"]');
    assert.ok(destinosNav, 'nav de destinos em destaque não encontrado');
    const destinoLinks = destinosNav!.querySelectorAll('a');
    assert.ok(
        destinoLinks.length <= 4,
        `nav de destinos tem ${destinoLinks.length} itens, acima do limite de carga cognitiva de 4`,
    );
    assert.equal(destinoLinks.length, FEATURED_DESTINATION_IDS.length);

    assert.notEqual(quizNav, destinosNav);
    assert.ok(!quizNav!.contains(destinosNav!), 'nav de destinos não pode estar aninhado no nav do quiz');
    assert.ok(!destinosNav!.contains(quizNav!), 'nav do quiz não pode estar aninhado no nav de destinos');
});

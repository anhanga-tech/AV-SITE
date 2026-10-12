import './helpers/dom-setup.ts';

import React from 'react';
import test, { afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { render, cleanup, fireEvent, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import ParquesBrasil from '../pages/ParquesBrasil.tsx';
import { BOOKABLE_PARKS, UPCOMING_PARKS } from '../components/parques-brasil/constants.ts';
import { parquesContactOptions } from '../components/parques-brasil/contact.ts';

/*
  O único CTA de lead do hub ficava no fim, depois de seis seções. Cobre que o
  hero e cada parque vendável abrem o ContactModal, que o card leva o nome do
  parque como `destination`, e que parque em obras continua sem CTA.
*/

afterEach(cleanup);

function renderHub() {
  return render(React.createElement(MemoryRouter, null, React.createElement(ParquesBrasil)));
}

function clickAndCaptureModalDetail(element: HTMLElement): unknown {
  let detail: unknown = null;
  const handler = (event: Event) => {
    detail = (event as CustomEvent).detail;
  };
  window.addEventListener('open-contact-modal', handler);
  try {
    fireEvent.click(element);
  } finally {
    window.removeEventListener('open-contact-modal', handler);
  }
  return detail;
}

test('o hero abre o modal de contato sem parque pré-escolhido', () => {
  renderHub();
  const heroCta = screen.getByRole('button', { name: 'Quero ajuda para escolher' });

  assert.deepEqual(clickAndCaptureModalDetail(heroCta), parquesContactOptions());
});

test('cada parque vendável tem um CTA que abre o modal com o nome do parque', () => {
  renderHub();

  for (const park of BOOKABLE_PARKS) {
    const cta = screen.getByRole('button', { name: `Pedir orçamento do ${park.name}` });
    const detail = clickAndCaptureModalDetail(cta) as { destination?: string };
    assert.match(detail.destination ?? '', new RegExp(park.name));
    assert.deepEqual(
      detail,
      parquesContactOptions(park),
      `CTA de ${park.name} deveria levar o parque ao modal`,
    );
  }
});

test('parque em obras não ganha CTA de orçamento', () => {
  renderHub();
  const quoteButtons = screen.getAllByRole('button', { name: /^Pedir orçamento/ });

  assert.equal(quoteButtons.length, BOOKABLE_PARKS.length);
  for (const park of UPCOMING_PARKS) {
    assert.equal(
      screen.queryByRole('button', { name: `Pedir orçamento do ${park.name}` }),
      null,
      `${park.name} ainda não abriu e não tem o que orçar`,
    );
  }
});

test('o CTA final abre o modal sem parque escolhido', () => {
  renderHub();
  const finalCta = screen.getByRole('button', { name: 'Falar com um consultor' });

  assert.deepEqual(clickAndCaptureModalDetail(finalCta), parquesContactOptions());
});

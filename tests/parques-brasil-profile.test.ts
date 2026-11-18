import './helpers/dom-setup.ts';

import React from 'react';
import test, { afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { render, cleanup, fireEvent, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import ParquesBrasil from '../pages/ParquesBrasil.tsx';
import ContactModal from '../components/ContactModal.tsx';
import { BOOKABLE_PARKS } from '../components/parques-brasil/constants.ts';
import { parquesContactOptions } from '../components/parques-brasil/contact.ts';
import {
  EMPTY_PROFILE,
  PARK_FIT,
  matchParks,
  profileToTripDetails,
  toggleAge,
  toggleDays,
} from '../components/parques-brasil/profile.ts';
import { openContactModal } from '../utils/contactForm.ts';

/*
  Seletor "Quem vai?": o mecanismo que o h1 promete. Cobre o encaixe derivado
  da copy, a exclusividade de "Só adultos", o perfil chegando ao modal e o
  destaque na página.
*/

afterEach(cleanup);

const SLUGS = BOOKABLE_PARKS.map((park) => park.slug);

test('todo parque vendável tem encaixe definido', () => {
  for (const slug of SLUGS) assert.ok(PARK_FIT[slug], `${slug} sem PARK_FIT`);
});

test('sem perfil, nenhum parque é destacado', () => {
  assert.deepEqual(matchParks(EMPTY_PROFILE, SLUGS), []);
});

test('criança pequena tira o Hopi Hari, como a copy dele diz', () => {
  const matched = matchParks({ ages: ['ate6'], days: null }, SLUGS);
  assert.ok(!matched.includes('hopi-hari'));
  assert.ok(matched.includes('beto-carrero'));
});

test('um dia só deixa o Hopi Hari, o único bate-volta', () => {
  assert.deepEqual(matchParks({ ages: [], days: 'umDia' }, SLUGS), ['hopi-hari']);
});

test('criança até 6 e 2 a 3 dias: Beto Carrero, Thermas e Hot Park', () => {
  assert.deepEqual(matchParks({ ages: ['ate6'], days: 'doisATres' }, SLUGS), [
    'beto-carrero',
    'thermas-dos-laranjais',
    'hot-park',
  ]);
});

test('perfil sem encaixe devolve lista vazia, não um parque qualquer', () => {
  assert.deepEqual(matchParks({ ages: ['ate6'], days: 'umDia' }, SLUGS), []);
});

test('"Só adultos" exclui as faixas de criança, e o inverso', () => {
  const kids = toggleAge(toggleAge(EMPTY_PROFILE, 'ate6'), 'de7a12');
  assert.deepEqual(toggleAge(kids, 'soAdultos').ages, ['soAdultos']);
  assert.deepEqual(toggleAge({ ages: ['soAdultos'], days: null }, 'ate6').ages, ['ate6']);
  assert.deepEqual(toggleAge(kids, 'ate6').ages, ['de7a12']);
});

test('dias é escolha única e desmarca no segundo toque', () => {
  const twoThree = toggleDays(EMPTY_PROFILE, 'doisATres');
  assert.equal(twoThree.days, 'doisATres');
  assert.equal(toggleDays(twoThree, 'umDia').days, 'umDia');
  assert.equal(toggleDays(twoThree, 'doisATres').days, null);
});

test('o perfil vira o texto dos campos do modal, no limite de 60 caracteres', () => {
  assert.deepEqual(profileToTripDetails(EMPTY_PROFILE), {});
  const all = profileToTripDetails({ ages: ['ate6', 'de7a12', 'adolescentes'], days: 'quatroOuMais' });
  assert.equal(all.childrenAges, 'até 6 anos, 7 a 12 anos, adolescentes');
  assert.equal(all.tripDays, '4 dias ou mais');
  assert.ok((all.childrenAges ?? '').length <= 60);
});

test('com perfil, o CTA do parque leva idade e dias; sem perfil, as opções não mudam', () => {
  const park = BOOKABLE_PARKS[0];
  assert.equal('tripDetails' in parquesContactOptions(park), false);
  assert.equal('tripDetails' in parquesContactOptions(park, EMPTY_PROFILE), false);
  assert.deepEqual(parquesContactOptions(park, { ages: ['ate6'], days: 'doisATres' }).tripDetails, {
    childrenAges: 'até 6 anos',
    tripDays: '2 a 3 dias',
  });
});

function renderHub() {
  return render(React.createElement(MemoryRouter, null, React.createElement(ParquesBrasil)));
}

function clickAndCaptureModalDetail(element: HTMLElement): { tripDetails?: unknown; destination?: string } {
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
  return detail as { tripDetails?: unknown; destination?: string };
}

test('escolher o perfil destaca os parques e o card leva o perfil ao modal', () => {
  renderHub();
  fireEvent.click(screen.getByRole('button', { name: 'Crianças até 6 anos' }));
  fireEvent.click(screen.getByRole('button', { name: '2 a 3 dias' }));

  assert.equal(screen.getByRole('button', { name: 'Crianças até 6 anos' }).getAttribute('aria-pressed'), 'true');
  const recommended = screen.getAllByRole('link').filter((link) => link.getAttribute('href')?.startsWith('#parque-'));
  assert.deepEqual(
    recommended.map((link) => link.getAttribute('href')),
    ['#parque-beto-carrero', '#parque-thermas-dos-laranjais', '#parque-hot-park'],
  );
  for (const href of recommended.map((link) => link.getAttribute('href') ?? '')) {
    assert.ok(document.getElementById(href.slice(1)), `âncora ${href} sem card`);
  }
  assert.equal(screen.getAllByText('Combina com a sua família').length, 3);

  const detail = clickAndCaptureModalDetail(screen.getByRole('button', { name: 'Pedir orçamento do Beach Park' }));
  assert.match(detail.destination ?? '', /Beach Park/);
  assert.deepEqual(detail.tripDetails, { childrenAges: 'até 6 anos', tripDays: '2 a 3 dias' });
});

test('na lista dos aquáticos, os que combinam sobem', () => {
  renderHub();
  fireEvent.click(screen.getByRole('button', { name: '4 dias ou mais' }));
  const items = Array.from(document.querySelectorAll('li[id^="parque-"]')).map((li) => li.id);
  assert.deepEqual(items, ['parque-beach-park', 'parque-hot-park', 'parque-thermas-dos-laranjais']);
});

test('perfil sem encaixe mostra a saída pelo consultor', () => {
  renderHub();
  fireEvent.click(screen.getByRole('button', { name: 'Crianças até 6 anos' }));
  fireEvent.click(screen.getByRole('button', { name: '1 dia' }));
  assert.ok(screen.getByText(/Nenhum dos cinco encaixa/));
  assert.ok(screen.getByRole('button', { name: 'Pedir orçamento com esse perfil' }));
});

test('o modal abre com idade e dias já preenchidos pelo perfil', async () => {
  render(React.createElement(ContactModal));
  openContactModal({ ...parquesContactOptions(BOOKABLE_PARKS[0], { ages: ['ate6'], days: 'doisATres' }) });
  await waitFor(() => {
    assert.equal((screen.getByLabelText(/Idade das crianças/) as HTMLInputElement).value, 'até 6 anos');
    assert.equal((screen.getByLabelText(/Quantos dias/) as HTMLInputElement).value, '2 a 3 dias');
  });
});

import './helpers/dom-setup.ts';

import React from 'react';
import test, { afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { render, cleanup, fireEvent, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import ParquesBrasil from '../pages/ParquesBrasil.tsx';
import { ParkPhoto } from '../components/parques-brasil/ParkPhoto.tsx';
import { CACAU_WAITLIST_SOURCE, CacauWaitlist } from '../components/parques-brasil/CacauWaitlist.tsx';
import { BOOKABLE_PARKS, HERO_PARK_SLUGS, PARKS } from '../components/parques-brasil/constants.ts';
import { pushWaitlistSignupDataLayerEvent } from '../hooks/useWaitlistCapture.ts';
import type { SubmitWaitlistRequest } from '../types/waitlist.ts';

/*
  Cobre a primeira leva visual do hub /parques-brasil: foto ou placeholder por
  parque, comparação só a partir do tablet, um CTA forte por card credenciado, e a lista de espera do Cacau Park
  (única seção que não captava contato). A lista reusa /api/submit-waitlist; o
  que importa aqui é que chegue com a origem do Cacau e não conte como Lolla.
*/

afterEach(cleanup);

const BETO = PARKS.find((park) => park.slug === 'beto-carrero')!;

test('sem foto, o parque ganha placeholder decorativo, fora da árvore de acessibilidade', () => {
  const { container } = render(React.createElement(ParkPhoto, { park: { ...BETO, image: undefined } }));
  const placeholder = container.querySelector('[data-park-placeholder="beto-carrero"]');

  assert.ok(placeholder, 'placeholder deveria existir');
  assert.equal(placeholder.getAttribute('aria-hidden'), 'true');
  assert.equal(container.querySelector('img'), null);
});

test('com foto, o parque mostra a imagem com alt e o crédito', () => {
  render(
    React.createElement(ParkPhoto, {
      park: { ...BETO, image: { src: 'https://media.anhanga.tur.br/x.webp', alt: 'Castelo do Beto Carrero', credit: 'Foto: Fulano / CC BY' } },
    }),
  );

  const img = screen.getByRole('img', { name: 'Castelo do Beto Carrero' });
  assert.equal(img.getAttribute('src'), 'https://media.anhanga.tur.br/x.webp');
  assert.equal(img.getAttribute('loading'), 'lazy');
  assert.ok(screen.getByText('Foto: Fulano / CC BY'));
});

test('no mosaico, o crédito fica no topo e não disputa o rodapé com o nome do parque', () => {
  const image = { src: 'https://media.anhanga.tur.br/x.webp', alt: 'x', credit: 'Foto: Fulano / Unsplash' };
  const { container, rerender } = render(React.createElement(ParkPhoto, { park: { ...BETO, image }, showName: true }));
  assert.match(container.querySelector('figcaption')!.className, /\btop-1\.5\b/);

  rerender(React.createElement(ParkPhoto, { park: { ...BETO, image } }));
  assert.match(container.querySelector('figcaption')!.className, /\bbottom-1\b/);
});

test('o mosaico do hero só usa parques que já têm foto', () => {
  for (const slug of HERO_PARK_SLUGS) {
    const park = PARKS.find((item) => item.slug === slug);
    assert.ok(park?.image, `${slug} está no hero sem foto`);
  }
});

test('toda foto de parque diz de onde veio e quem fez', () => {
  for (const park of PARKS) {
    if (!park.image) continue;
    assert.match(park.image.source ?? '', /^https:\/\//, `${park.slug} sem página de origem`);
    assert.ok(park.image.credit, `${park.slug} sem crédito`);
    // Licença CC exige o nome da licença junto do crédito.
    if (!park.image.source?.includes('unsplash.com')) {
      assert.match(park.image.credit, /CC BY/, `${park.slug} sem a licença no crédito`);
    }
  }
});

test('toda foto de parque sai do nosso domínio de mídia, não de um host de terceiro', () => {
  // Host de terceiro recebe IP e user-agent do visitante sem estar na política
  // de privacidade (LGPD). Crédito e link de origem continuam apontando para lá.
  for (const park of PARKS) {
    if (!park.image) continue;
    assert.equal(new URL(park.image.src).host, 'media.anhanga.tur.br', `${park.slug} carrega de fora`);
  }
});

test('foto CC BY-SA tem link para a origem e para a licença, avisando do recorte', () => {
  render(React.createElement(MemoryRouter, null, React.createElement(ParquesBrasil)));
  const credits = screen.getByRole('region', { name: 'Créditos das fotos' });
  const beach = PARKS.find((park) => park.slug === 'beach-park')!;
  const links = Array.from(credits.querySelectorAll('a')).map((a) => a.getAttribute('href'));

  assert.ok(links.includes(beach.image!.source!), 'falta link para a foto original');
  assert.ok(links.includes(beach.image!.license!.url), 'falta link para a licença');
  assert.match(credits.textContent ?? '', /Paulo JC Nogueira, foto recortada/);
});

test('no hero só a primeira foto carrega com prioridade', () => {
  const { container } = render(React.createElement(MemoryRouter, null, React.createElement(ParquesBrasil)));
  const heroImages = Array.from(container.querySelectorAll('section')[0].querySelectorAll('img'));
  assert.deepEqual(
    heroImages.map((img) => img.getAttribute('loading')),
    ['eager', 'lazy', 'lazy'],
  );
});

test('a comparação é só a tabela, sem uma segunda versão em cards para o mobile', () => {
  render(React.createElement(MemoryRouter, null, React.createElement(ParquesBrasil)));
  const table = screen.getByRole('table');

  for (const park of BOOKABLE_PARKS) {
    assert.ok(table.textContent?.includes(park.name), `${park.name} faltando na tabela`);
  }
  assert.equal(screen.queryByRole('list', { name: 'Comparação entre os parques' }), null);
});

test('sem a tabela no celular, cada parque vendável ainda mostra a melhor época no próprio card', () => {
  const { container } = render(React.createElement(MemoryRouter, null, React.createElement(ParquesBrasil)));
  const outsideTable = Array.from(container.querySelectorAll('article, li'))
    .map((node) => node.textContent ?? '')
    .join(' ');
  for (const park of BOOKABLE_PARKS) {
    assert.ok(outsideTable.includes(park.when), `${park.name} sem época fora da tabela`);
  }
});

test('lista do Cacau Park: funil completo de view, start e field_complete', () => {
  const events = captureDataLayer(() => {
    render(React.createElement(CacauWaitlist));
    fireEvent.change(screen.getByLabelText('Nome'), { target: { value: 'Ana Souza' } });
    fireEvent.change(screen.getByLabelText('Nome'), { target: { value: 'Ana Souza B' } });
  });
  const names = events.filter((event) => event.form_id === 'cacau-park-waitlist').map((event) => event.event);
  assert.deepEqual(names, ['form_view', 'form_start', 'field_complete']);
});

test('card credenciado: orçamento é o botão, a página do parque é link de texto', () => {
  render(React.createElement(MemoryRouter, null, React.createElement(ParquesBrasil)));
  const link = screen.getByRole('link', { name: 'Conhecer a página do Beto Carrero World' });
  assert.equal(link.getAttribute('href'), BETO.href);
  assert.ok(screen.getByRole('button', { name: 'Pedir orçamento do Beto Carrero World' }));
  assert.equal(screen.queryByText(/Ver pacotes do/), null);
});

test('o hub mostra a lista de espera do Cacau Park', () => {
  render(React.createElement(MemoryRouter, null, React.createElement(ParquesBrasil)));
  assert.ok(screen.getByRole('button', { name: 'Me avise' }));
});

test('lista do Cacau Park: sem nome e e-mail, não envia e aponta os campos', async () => {
  const originalFetch = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = (async () => {
    calls += 1;
    return new Response('{}');
  }) as typeof fetch;

  try {
    render(React.createElement(CacauWaitlist));
    fireEvent.click(screen.getByRole('button', { name: 'Me avise' }));

    await waitFor(() => assert.ok(screen.getByText('Informe seu nome completo.')));
    assert.ok(screen.getByText('Informe seu e-mail.'));
    assert.equal(calls, 0);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('lista do Cacau Park: validação barrada vira field_error no dataLayer', () => {
  const events = captureDataLayer(() => {
    render(React.createElement(CacauWaitlist));
    fireEvent.click(screen.getByRole('button', { name: 'Me avise' }));
  });
  const fieldError = events.find((event) => event.event === 'field_error');
  assert.ok(fieldError, 'field_error deveria ser enviado');
  assert.equal(fieldError.form_id, 'cacau-park-waitlist');
  assert.equal(fieldError.field_name, 'name');
});

test('lista do Cacau Park: clicar direto no botão também conta como início', () => {
  const events = captureDataLayer(() => {
    render(React.createElement(CacauWaitlist));
    fireEvent.click(screen.getByRole('button', { name: 'Me avise' }));
  });
  const names = events.filter((event) => event.form_id === 'cacau-park-waitlist').map((event) => event.event);
  assert.deepEqual(names, ['form_view', 'form_start', 'submit_attempt', 'field_error']);
});

test('lista do Cacau Park: corrigir o campo tira o erro dele na hora', async () => {
  render(React.createElement(CacauWaitlist));
  fireEvent.click(screen.getByRole('button', { name: 'Me avise' }));
  await waitFor(() => assert.ok(screen.getByText('Informe seu nome completo.')));

  fireEvent.change(screen.getByLabelText('Nome'), { target: { value: 'Ana Souza' } });

  assert.equal(screen.queryByText('Informe seu nome completo.'), null);
  assert.equal(screen.getByLabelText('Nome').getAttribute('aria-invalid'), null);
  // O outro campo continua apontado até ser corrigido.
  assert.ok(screen.getByText('Informe seu e-mail.'));
});

test('lista do Cacau Park: envia com a origem do Cacau e confirma', async () => {
  const originalFetch = globalThis.fetch;
  let sentUrl = '';
  let sentBody: Record<string, unknown> = {};
  globalThis.fetch = (async (url: string, init?: RequestInit) => {
    sentUrl = url;
    sentBody = JSON.parse(String(init?.body));
    return new Response(JSON.stringify({ ok: true, requestId: 'req-1', message: 'ok' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }) as typeof fetch;

  try {
    render(React.createElement(CacauWaitlist));
    fireEvent.change(screen.getByLabelText('Nome'), { target: { value: 'Ana Souza' } });
    fireEvent.change(screen.getByLabelText('E-mail'), { target: { value: 'Ana@Exemplo.com' } });
    fireEvent.click(screen.getByRole('button', { name: 'Me avise' }));

    await waitFor(() => assert.match(screen.getByRole('status').textContent ?? '', /Pronto/));
    assert.equal(sentUrl, '/api/submit-waitlist');
    assert.equal(sentBody.sourcePage, CACAU_WAITLIST_SOURCE);
    assert.equal(sentBody.email, 'ana@exemplo.com');
    assert.equal(sentBody.name, 'Ana Souza');
    // Opt-in de marketing é opcional e começa desmarcado.
    assert.equal(sentBody.emailOptIn, false);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('lista do Cacau Park: a região de status já existe antes do envio', () => {
  render(React.createElement(CacauWaitlist));
  assert.equal(screen.getByRole('status').textContent, '');
});

test('lista do Cacau Park: falha de rede vira mensagem em português, não o erro do navegador', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async () => {
    throw new TypeError('Failed to fetch');
  }) as typeof fetch;

  try {
    render(React.createElement(CacauWaitlist));
    fireEvent.change(screen.getByLabelText('Nome'), { target: { value: 'Ana Souza' } });
    fireEvent.change(screen.getByLabelText('E-mail'), { target: { value: 'ana@exemplo.com' } });
    fireEvent.click(screen.getByRole('button', { name: 'Me avise' }));

    await waitFor(() => assert.ok(screen.getByText(/Não conseguimos enviar agora/)));
    assert.equal(screen.queryByText('Failed to fetch'), null);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('dataLayer da waitlist: e-mail na query da página não vai para o analytics', () => {
  const previousUrl = window.location.href;
  window.history.replaceState(null, '', '/parques-brasil/?email=ana@exemplo.com');
  try {
    const events = captureDataLayer(() => pushWaitlistSignupDataLayerEvent(PAYLOAD));
    for (const event of events) {
      assert.doesNotMatch(String(event.page_location), /ana@exemplo\.com/);
    }
  } finally {
    window.history.replaceState(null, '', previousUrl);
  }
});

function captureDataLayer(run: () => void): Array<Record<string, unknown>> {
  const previous = window.dataLayer;
  const events: Array<Record<string, unknown>> = [];
  window.dataLayer = events as unknown as typeof window.dataLayer;
  try {
    run();
  } finally {
    window.dataLayer = previous;
  }
  return events;
}

const PAYLOAD: SubmitWaitlistRequest = {
  name: 'Ana',
  email: 'ana@exemplo.com',
  sourcePage: CACAU_WAITLIST_SOURCE,
  utms: { utm_source: null, utm_medium: null, utm_campaign: null, utm_term: null, utm_content: null },
};

test('dataLayer da waitlist: sem rótulos, segue contando como Lollapalooza', () => {
  const [signup, submission] = captureDataLayer(() => pushWaitlistSignupDataLayerEvent(PAYLOAD));
  assert.equal(signup.destination, 'Lollapalooza Brasil');
  assert.equal(signup.interest_year, '2027');
  assert.equal(submission.form_id, 'lolla_waitlist_2027');
});

test('dataLayer da waitlist: com rótulos do Cacau Park, não conta como Lolla', () => {
  const [signup, submission] = captureDataLayer(() =>
    pushWaitlistSignupDataLayerEvent(PAYLOAD, {
      destination: 'Cacau Park',
      interestYear: '2027',
      formId: 'cacau_park_waitlist',
    }),
  );
  assert.equal(signup.destination, 'Cacau Park');
  assert.equal(submission.form_id, 'cacau_park_waitlist');
});

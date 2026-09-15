import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { HeadContext, createHeadManager } from '../lib/head.tsx';
import NpsPage from '../pages/NpsPage.tsx';

/*
  /nps entrou no prerender junto com o 404 custom (a presença de dist/404.html desliga o
  fallback de SPA do Cloudflare Pages, e sem HTML próprio a rota passaria a responder 404).
  Só que o prerender renderiza a rota crua, sem query string — e o corpo da página decide
  entre formulário e "Link inválido" pelo `token` da URL.

  Sem o gate de `mounted`, o HTML estático nascia com "Link inválido": o respondente que
  abre /nps/?token=... com link VÁLIDO via essa mensagem até o React hidratar. É o pior
  público possível para esse flash — cliente recém-chegado de viagem clicando no e-mail.

  A casca prerenderizada precisa ser neutra em relação à query: nem formulário, nem erro.
*/
function renderSemQuery(): string {
  return renderToStaticMarkup(
    React.createElement(
      HeadContext.Provider,
      { value: createHeadManager() },
      React.createElement(
        MemoryRouter,
        { initialEntries: ['/nps'] },
        React.createElement(NpsPage)
      )
    )
  );
}

test('a casca prerenderizada de /nps não afirma "Link inválido"', () => {
  const html = renderSemQuery();

  assert.equal(
    html.includes('Link inválido'),
    false,
    'o HTML estático de /nps não pode acusar link inválido: no prerender não há query string, ' +
      'então essa mensagem apareceria também para quem tem convite válido'
  );
});

test('a casca prerenderizada de /nps também não traz o formulário', () => {
  const html = renderSemQuery();

  // A contrapartida do teste acima: a casca é neutra, não "otimista". Renderizar o
  // formulário sem token conhecido convidaria alguém sem convite a preencher algo que o
  // servidor vai recusar.
  assert.equal(html.includes('<form'), false, 'a casca não pode trazer o formulário de NPS');
});

/*
  Mesmo invariante que tests/hydration.test.ts guarda para o Footer compartilhado: o ano
  não pode entrar no HTML estático. O artefato é reconstruído no máximo uma vez por dia,
  então na virada do ano o markup assado diverge do relógio do cliente — e essa divergência
  cai FORA da supressão do 404 (o marcador aqui é /nps), virando erro de hidratação real
  que desfaz a casca neutra justamente para quem tem convite válido.
*/
test('a casca prerenderizada de /nps não assa o ano no HTML estático', () => {
  const html = renderSemQuery();

  assert.doesNotMatch(
    html,
    /20\d\d/,
    'nenhum ano pode aparecer na casca estática: ele muda na virada e quebra a hidratação'
  );
});

test('a casca prerenderizada de /nps mantém o enquadramento da página', () => {
  const html = renderSemQuery();

  // Neutra não é vazia: o cabeçalho de marca continua no HTML estático, senão a rota
  // pintaria uma tela crua antes da hidratação.
  assert.ok(html.includes('alt="Anhangá Viagens"'), 'a casca deve manter o logo no HTML estático');
});

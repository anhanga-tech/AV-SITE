import { GlobalRegistrator } from '@happy-dom/global-registrator';

/*
  node:test isola cada arquivo em processo separado (default do test runner),
  então estes globals não vazam entre arquivos — só precisam existir antes do
  primeiro `render()` do arquivo que importar este módulo. Escolha de
  happy-dom (em vez de jsdom) documentada em
  docs/standards/dom-testing-tier-decision.md.

  `GlobalRegistrator` (pacote oficial do happy-dom) em vez de copiar `window`/
  `document`/`HTMLElement` na mão: registra TODOS os construtores DOM
  (`Node`, `Event`, `CustomEvent`, etc.) como globals, não só os poucos que um
  teste específico precisou até agora — um teste futuro que use, por exemplo,
  `event.target instanceof Node` (padrão comum em handlers de "clique fora")
  não quebra por um global que ninguém lembrou de expor manualmente. Também
  contorna corretamente o getter read-only de `navigator` do Node 21+.
*/
declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean;
}

GlobalRegistrator.register({
  url: 'https://www.anhanga.tur.br/',
  // Sem isso, clicar num <a href> real (ex.: target="_blank" para um provedor
  // externo) faz o happy-dom navegar de verdade e disparar fetch de rede —
  // lento, não-determinístico e proibido pelo padrão de testes do repo
  // (docs/standards/testing.md: não bater em endpoints externos de verdade).
  settings: {
    navigation: { disableMainFrameNavigation: true, disableChildPageNavigation: true },
  },
});
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

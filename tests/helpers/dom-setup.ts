import { Window as HappyDomWindow } from 'happy-dom';

/*
  node:test isola cada arquivo em processo separado (default do test runner),
  então estes globals não vazam entre arquivos — só precisam existir antes do
  primeiro `render()` do arquivo que importar este módulo. Escolha de
  happy-dom (em vez de jsdom) documentada em
  docs/standards/dom-testing-tier-decision.md.
*/
declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean;
}

const happyWindow = new HappyDomWindow({ url: 'https://www.anhanga.tur.br/' });

globalThis.window = happyWindow as unknown as Window & typeof globalThis;
globalThis.document = happyWindow.document as unknown as Document;
globalThis.HTMLElement = happyWindow.HTMLElement as unknown as typeof HTMLElement;
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

// Node 21+ define `navigator` como getter global read-only — precisa de
// `defineProperty` (configurable) para trocar pela instância do happy-dom.
Object.defineProperty(globalThis, 'navigator', {
  value: happyWindow.navigator,
  configurable: true,
  writable: true,
});

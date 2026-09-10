// Store de visibilidade do banner de cookies (#1605).
//
// Vive fora de components/CookieConsentBanner.tsx porque é estado de módulo, não do
// componente: precisa sobreviver a remontagens e ser tocado pela ponte de clique
// pré-hidratação de index.html. Manter isso num arquivo .tsx também obrigaria o componente
// a exportar não-componentes, o que atrapalha o Fast Refresh.
import { type ConsentChoice, getConsent, setConsent } from './consent';

declare global {
  interface Window {
    // Definida pela ponte de clique pré-hidratação em index.html. Ausente quando o documento
    // não veio desse template (ex.: testes que montam o componente isolado).
    __anhangaConsentHandoff?: () => string | null;
  }
}

// Visibilidade do banner como store externa em vez de estado local (#1605).
//
// O banner agora é renderizado no HTML pré-renderizado, então o primeiro render do cliente
// precisa produzir exatamente o mesmo markup — ler o localStorage ali quebraria a hidratação.
// `useSyncExternalStore` resolve isso pela porta da frente: durante a hidratação o React usa
// `getServerSnapshot` (sempre "mostrar"), e só depois passa a usar `getSnapshot`, que consulta
// a escolha real. Quem já escolheu não vê flash nesse intervalo porque o par script+style
// inline do <head> (ver index.html) esconde o banner antes do primeiro paint.
let resetRequested = false;
// `dismissed` não é redundante com o localStorage: `setConsent` engole falhas de escrita
// (modo privado, storage cheio) de propósito, então só a memória garante que Aceitar/Recusar
// fecham o banner. Sem ela, a leitura de volta continuaria `null` e o overlay fixo ficaria
// impossível de dispensar exatamente para quem não consegue persistir a escolha.
let dismissed = false;
const storeListeners = new Set<() => void>();

const notifyStore = (): void => {
  for (const listener of storeListeners) listener();
};

// Enquanto `data-cookie-consent="set"` estiver no <html>, a regra inline do <head> esconde o
// banner. Liberar o gate devolve a visibilidade ao React, que passa a ser a única fonte de
// verdade a partir daí.
export const releasePrepaintGate = (): void => {
  document.documentElement.removeAttribute('data-cookie-consent');
};

export const subscribeToBannerVisibility = (onStoreChange: () => void): (() => void) => {
  storeListeners.add(onStoreChange);
  const handleReset = () => {
    resetRequested = true;
    dismissed = false;
    // Todo reset libera o gate, não só o caminho em que o banner passou por um render
    // invisível antes. O drain de um reset bufferizado (registerConsentBannerListener, em
    // lib/consent.ts) pode acontecer no mesmo commit da hidratação, antes de o React chegar
    // a renderizar `visible=false` — aí o efeito de baixo nunca roda e a regra inline
    // continuaria escondendo um banner logicamente reaberto.
    releasePrepaintGate();
    onStoreChange();
  };
  window.addEventListener('anhanga:reset-consent', handleReset);
  return () => {
    storeListeners.delete(onStoreChange);
    window.removeEventListener('anhanga:reset-consent', handleReset);
  };
};

// `resetRequested` cobre o "Gerenciar cookies" do rodapé: a escolha continua no localStorage
// (lib/consent.ts não a apaga de propósito), então só a flag distingue "reabrir" de "já decidiu".
export const getBannerVisibility = (): boolean => {
  if (resetRequested) return true;
  if (dismissed) return false;
  return getConsent() === null;
};
export const getServerBannerVisibility = (): boolean => true;

const handleChoice = (choice: ConsentChoice): void => {
  setConsent(choice);
  dismissed = true;
  resetRequested = false;
  notifyStore();
};

export const acceptConsent = (): void => handleChoice('marketing');

export const declineConsent = (): void => handleChoice('essential');

// Drena o clique que a ponte pré-hidratação de index.html anotou. O banner fica visível a
// partir do primeiro paint, muito antes dos onClick do React existirem; a ponte anota a
// escolha e esconde o banner, e é aqui que ela vira consentimento de verdade (setConsent).
export const drainPreHydrationChoice = (): void => {
  const handoff = window.__anhangaConsentHandoff;
  if (typeof handoff !== 'function') return;
  const choice = handoff();
  if (choice === 'marketing' || choice === 'essential') handleChoice(choice);
};

// Apenas para testes (tests/cookie-banner-prehydration.test.ts): o estado de visibilidade é de
// módulo — mesmo padrão de _resetConsentListenerStateForTests em consent.ts.
export function _resetBannerVisibilityStateForTests(): void {
  resetRequested = false;
  dismissed = false;
}


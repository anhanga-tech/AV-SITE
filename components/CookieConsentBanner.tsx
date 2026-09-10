import { useEffect, useRef, useSyncExternalStore } from 'react';
import { type ConsentChoice, getConsent, registerConsentBannerListener, setConsent } from '@/lib/consent';

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
const releasePrepaintGate = (): void => {
  document.documentElement.removeAttribute('data-cookie-consent');
};

const subscribeToBannerVisibility = (onStoreChange: () => void): (() => void) => {
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
const getBannerVisibility = (): boolean => {
  if (resetRequested) return true;
  if (dismissed) return false;
  return getConsent() === null;
};
const getServerBannerVisibility = (): boolean => true;

const handleChoice = (choice: ConsentChoice): void => {
  setConsent(choice);
  dismissed = true;
  resetRequested = false;
  notifyStore();
};

const handleAccept = (): void => handleChoice('marketing');

const handleDecline = (): void => handleChoice('essential');

const CookieConsentBanner: React.FC = () => {
  const visible = useSyncExternalStore(
    subscribeToBannerVisibility,
    getBannerVisibility,
    getServerBannerVisibility
  );
  const bannerRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    // Banner montou (hidratação concluída): habilita dispatch direto e drena qualquer
    // reset ocorrido antes (ver registerConsentBannerListener em lib/consent.ts — a corrida
    // do "Gerenciar cookies" no footer pré-renderizado, clicável antes da hidratação). A
    // assinatura de `useSyncExternalStore` é declarada acima deste efeito, então já está
    // ativa quando o drain dispara o evento — sem isso o banner não reabriria.
    registerConsentBannerListener();
  }, []);

  // Devolve o controle da visibilidade ao React assim que o banner sai da tela: enquanto
  // `data-cookie-consent="set"` estiver no <html>, a regra inline do <head> esconderia o
  // banner mesmo depois de "Gerenciar cookies" reabri-lo. Remover só quando `visible` já é
  // false garante que a troca aconteça atrás de um render sem banner — sem janela de flash.
  useEffect(() => {
    if (!visible) releasePrepaintGate();
  }, [visible]);

  // Expõe a altura do banner em --cookie-banner-h para elementos flutuantes
  // (ex.: botão do AIChat) se deslocarem e não ficarem cobertos pelo banner.
  useEffect(() => {
    if (!visible) return;
    const el = bannerRef.current;
    if (!el) return;
    const root = document.documentElement;
    const update = () => root.style.setProperty('--cookie-banner-h', `${el.offsetHeight}px`);
    update();
    // Guard: o banner está fora do ChunkErrorBoundary — sem ResizeObserver
    // (browser antigo), mantém a altura inicial em vez de derrubar o app.
    const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(update) : null;
    observer?.observe(el);
    return () => {
      observer?.disconnect();
      root.style.setProperty('--cookie-banner-h', '0px');
    };
  }, [visible]);

  if (!visible) return null;

  return (
    <dialog
      ref={bannerRef}
      id="cookie-consent-banner"
      open
      aria-label="Preferências de cookies"
      className="fixed bottom-0 left-0 right-0 z-[10000] m-0 w-full max-w-none border-0 p-0 bg-anhanga-dark border-t border-white/10 shadow-lg"
    >
      <div className="container mx-auto px-4 py-2.5 sm:px-6 sm:py-4 flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-4">
        <p className="text-xs sm:text-sm text-zinc-300 leading-snug sm:leading-relaxed max-w-2xl">
          Usamos cookies de marketing para te mostrar ofertas de viagem mais relevantes.
          Analytics continua ativo por interesse legítimo {'—'}{' '}
          <a
            href="/politica-privacidade/#cookies"
            className="underline underline-offset-2 hover:text-anhanga-yellow transition-colors"
          >
            saiba como se opor em nossa Política de Privacidade
          </a>
          .
        </p>
        <div className="flex gap-2 sm:gap-3 shrink-0">
          {/* min-h-11 (44px) em todo breakpoint: o piso de touch target do DESIGN.md vale para
              este banner fixo no rodapé tanto quanto para qualquer outro controle do site. */}
          <button
            type="button"
            onClick={handleDecline}
            className="flex min-h-11 items-center justify-center px-4 text-sm font-medium text-zinc-300 border border-white/20 rounded-lg hover:border-white/40 hover:text-white transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-anhanga-action"
          >
            Recusar
          </button>
          <button
            type="button"
            onClick={handleAccept}
            className="flex min-h-11 items-center justify-center px-4 text-sm font-medium text-zinc-300 border border-white/20 rounded-lg hover:border-white/40 hover:text-white transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-anhanga-action"
          >
            Aceitar
          </button>
        </div>
      </div>
    </dialog>
  );
};

export default CookieConsentBanner;

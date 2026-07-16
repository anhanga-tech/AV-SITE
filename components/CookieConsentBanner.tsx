import { useEffect, useRef, useState } from 'react';
import { getConsent, setConsent } from '@/lib/consent';

const CookieConsentBanner: React.FC = () => {
  const [visible, setVisible] = useState(() => getConsent() === null);
  const bannerRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const handleReset = () => setVisible(true);
    window.addEventListener('anhanga:reset-consent', handleReset);
    return () => window.removeEventListener('anhanga:reset-consent', handleReset);
  }, []);

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

  const handleAccept = () => {
    setConsent('marketing');
    setVisible(false);
  };

  const handleDecline = () => {
    setConsent('essential');
    setVisible(false);
  };

  return (
    <dialog
      ref={bannerRef}
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
          <button
            type="button"
            onClick={handleDecline}
            className="px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium text-zinc-300 border border-white/20 rounded-lg hover:border-white/40 hover:text-white transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-anhanga-action"
          >
            Recusar
          </button>
          <button
            type="button"
            onClick={handleAccept}
            className="px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium text-zinc-300 border border-white/20 rounded-lg hover:border-white/40 hover:text-white transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-anhanga-action"
          >
            Aceitar
          </button>
        </div>
      </div>
    </dialog>
  );
};

export default CookieConsentBanner;

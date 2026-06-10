import { useEffect, useState } from 'react';
import { getConsent, setConsent } from '@/lib/consent';

const CookieConsentBanner: React.FC = () => {
  const [visible, setVisible] = useState(() => getConsent() === null);

  useEffect(() => {
    const handleReset = () => setVisible(true);
    window.addEventListener('anhanga:reset-consent', handleReset);
    return () => window.removeEventListener('anhanga:reset-consent', handleReset);
  }, []);

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
      open
      aria-label="Preferências de cookies"
      className="fixed bottom-0 left-0 right-0 z-[10000] m-0 w-full max-w-none border-0 p-0 bg-brand-dark border-t border-white/10 shadow-lg"
    >
      <div className="container mx-auto px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-sm text-zinc-300 leading-relaxed max-w-2xl">
          Usamos cookies de marketing (Mautic e HubSpot) para comunicações personalizadas.
          Analytics continua ativo por interesse legítimo {'—'}{' '}
          <a
            href="/politica-privacidade#cookies"
            className="underline underline-offset-2 hover:text-brand-yellow transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-cyan focus-visible:ring-offset-2 focus-visible:ring-offset-brand-dark rounded px-1 -mx-1"
          >
            saiba como se opor em nossa Política de Privacidade
          </a>
          .
        </p>
        <div className="flex gap-3 shrink-0">
          <button
            type="button"
            onClick={handleDecline}
            className="px-4 py-2 text-sm font-medium text-zinc-300 border border-white/20 rounded-lg hover:border-white/40 hover:text-white hover:-translate-y-0.5 active:scale-95 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-cyan focus-visible:ring-offset-2 focus-visible:ring-offset-brand-dark"
          >
            Recusar
          </button>
          <button
            type="button"
            onClick={handleAccept}
            className="px-4 py-2 text-sm font-medium text-zinc-300 border border-white/20 rounded-lg hover:border-white/40 hover:text-white hover:-translate-y-0.5 active:scale-95 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-cyan focus-visible:ring-offset-2 focus-visible:ring-offset-brand-dark"
          >
            Aceitar
          </button>
        </div>
      </div>
    </dialog>
  );
};

export default CookieConsentBanner;

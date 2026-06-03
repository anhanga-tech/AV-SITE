import { useEffect, useState } from 'react';
import { getConsent, setConsent } from '@/lib/consent';

const CookieConsentBanner: React.FC = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (getConsent() === null) setVisible(true);

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
    <div
      role="dialog"
      aria-modal="false"
      aria-label="Preferências de cookies"
      className="fixed bottom-0 left-0 right-0 z-50 bg-brand-dark border-t border-white/10 shadow-lg"
    >
      <div className="container mx-auto px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-sm text-zinc-300 leading-relaxed max-w-2xl">
          Usamos cookies de marketing (Mautic e HubSpot) para comunicações personalizadas.
          Analytics continua ativo por interesse legítimo —{' '}
          <a
            href="/politica-privacidade#cookies"
            className="underline underline-offset-2 hover:text-brand-yellow transition-colors"
          >
            saiba como se opor em nossa Política de Privacidade
          </a>
          .
        </p>
        <div className="flex gap-3 shrink-0">
          <button
            onClick={handleDecline}
            className="px-4 py-2 text-sm font-medium text-zinc-300 border border-white/20 rounded-lg hover:border-white/40 hover:text-white transition-colors"
          >
            Recusar
          </button>
          <button
            onClick={handleAccept}
            className="px-4 py-2 text-sm font-medium text-zinc-300 border border-white/20 rounded-lg hover:border-white/40 hover:text-white transition-colors"
          >
            Aceitar
          </button>
        </div>
      </div>
    </div>
  );
};

export default CookieConsentBanner;

import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { BRAND_LOGO_WHITE_URL } from '../lib/media-assets';
import { NpsTextarea } from '../components/nps/NpsTextarea';
import { NpsScoreSelector } from '../components/nps/NpsScoreSelector';
import { NpsThankPromoter } from '../components/nps/NpsThankPromoter';
import { NpsThankOther } from '../components/nps/NpsThankOther';

const GOOGLE_REVIEW_URL = 'https://g.page/r/Ca7sLORX6EQ7EBM/review';

type PageState = 'form' | 'thank-promoter' | 'thank-other';

// Scoped styles for states that inline styles cannot express (:hover, :active,
// :focus-visible, @media prefers-reduced-motion).
const PAGE_STYLES = `
  .nps-score-btn:focus-visible {
    outline: 2px solid #0ea5e9;
    outline-offset: 2px;
  }
  .nps-cta {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 2rem;
    font-size: 0.875rem;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    border-radius: 0.5rem;
    text-decoration: none;
    transform: translate(-1px, -1px);
    transition: transform 0.15s ease, box-shadow 0.15s ease;
  }
  .nps-cta:hover { transform: translate(0, 0); }
  .nps-cta:focus-visible { outline: 2px solid #0ea5e9; outline-offset: 2px; }
  .nps-cta-yellow {
    background: #FFD600; color: #0f172a;
    border: 2px solid #0f172a; box-shadow: 4px 4px 0 #0f172a;
  }
  .nps-cta-yellow:hover { box-shadow: 2px 2px 0 #0f172a; }
  .nps-cta-whatsapp {
    background: #25D366; color: #ffffff;
    border: 2px solid #0f172a; box-shadow: 4px 4px 0 #0f172a;
  }
  .nps-cta-whatsapp:hover { box-shadow: 2px 2px 0 #0f172a; }
  .nps-submit:not(:disabled):active {
    transform: translate(0, 0) !important;
    box-shadow: 2px 2px 0 #003B8E !important;
  }
  @media (prefers-reduced-motion: reduce) {
    .nps-score-btn, .nps-cta, .nps-submit { transition: none !important; }
    .nps-thank-card { animation: none !important; opacity: 1 !important; transform: none !important; }
  }
`;

export default function NPS() {
  const [params] = useSearchParams();
  const firstname = params.get('firstname')?.trim() ?? '';
  const email = params.get('email')?.trim() ?? '';

  const [score, setScore] = useState<number | null>(null);
  const [reason, setReason] = useState('');
  const [highlight, setHighlight] = useState('');
  const [pageState, setPageState] = useState<PageState>('form');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [countdown, setCountdown] = useState(3);
  const [year] = useState(() => new Date().getFullYear());

  useEffect(() => {
    const prev = document.title;
    document.title = 'Avaliação de Viagem — Anhangá Viagens';
    return () => { document.title = prev; };
  }, []);

  useEffect(() => {
    if (pageState !== 'thank-promoter') return;
    if (countdown <= 0) {
      window.location.href = GOOGLE_REVIEW_URL;
      return;
    }
    const id = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(id);
  }, [pageState, countdown]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (score === null) return;

    setSubmitting(true);
    setErrorMessage('');

    try {
      const res = await fetch('/api/submit-nps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstname,
          email,
          score,
          reason: reason.trim(),
          highlight: highlight.trim(),
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(
          (data as { error?: string }).error ?? 'Erro ao enviar avaliação. Tente novamente.'
        );
      }

      setPageState(score >= 9 ? 'thank-promoter' : 'thank-other');
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Erro inesperado. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  }

  const submitEnabled = score !== null && !!reason.trim() && !submitting;

  return (
    <>
      <style>{PAGE_STYLES}</style>

      <div
        className="min-h-screen flex flex-col"
        style={{ background: '#0f172a', color: '#f8fafc', fontFamily: 'Poppins, sans-serif' }}
      >
        <header className="p-6 flex justify-center">
          <img
            src={BRAND_LOGO_WHITE_URL}
            alt="Anhangá Viagens"
            className="h-20 w-auto"
            loading="eager"
          />
        </header>

        <div aria-hidden="true" style={{ height: '3px', background: '#FFD600', flexShrink: 0 }} />

        <main className="flex-1 flex flex-col items-center px-6 py-12">
          <div className="w-full max-w-lg">

            {pageState === 'form' && (
              <form onSubmit={handleSubmit} noValidate>
                <h1
                  className="text-3xl font-extrabold tracking-tight mb-2"
                  style={{ letterSpacing: '-0.025em' }}
                >
                  {firstname ? `Olá, ${firstname}!` : 'Olá!'}
                </h1>
                <p className="text-base mb-10" style={{ color: '#94a3b8', lineHeight: '1.75' }}>
                  Sua opinião nos ajuda a cuidar de cada detalhe da próxima aventura.
                </p>

                <NpsScoreSelector
                  score={score}
                  onSelect={setScore}
                />

                <div className="mb-6">
                  <label
                    htmlFor="nps-reason"
                    className="block text-xs font-bold uppercase mb-2"
                    style={{ letterSpacing: '0.15em', color: '#94a3b8' }}
                  >
                    O que te levou a dar essa nota?
                  </label>
                  <NpsTextarea
                    id="nps-reason"
                    value={reason}
                    onChange={setReason}
                    placeholder="Conte-nos sua experiência..."
                    rows={4}
                    required
                    maxLength={2000}
                  />
                </div>

                <div className="mb-8">
                  <label
                    htmlFor="nps-highlight"
                    className="block text-xs font-bold uppercase mb-2"
                    style={{ letterSpacing: '0.15em', color: '#94a3b8' }}
                  >
                    Qual foi o momento mais marcante da viagem?{' '}
                    <span
                      className="normal-case font-normal"
                      style={{ letterSpacing: 'normal', color: '#475569' }}
                    >
                      (opcional)
                    </span>
                  </label>
                  <NpsTextarea
                    id="nps-highlight"
                    value={highlight}
                    onChange={setHighlight}
                    placeholder="Um momento especial que ficou na memória..."
                    rows={3}
                    maxLength={2000}
                  />
                </div>

                {errorMessage && (
                  <p
                    className="mb-4 text-sm text-center rounded-lg px-4 py-3"
                    role="alert"
                    style={{ color: '#f87171', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}
                  >
                    {errorMessage}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={!submitEnabled}
                  className="nps-submit w-full py-4 text-sm font-extrabold uppercase rounded-lg"
                >
                  {submitting ? 'Enviando...' : 'Enviar avaliação'}
                </button>
              </form>
            )}

            {pageState === 'thank-promoter' && (
              <NpsThankPromoter firstname={firstname} countdown={countdown} />
            )}
            {pageState === 'thank-other' && (
              <NpsThankOther firstname={firstname} />
            )}

          </div>
        </main>

        <footer className="py-6 text-center" style={{ color: '#64748b', fontSize: '0.75rem' }}>
          &copy; {year} Anhangá Viagens. Todos os direitos reservados.
        </footer>
      </div>
    </>
  );
}

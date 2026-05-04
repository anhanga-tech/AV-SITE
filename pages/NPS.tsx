import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { BRAND_LOGO_WHITE_URL } from '../lib/media-assets';

const GOOGLE_REVIEW_URL = 'https://g.page/r/Ca7sLORX6EQ7EBM/review';
const WHATSAPP_URL = 'https://wa.me/551152833309';

type PageState = 'form' | 'thank-promoter' | 'thank-other';

const SCORE_LABELS: Record<number, string> = {
  0: 'Nada provável',
  5: 'Neutro',
  10: 'Extremamente provável',
};

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
  const [hoveredScore, setHoveredScore] = useState<number | null>(null);

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
        <header className="py-6 px-6 flex justify-center">
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

                <fieldset className="mb-8">
                  <legend
                    className="block text-xs font-bold uppercase mb-4"
                    style={{ letterSpacing: '0.15em', color: '#94a3b8' }}
                  >
                    De 0 a 10, o quanto você recomendaria a Anhangá Viagens para um amigo ou familiar?
                  </legend>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(11, 1fr)', gap: '6px' }}>
                    {Array.from({ length: 11 }, (_, i) => {
                      const selected = score === i;
                      const hovered = hoveredScore === i && !selected;
                      return (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setScore(i)}
                          onMouseEnter={() => setHoveredScore(i)}
                          onMouseLeave={() => setHoveredScore(null)}
                          aria-pressed={selected}
                          aria-label={`Nota ${i}${SCORE_LABELS[i] ? ` — ${SCORE_LABELS[i]}` : ''}`}
                          className="nps-score-btn"
                          style={{
                            width: '100%',
                            aspectRatio: '1',
                            borderRadius: '0.375rem',
                            fontWeight: 800,
                            fontSize: '0.875rem',
                            cursor: 'pointer',
                            transition: 'background 0.12s ease, color 0.12s ease, border-color 0.12s ease, box-shadow 0.12s ease, transform 0.12s ease',
                            background: selected ? '#0056D2' : hovered ? '#263144' : '#1e293b',
                            color: selected ? '#ffffff' : hovered ? '#e2e8f0' : '#64748b',
                            border: selected ? '2px solid #0056D2' : hovered ? '2px solid #475569' : '2px solid #334155',
                            boxShadow: selected ? '4px 4px 0 #003B8E' : hovered ? '3px 3px 0 rgba(0,0,0,0.25)' : '2px 2px 0 rgba(0,0,0,0.3)',
                            transform: selected ? 'translate(-1px,-1px)' : hovered ? 'translate(-0.5px,-0.5px)' : 'none',
                          }}
                        >
                          {i}
                        </button>
                      );
                    })}
                  </div>

                  <div className="flex justify-between mt-2" style={{ color: '#475569', fontSize: '0.75rem' }}>
                    <span>Nada provável</span>
                    <span>Extremamente provável</span>
                  </div>
                </fieldset>

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
                  style={{
                    letterSpacing: '0.12em',
                    background: '#0056D2',
                    color: '#ffffff',
                    border: '2px solid #0056D2',
                    boxShadow: submitEnabled ? '4px 4px 0 #003B8E' : 'none',
                    opacity: submitEnabled ? 1 : 0.5,
                    cursor: submitEnabled ? 'pointer' : 'not-allowed',
                    transform: submitEnabled ? 'translate(-1px,-1px)' : 'none',
                    transition: 'opacity 0.15s ease, box-shadow 0.15s ease, transform 0.15s ease',
                  }}
                >
                  {submitting ? 'Enviando...' : 'Enviar avaliação'}
                </button>
              </form>
            )}

            {pageState === 'thank-promoter' && (
              <div className="nps-thank-card animate-fade-in-up text-center py-8">
                <div
                  className="mx-auto mb-6 flex items-center justify-center rounded-full"
                  style={{
                    width: '4rem',
                    height: '4rem',
                    background: '#FFD600',
                    border: '2px solid #0f172a',
                    boxShadow: '4px 4px 0 #0f172a',
                  }}
                  aria-hidden="true"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0f172a" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>

                <h1
                  className="text-3xl font-extrabold tracking-tight mb-4"
                  style={{ letterSpacing: '-0.025em' }}
                >
                  Muito obrigado{firstname ? `, ${firstname}` : ''}!
                </h1>
                <p className="text-base mb-6" style={{ color: '#94a3b8', lineHeight: '1.75' }}>
                  Que ótimo saber que a experiência foi incrível!<br />
                  Que tal compartilhar sua opinião no Google?
                </p>

                <p
                  className="text-sm mb-6"
                  style={{ color: '#475569' }}
                  aria-live="polite"
                  aria-atomic="true"
                >
                  Abrindo o Google em{' '}
                  <span className="font-bold" style={{ color: '#FFD600' }}>
                    {countdown}
                  </span>{' '}
                  segundo{countdown !== 1 ? 's' : ''}…
                </p>

                <a href={GOOGLE_REVIEW_URL} className="nps-cta nps-cta-yellow">
                  Avaliar no Google agora
                </a>
              </div>
            )}

            {pageState === 'thank-other' && (
              <div className="nps-thank-card animate-fade-in-up text-center py-8">
                <div
                  className="mx-auto mb-6 flex items-center justify-center rounded-full"
                  style={{
                    width: '4rem',
                    height: '4rem',
                    background: '#0056D2',
                    border: '2px solid #0f172a',
                    boxShadow: '4px 4px 0 #003B8E',
                  }}
                  aria-hidden="true"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                  </svg>
                </div>

                <h1
                  className="text-3xl font-extrabold tracking-tight mb-4"
                  style={{ letterSpacing: '-0.025em' }}
                >
                  Obrigado pelo seu feedback!
                </h1>
                <p className="text-base mb-8" style={{ color: '#94a3b8', lineHeight: '1.75' }}>
                  Sua opinião nos ajuda a melhorar cada detalhe.<br />
                  Quer conversar mais sobre sua experiência?
                </p>

                <a
                  href={WHATSAPP_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="nps-cta nps-cta-whatsapp"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  Falar no WhatsApp
                </a>
              </div>
            )}

          </div>
        </main>

        <footer className="py-6 text-center" style={{ color: '#64748b', fontSize: '0.75rem' }}>
          &copy; {new Date().getFullYear()} Anhangá Viagens. Todos os direitos reservados.
        </footer>
      </div>
    </>
  );
}

interface NpsTextareaProps {
  id: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  rows: number;
  required?: boolean;
  maxLength?: number;
}

function NpsTextarea({ id, value, onChange, placeholder, rows, required, maxLength }: NpsTextareaProps) {
  const [focused, setFocused] = useState(false);

  const charsLeft = maxLength !== undefined ? maxLength - value.length : null;
  const showCounter = charsLeft !== null && (focused || value.length > (maxLength ?? 0) * 0.6);
  const counterColor = charsLeft !== null && charsLeft < 100 ? '#f87171' : '#475569';

  return (
    <div>
      <textarea
        id={id}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        required={required}
        maxLength={maxLength}
        className="w-full rounded-xl px-4 py-3 text-sm resize-none"
        style={{
          fontFamily: 'Poppins, sans-serif',
          background: '#1e293b',
          color: '#f1f5f9',
          border: focused ? '2px solid #0ea5e9' : '2px solid #334155',
          boxShadow: focused ? '0 0 0 4px rgba(14,165,233,0.15)' : 'none',
          outline: 'none',
          transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
          lineHeight: '1.65',
        }}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
      {showCounter && (
        <p
          aria-live="polite"
          style={{
            textAlign: 'right',
            fontSize: '0.7rem',
            color: counterColor,
            marginTop: '4px',
            transition: 'color 0.2s ease',
          }}
        >
          {charsLeft} {charsLeft === 1 ? 'caractere restante' : 'caracteres restantes'}
        </p>
      )}
    </div>
  );
}

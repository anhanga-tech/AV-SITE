import type { FormEvent } from 'react';
import { useState, useEffect, useRef, useSyncExternalStore } from 'react';
import { useSearchParams } from 'react-router-dom';
import { BRAND_LOGO_WHITE_URL } from '../lib/media-assets';
import { NpsTextarea } from '../components/nps/NpsTextarea';
import { NpsScoreSelector } from '../components/nps/NpsScoreSelector';
import { NpsThankPromoter } from '../components/nps/NpsThankPromoter';
import { NpsThankOther } from '../components/nps/NpsThankOther';
import { Seo } from '../components/Seo';
import { useAntiBot } from '../hooks/useAntiBot';
import { pushFormAnalyticsEvent } from '../utils/formAnalytics';
import { isFieldCompleteForAnalytics, validateNpsFormFields, type NpsFormFieldErrors } from '../lib/form-v1-validation';

type PageState = 'form' | 'thank-promoter' | 'thank-other';

/*
  "Já estamos no cliente?" como fonte externa, não como estado sincronizado por efeito.

  O prerender de /nps roda sem query string (scripts/prerender.mjs renderiza a rota crua),
  então `token` é sempre vazio lá. Sem este gate o HTML estático nasceria com o bloco
  "Link inválido" — e quem abre /nps/?token=... com link VÁLIDO veria justamente essa
  mensagem até o React assumir (o marcador `/nps` casa com o pathname, então a página
  hidrata de verdade).

  `useSyncExternalStore` em vez de `useState` + `useEffect`: o efeito só roda DEPOIS do
  primeiro paint, então a casca neutra chegaria a aparecer para o respondente (apontado
  pelo React Doctor, regras `rendering-hydration-no-flicker` e `no-initialize-state`, e
  pelo lint `react-hooks/set-state-in-effect`). Com o snapshot de servidor separado, o
  React usa `false` durante a hidratação — casando com o HTML estático — e passa para
  `true` ao concluí-la, sem esperar o paint.

  `subscribe` é um no-op com referência estável (fora do componente): o valor nunca muda
  depois da hidratação, então não há a que reagir, e uma função nova a cada render faria
  o React reassinar à toa.
*/
const subscribeToNothing = () => () => {};
const getIsClientSnapshot = () => true;
const getIsServerSnapshot = () => false;

const PAGE_STYLES = `
  .nps-cta {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.875rem 2rem;
    font-size: 0.875rem;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    border-radius: 0.75rem;
    text-decoration: none;
    border: 2px solid #0f172a;
    transform: translate(-2px, -2px);
    transition: transform 0.15s cubic-bezier(0.16, 1, 0.3, 1),
                box-shadow 0.15s cubic-bezier(0.16, 1, 0.3, 1);
  }
  .nps-cta:hover {
    transform: translate(0, 0);
  }
  .nps-cta:active {
    transform: translate(2px, 2px);
    box-shadow: none !important;
  }
  .nps-cta:focus-visible {
    outline: 2px solid #0ea5e9;
    outline-offset: 2px;
  }
  .nps-cta-yellow {
    background: #FFD600;
    color: #0f172a;
    box-shadow: 4px 4px 0 #0f172a;
  }
  .nps-cta-yellow:hover { box-shadow: 2px 2px 0 #0f172a; }
  .nps-cta-whatsapp {
    background: #25D366;
    color: #0f172a;
    box-shadow: 4px 4px 0 #0f172a;
  }
  .nps-cta-whatsapp:hover { box-shadow: 2px 2px 0 #0f172a; }

  @media (prefers-reduced-motion: reduce) {
    .nps-cta, .nps-thank-card {
      transition: none !important;
      animation: none !important;
      opacity: 1 !important;
      transform: none !important;
    }
  }
`;

export default function NpsPage() {
  const [params] = useSearchParams();
  // Identity is bound server-side to the signed invitation token (issue
  // #1137) — `firstname` here is display-only (the greeting) and never sent
  // to the API; the token is the only thing that proves who is answering.
  const firstname = params.get('firstname')?.trim() ?? '';
  const token = params.get('token')?.trim() ?? '';

  const [score, setScore] = useState<number | null>(null);
  const [reason, setReason] = useState('');
  const [highlight, setHighlight] = useState('');
  const [pageState, setPageState] = useState<PageState>('form');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [fieldErrors, setFieldErrors] = useState<NpsFormFieldErrors>({});
  // O ano fica fora do HTML estático, mesmo padrão do Footer compartilhado
  // (components/Footer.tsx, guardado por tests/hydration.test.ts): desde que /nps é
  // prerenderizada, um ano assado no artefato diverge do relógio do cliente na virada do
  // ano — e, como o artefato é reconstruído no máximo uma vez por dia, a janela vai da
  // última build de 31/12 até a primeira de 01/01, mais o deslocamento UTC−3 de quem está
  // no Brasil. Essa divergência cairia fora da supressão do 404 (o marcador aqui é /nps),
  // virando erro de hidratação real e desfazendo a casca neutra para todo convite válido.
  const [year] = useState(() => new Date().getFullYear());
  // Ver subscribeToNothing acima: `false` no servidor e durante a hidratação, `true` assim
  // que ela conclui — sem passar por um paint com a casca neutra.
  const mounted = useSyncExternalStore(
    subscribeToNothing,
    getIsClientSnapshot,
    getIsServerSnapshot
  );
  const { getAntiBotFields, honeypotProps } = useAntiBot();
  const startedRef = useRef(false);
  const completedFields = useRef<Set<string> | null>(null);

  useEffect(() => {
    const prev = document.title;
    document.title = 'Avaliação de Viagem — Anhangá Viagens';
    return () => { document.title = prev; };
  }, []);

  useEffect(() => {
    pushFormAnalyticsEvent({
      event: 'form_view',
      formType: 'nps',
      formId: 'post-trip-nps',
    });
  }, []);

  function markStarted(fieldName: 'score' | 'reason' | 'highlight', value: string | number | null = '') {
    if (!startedRef.current) {
      startedRef.current = true;
      pushFormAnalyticsEvent({
        event: 'form_start',
        formType: 'nps',
        formId: 'post-trip-nps',
      });
    }
    const trackedFields = completedFields.current ?? (completedFields.current = new Set());
    if (isFieldCompleteForAnalytics(fieldName, value) && !trackedFields.has(fieldName)) {
      trackedFields.add(fieldName);
      pushFormAnalyticsEvent({
        event: 'field_complete',
        formType: 'nps',
        formId: 'post-trip-nps',
        fieldName,
      });
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const validation = validateNpsFormFields({ score });
    if (!validation.valid) {
      setFieldErrors(validation.errors);
      setErrorMessage('Confira os campos destacados para enviar sua avaliação.');
      pushFormAnalyticsEvent({
        event: 'field_error',
        formType: 'nps',
        formId: 'post-trip-nps',
        fieldName: Object.keys(validation.errors)[0],
        errorType: Object.keys(validation.errors)[0] ?? 'validation',
      });
      return;
    }

    setSubmitting(true);
    setErrorMessage('');
    setFieldErrors({});
    pushFormAnalyticsEvent({
      event: 'submit_attempt',
      formType: 'nps',
      formId: 'post-trip-nps',
    });

    try {
      const res = await fetch('/api/submit-nps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          score: validation.normalized.score,
          reason: reason.trim(),
          highlight: highlight.trim(),
          ...getAntiBotFields(),
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(
          (data as { error?: string }).error ?? 'Erro ao enviar avaliação. Tente novamente.'
        );
      }

      pushFormAnalyticsEvent({
        event: 'submit_success',
        formType: 'nps',
        formId: 'post-trip-nps',
      });
      setPageState(validation.normalized.score >= 9 ? 'thank-promoter' : 'thank-other');
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Erro inesperado. Tente novamente.');
      pushFormAnalyticsEvent({
        event: 'submit_failure',
        formType: 'nps',
        formId: 'post-trip-nps',
        errorType: 'api',
      });
    } finally {
      setSubmitting(false);
    }
  }

  const submitEnabled = score !== null && !submitting;

  return (
    <>
      <Seo
        title="Avaliação de Viagem"
        description="Pagina operacional para clientes avaliarem a experiencia com a Anhanga Viagens."
        canonical="https://www.anhanga.tur.br/nps/"
        robots="noindex, nofollow"
        noHreflang
      />
      <style>{PAGE_STYLES}</style>

      <div className="min-h-screen flex flex-col bg-anhanga-dark text-slate-50 font-sans">
        <header className="pt-8 pb-6 flex justify-center">
          <img
            src={BRAND_LOGO_WHITE_URL}
            alt="Anhangá Viagens"
            className="h-16 w-auto"
            loading="eager"
          />
        </header>

        <main className="flex-1 flex flex-col items-center px-6 pb-16 pt-8">
          <div className="w-full max-w-lg">

            {mounted && !token && (
              <div className="nps-thank-card text-center">
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-3">Link inválido</h1>
                <p className="text-base text-slate-400 leading-7">
                  Este link de avaliação não é válido ou já expirou. Solicite um novo link à nossa equipe.
                </p>
              </div>
            )}

            {mounted && token && pageState === 'form' && (
              <form onSubmit={(e) => void handleSubmit(e)} noValidate>
                {/* Honeypot: hidden from humans, blind form-fillers populate it. */}
                <input {...honeypotProps} />
                <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-3">
                  {firstname ? `Olá, ${firstname}!` : 'Olá!'}
                </h1>
                <p className="text-base text-slate-400 leading-7 mb-12">
                  Sua opinião nos ajuda a cuidar de cada detalhe da próxima aventura.
                </p>

                <NpsScoreSelector
                  score={score}
                  onSelect={(nextScore) => {
                    setScore(nextScore);
                    setFieldErrors((prev) => ({ ...prev, score: undefined }));
                    markStarted('score', nextScore);
                  }}
                />

                {fieldErrors.score && (
                  <p className="mb-6 text-sm text-center rounded-xl px-4 py-3 text-red-400 bg-red-500/10 border border-red-500/20" role="alert">
                    {fieldErrors.score}
                  </p>
                )}

                <div className="mb-8">
                  <label
                    htmlFor="nps-reason"
                    className="block text-xs font-black uppercase tracking-[0.15em] text-slate-400 mb-2.5"
                  >
                    Quer contar o motivo?
                    <span className="normal-case font-normal tracking-normal text-slate-600">
                      {' '}(opcional)
                    </span>
                  </label>
                  <NpsTextarea
                    id="nps-reason"
                    value={reason}
                    onChange={(value) => {
                      setReason(value);
                      if (value.trim()) markStarted('reason', value);
                    }}
                    placeholder="Conte-nos sua experiência..."
                    rows={4}
                    maxLength={2000}
                    aria-label="Quer contar o motivo?"
                  />
                </div>

                <div className="mb-10">
                  <label
                    htmlFor="nps-highlight"
                    className="block text-xs font-black uppercase tracking-[0.15em] text-slate-400 mb-2.5"
                  >
                    Qual foi o momento mais marcante da viagem?{' '}
                    <span className="normal-case font-normal tracking-normal text-slate-600">
                      (opcional)
                    </span>
                  </label>
                  <NpsTextarea
                    id="nps-highlight"
                    value={highlight}
                    onChange={(value) => {
                      setHighlight(value);
                      if (value.trim()) markStarted('highlight', value);
                    }}
                    placeholder="Um momento especial que ficou na memória..."
                    rows={3}
                    maxLength={2000}
                    aria-label="Qual foi o momento mais marcante da viagem?"
                  />
                </div>

                {errorMessage && (
                  <p
                    className="mb-5 text-sm text-center rounded-xl px-4 py-3 text-red-400 bg-red-500/10 border border-red-500/20"
                    role="alert"
                  >
                    {errorMessage}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={!submitEnabled}
                  className={[
                    'w-full py-4 text-sm font-extrabold uppercase tracking-[0.1em] rounded-xl',
                    'border-2 transition-all duration-150 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none',
                    'outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-anhanga-action',
                    submitEnabled
                      ? [
                          'bg-anhanga-action border-anhanga-action text-anhanga-dark',
                          'hover:bg-anhanga-actionDark hover:border-anhanga-actionDark hover:text-white',
                          'active:scale-[0.98] motion-reduce:active:scale-100',
                        ].join(' ')
                      : 'bg-slate-800 border-slate-700 text-slate-500 cursor-not-allowed',
                  ].join(' ')}
                >
                  {submitting ? (
                    <span className="inline-flex items-center gap-2">
                      <svg className="animate-spin size-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Enviando…
                    </span>
                  ) : 'Enviar avaliação'}
                </button>
              </form>
            )}

            {pageState === 'thank-promoter' && (
              <NpsThankPromoter firstname={firstname} />
            )}
            {pageState === 'thank-other' && (
              <NpsThankOther firstname={firstname} />
            )}

          </div>
        </main>

        <footer className="py-6 text-center text-xs text-slate-600">
          &copy;{mounted ? ` ${year}` : ''} Anhangá Viagens. Todos os direitos reservados.
        </footer>
      </div>
    </>
  );
}

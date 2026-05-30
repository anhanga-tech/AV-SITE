const GOOGLE_REVIEW_URL = 'https://g.page/r/Ca7sLORX6EQ7EBM/review';

export interface NpsThankPromoterProps {
  firstname: string;
}

export function NpsThankPromoter({ firstname }: NpsThankPromoterProps) {
  return (
    <div className="nps-thank-card animate-fade-in-up text-center py-8">
      <div
        className="mx-auto mb-6 flex items-center justify-center rounded-full size-16 bg-anhanga-yellow border-2 border-anhanga-dark shadow-hard"
        aria-hidden="true"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0f172a" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </div>

      <h1 className="text-3xl font-extrabold tracking-tight mb-4">
        Muito obrigado{firstname ? `, ${firstname}` : ''}!
      </h1>
      <p className="text-base mb-8 text-slate-400 leading-7">
        Ficamos muito felizes com a sua avaliação!<br />
        Uma review no Google ajuda outras pessoas<br />
        a descobrirem a Anhangá. Leva menos de 1 minuto.
      </p>

      <a
        href={GOOGLE_REVIEW_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="nps-cta nps-cta-yellow"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="#0f172a" aria-hidden="true">
          <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"/>
        </svg>
        Deixar minha review no Google
      </a>
    </div>
  );
}

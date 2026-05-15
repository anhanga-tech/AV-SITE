const GOOGLE_REVIEW_URL = 'https://g.page/r/Ca7sLORX6EQ7EBM/review';

export interface NpsThankPromoterProps {
  firstname: string;
  countdown: number;
}

export function NpsThankPromoter({ firstname, countdown }: NpsThankPromoterProps) {
  return (
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

      <h1 className="text-3xl font-extrabold tracking-tight mb-4" style={{ letterSpacing: '-0.025em' }}>
        Muito obrigado{firstname ? `, ${firstname}` : ''}!
      </h1>
      <p className="text-base mb-6" style={{ color: '#94a3b8', lineHeight: '1.75' }}>
        Que ótimo saber que a experiência foi incrível!<br />
        Que tal compartilhar sua opinião no Google?
      </p>

      <p className="text-sm mb-6" style={{ color: '#475569' }} aria-live="polite" aria-atomic="true">
        Abrindo o Google em{' '}
        <span className="font-bold" style={{ color: '#FFD600' }}>{countdown}</span>{' '}
        segundo{countdown !== 1 ? 's' : ''}…
      </p>

      <a href={GOOGLE_REVIEW_URL} className="nps-cta nps-cta-yellow">
        Avaliar no Google agora
      </a>
    </div>
  );
}

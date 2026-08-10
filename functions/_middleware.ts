import * as Sentry from '@sentry/cloudflare';

import { clearErrorTracker, scrubEventUrls, setErrorTracker } from '../lib/error-tracking';

interface CloudflareEnv {
  SENTRY_DSN?: string;
  SENTRY_ENVIRONMENT?: string;
}

export const onRequest = Sentry.sentryPagesPlugin<CloudflareEnv>((context) => {
  const dsn = context.env.SENTRY_DSN;

  if (typeof dsn === 'string' && dsn.trim().length > 0) {
    setErrorTracker(Sentry.captureException);
  } else {
    clearErrorTracker();
  }

  return {
    dsn,
    environment: context.env.SENTRY_ENVIRONMENT || 'production',
    tracesSampleRate: 0.1,
    enableLogs: true,
    // Sampled request transactions report `request.url` verbatim — that URL can
    // carry a credential (the signed `/nps?token=…` invite). See scrubEventUrls.
    beforeSend: scrubEventUrls,
    beforeSendTransaction: scrubEventUrls,
    integrations: [
      Sentry.consoleLoggingIntegration({ levels: ['log', 'warn', 'error'] }),
    ],
  };
});

import * as Sentry from '@sentry/cloudflare';

import {
  clearErrorTracker,
  scrubBreadcrumbUrls,
  scrubEventUrls,
  scrubSpanUrls,
  SENTRY_DATA_COLLECTION,
  setErrorTracker,
} from '../lib/error-tracking';

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
    // SDK v11: logs are enabled by consoleLoggingIntegration itself
    // (`enableLogs` was removed). Without an explicit dataCollection, v11
    // collects request bodies — i.e. lead-form PII. See SENTRY_DATA_COLLECTION.
    dataCollection: SENTRY_DATA_COLLECTION,
    // Errors report `request.url` verbatim — that URL can carry a credential
    // (the signed `/nps?token=…` invite). See scrubEventUrls.
    beforeSend: scrubEventUrls,
    // SDK v11 streams spans by default and never calls
    // `beforeSendTransaction`; sampled request spans carry the same URL.
    beforeSendSpan: scrubSpanUrls,
    // The Workers runtime auto-instruments outbound `fetch` breadcrumbs for
    // Odoo/Gemini calls, so this side needs the same URL scrubbing.
    beforeBreadcrumb: scrubBreadcrumbUrls,
    integrations: [
      Sentry.consoleLoggingIntegration({ levels: ['log', 'warn', 'error'] }),
    ],
  };
});

import * as Sentry from '@sentry/cloudflare';

import { clearErrorTracker, setErrorTracker } from '../lib/error-tracking';

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
  };
});

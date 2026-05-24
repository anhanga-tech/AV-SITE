import * as Sentry from '@sentry/cloudflare';

import { setServerErrorTracker } from '../lib/error-tracking';

interface CloudflareEnv {
  SENTRY_DSN?: string;
  SENTRY_ENVIRONMENT?: string;
}

setServerErrorTracker(Sentry.captureException);

export const onRequest = Sentry.sentryPagesPlugin<CloudflareEnv>((context) => ({
  dsn: context.env.SENTRY_DSN,
  environment: context.env.SENTRY_ENVIRONMENT || 'production',
  tracesSampleRate: 0.1,
}));

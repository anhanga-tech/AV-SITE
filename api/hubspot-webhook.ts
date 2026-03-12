// api/hubspot-webhook.ts
// Receives HubSpot webhooks for closed deals and sends conversions
// This handler depends on modules that Vercel does not support in Edge Functions,
// so it must run on the default Node.js runtime.

import { sendGoogleConversion } from '../lib/conversions/google.js';
import { sendMetaConversion } from '../lib/conversions/meta.js';
import { validateHubSpotSignature } from '../lib/hubspot-validation.js';
import { getDeal, getAssociatedContactId, getContact } from '../services/hubspot.js';

interface HubSpotWebhookEvent {
  subscriptionType?: string;
  propertyName?: string;
  propertyValue?: string;
  objectId?: string | number;
}

function buildJsonResponse(body: Record<string, unknown>, status: number): Response {
  return new Response(JSON.stringify(body), { status });
}

function getWebhookConfig(): { webhookSecret: string; hubspotToken: string } | null {
  const webhookSecret = process.env.HUBSPOT_WEBHOOK_SECRET;
  const hubspotToken = process.env.HUBSPOT_TOKEN;

  if (!webhookSecret || !hubspotToken) {
    const missingEnvVars: string[] = [];
    if (!webhookSecret) {
      missingEnvVars.push('HUBSPOT_WEBHOOK_SECRET');
    }
    if (!hubspotToken) {
      missingEnvVars.push('HUBSPOT_TOKEN');
    }

    console.error(`HUBSPOT_WEBHOOK: Missing environment variables: ${missingEnvVars.join(', ')}`);
    return null;
  }

  return { webhookSecret, hubspotToken };
}

function getMissingConfigResponse(): Response {
  const missingEnvVars = [
    !process.env.HUBSPOT_WEBHOOK_SECRET ? 'HUBSPOT_WEBHOOK_SECRET' : null,
    !process.env.HUBSPOT_TOKEN ? 'HUBSPOT_TOKEN' : null,
  ].filter(Boolean);

  return buildJsonResponse(
    { error: `Missing environment variables: ${missingEnvVars.join(', ')}` },
    500,
  );
}

async function parseWebhookEvents(body: string): Promise<HubSpotWebhookEvent[] | null> {
  try {
    const parsedBody = JSON.parse(body) as unknown;
    return Array.isArray(parsedBody) ? parsedBody as HubSpotWebhookEvent[] : null;
  } catch {
    return null;
  }
}

function isClosedWonDealEvent(event: HubSpotWebhookEvent): boolean {
  return event.subscriptionType === 'deal.propertyChange'
    && event.propertyName === 'dealstage'
    && event.propertyValue === 'closedwon';
}

function collectConversionFailures(
  googleResult: PromiseSettledResult<{ success: boolean; error?: string }>,
  metaResult: PromiseSettledResult<{ success: boolean; error?: string }>,
): string[] {
  const conversionFailures: string[] = [];

  if (googleResult.status === 'rejected') {
    conversionFailures.push(`Google Ads request rejected: ${String(googleResult.reason)}`);
  } else if (!googleResult.value.success) {
    conversionFailures.push(`Google Ads request failed: ${googleResult.value.error ?? 'Unknown error'}`);
  }

  if (metaResult.status === 'rejected') {
    conversionFailures.push(`Meta request rejected: ${String(metaResult.reason)}`);
  } else if (!metaResult.value.success) {
    conversionFailures.push(`Meta request failed: ${metaResult.value.error ?? 'Unknown error'}`);
  }

  return conversionFailures;
}

async function processClosedWonEvent(event: HubSpotWebhookEvent, hubspotToken: string): Promise<void> {
  const dealId = String(event.objectId);
  const deal = await getDeal(hubspotToken, dealId);
  const contactId = await getAssociatedContactId(hubspotToken, dealId);

  if (!contactId) return;

  const contact = await getContact(hubspotToken, contactId, [
    'email',
    'firstname',
    'lastname',
    'phone',
    'hs_google_click_id',
    'hs_facebook_click_id',
    'ga_client_id'
  ]);

  const amount = parseFloat(deal.properties.amount || '0');
  const email = contact.properties.email || undefined;
  const phone = contact.properties.phone || undefined;
  const gclid = contact.properties.hs_google_click_id || undefined;
  const fbclid = contact.properties.hs_facebook_click_id || undefined;

  const [googleResult, metaResult] = await Promise.allSettled([
    sendGoogleConversion('purchase', {
      value: amount,
      email,
      phone,
      gclid
    }),
    sendMetaConversion({
      eventName: 'Purchase',
      value: amount,
      email,
      phone,
      firstName: contact.properties.firstname || undefined,
      lastName: contact.properties.lastname || undefined,
      fbclid
    })
  ]);

  const conversionFailures = collectConversionFailures(googleResult, metaResult);
  if (conversionFailures.length > 0) {
    console.warn(`HUBSPOT_WEBHOOK: Conversion tracking incomplete for deal ${dealId}: ${conversionFailures.join('; ')}`);
    return;
  }

  console.log(`HUBSPOT_WEBHOOK: Conversion sent for deal ${dealId}`);
}

export default async function handler(request: Request): Promise<Response> {
  if (request.method !== 'POST') {
    return buildJsonResponse({ error: 'Method not allowed' }, 405);
  }

  const config = getWebhookConfig();
  if (!config) {
    return getMissingConfigResponse();
  }

  const signature = request.headers.get('X-HubSpot-Signature-v3');
  const timestamp = request.headers.get('X-HubSpot-Request-Timestamp');
  const body = await request.text();

  const isValid = await validateHubSpotSignature(
    signature,
    timestamp,
    body,
    request.url,
    request.method,
    config.webhookSecret
  );

  if (!isValid) {
    return buildJsonResponse({ error: 'Invalid signature' }, 401);
  }

  const events = await parseWebhookEvents(body);
  if (!events) {
    return buildJsonResponse({ error: 'Invalid JSON body' }, 400);
  }

  for (const event of events) {
    if (!isClosedWonDealEvent(event)) continue;

    const dealId = String(event.objectId);
    try {
      await processClosedWonEvent(event, config.hubspotToken);
    } catch (err) {
      console.error(`HUBSPOT_WEBHOOK: Error processing deal ${dealId}:`, err);
    }
  }

  console.log('HUBSPOT_WEBHOOK: processed events', events?.length ?? 0);
  return buildJsonResponse({ success: true }, 200);
}

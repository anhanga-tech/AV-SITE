// api/hubspot-webhook.ts
// Receives HubSpot webhooks for closed deals and sends conversions (PLACEHOLDER)
// This handler depends on modules that Vercel does not support in Edge Functions,
// so it must run on the default Node.js runtime.

import { sendGoogleConversion } from '../lib/conversions/google.ts';
import { sendMetaConversion } from '../lib/conversions/meta.ts';
import { validateHubSpotSignature } from '../lib/hubspot-validation.ts';
import { getDeal, getAssociatedContactId, getContact } from '../services/hubspot.ts';

interface HubSpotWebhookEvent {
  subscriptionType?: string;
  propertyName?: string;
  propertyValue?: string;
  objectId?: string | number;
}

export default async function handler(request: Request): Promise<Response> {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }

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
    return new Response(JSON.stringify({ error: `Missing environment variables: ${missingEnvVars.join(', ')}` }), { status: 500 });
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
    webhookSecret
  );

  if (!isValid) {
    return new Response(JSON.stringify({ error: 'Invalid signature' }), { status: 401 });
  }

  let events: HubSpotWebhookEvent[];
  try {
    const parsedBody = JSON.parse(body) as unknown;
    if (!Array.isArray(parsedBody)) {
      return new Response(JSON.stringify({ error: 'Invalid JSON body' }), { status: 400 });
    }

    events = parsedBody as HubSpotWebhookEvent[];
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), { status: 400 });
  }

  // Process events for Closed Won deals
  for (const event of events) {
    if (
      event.subscriptionType === 'deal.propertyChange' &&
      event.propertyName === 'dealstage' &&
      event.propertyValue === 'closedwon'
    ) {
      const dealId = String(event.objectId);
      try {
        const deal = await getDeal(hubspotToken, dealId);
        const contactId = await getAssociatedContactId(hubspotToken, dealId);

        if (contactId) {
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

          if (conversionFailures.length > 0) {
            console.warn(`HUBSPOT_WEBHOOK: Conversion tracking incomplete for deal ${dealId}: ${conversionFailures.join('; ')}`);
          } else {
            console.log(`HUBSPOT_WEBHOOK: Conversion sent for deal ${dealId}`);
          }
        }
      } catch (err) {
        console.error(`HUBSPOT_WEBHOOK: Error processing deal ${dealId}:`, err);
      }
    }
  }

  console.log('HUBSPOT_WEBHOOK: processed events', events?.length ?? 0);
  return new Response(JSON.stringify({ success: true }), { status: 200 });
}

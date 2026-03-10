// api/hubspot-webhook.ts
// Receives HubSpot webhooks for closed deals and sends conversions (PLACEHOLDER)


export const config = { runtime: 'edge' };

import { sendGoogleConversion } from '../lib/conversions/google.ts';
import { sendMetaConversion } from '../lib/conversions/meta.ts';
import { validateHubSpotSignature } from '../lib/hubspot-validation.ts';
import { getDeal, getAssociatedContactId, getContact } from '../services/hubspot.ts';

export default async function handler(request: Request): Promise<Response> {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }

  const webhookSecret = process.env.HUBSPOT_WEBHOOK_SECRET;
  const hubspotToken = process.env.HUBSPOT_TOKEN;

  if (!webhookSecret || !hubspotToken) {
    return new Response(JSON.stringify({ error: 'Missing environment variables' }), { status: 500 });
  }

  const signature = request.headers.get('X-HubSpot-Signature-v3');
  const timestamp = request.headers.get('X-HubSpot-Request-Timestamp');
  const body = await request.text();

  const url = new URL(request.url);
  const baseUrl = `${url.protocol}//${url.host}${url.pathname}`;

  const isValid = await validateHubSpotSignature(
    signature,
    timestamp,
    body,
    baseUrl,
    request.method,
    webhookSecret
  );

  if (!isValid) {
    return new Response(JSON.stringify({ error: 'Invalid signature' }), { status: 401 });
  }

  let events: HubSpotEvent[];
  try {
    events = JSON.parse(body);
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

          await Promise.allSettled([
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
          console.log(`HUBSPOT_WEBHOOK: Conversion sent for deal ${dealId}`);
        }
      } catch (err) {
        console.error(`HUBSPOT_WEBHOOK: Error processing deal ${dealId}:`, err);
      }
    }
  }

  console.log('HUBSPOT_WEBHOOK: processed events', events?.length ?? 0);
  return new Response(JSON.stringify({ success: true }), { status: 200 });
}

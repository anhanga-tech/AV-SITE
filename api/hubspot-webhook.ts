// api/hubspot-webhook.ts
// Receives HubSpot webhooks for closed deals and sends conversions (PLACEHOLDER)


export const config = { runtime: 'edge' };

import { sendGoogleConversion } from '../lib/conversions/google.ts';
import { sendMetaConversion } from '../lib/conversions/meta.ts';
import { validateHubSpotSignature } from '../lib/hubspot-validation.ts';

export default async function handler(request: Request): Promise<Response> {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }

  const webhookSecret = process.env.HUBSPOT_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return new Response(JSON.stringify({ error: 'Missing HUBSPOT_WEBHOOK_SECRET' }), { status: 500 });
  }

  const body = await request.text();

  // Validate HubSpot webhook signature (V3)
  const isValid = await validateHubSpotSignature(request, body, webhookSecret);
  if (!isValid) {
    return new Response(JSON.stringify({ error: 'Invalid signature' }), { status: 401 });
  }

  let events: unknown[];
  try {
    events = JSON.parse(body);
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), { status: 400 });
  }

  // TODO: Handle deal stage = closed won
  // TODO: Fetch deal details & associated contact
  // TODO: sendGoogleConversion('purchase', { value, email, phone })
  // TODO: sendMetaConversion({ eventName: 'Purchase', value, email, phone })

  console.log('HUBSPOT_WEBHOOK: received events', events?.length ?? 0);
  return new Response(JSON.stringify({ success: true }), { status: 200 });
}

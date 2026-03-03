// api/hubspot-webhook.ts
// Receives HubSpot webhooks for closed deals and sends conversions (PLACEHOLDER)

import { sendGoogleConversion } from '../lib/conversions/google';
import { sendMetaConversion } from '../lib/conversions/meta';

export const config = { runtime: 'edge' };

export default async function handler(request: Request): Promise<Response> {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }

  // TODO: Validate HubSpot webhook signature (HUBSPOT_WEBHOOK_SECRET)
  // Docs: https://developers.hubspot.com/docs/api/webhooks/validating-signatures

  const hubspotToken = process.env.HUBSPOT_TOKEN;
  if (!hubspotToken) {
    return new Response(JSON.stringify({ error: 'Missing HUBSPOT_TOKEN' }), { status: 500 });
  }

  const body = await request.text();
  const events = JSON.parse(body);

  // TODO: Handle deal stage = closed won
  // TODO: Fetch deal details & associated contact
  // TODO: sendGoogleConversion('purchase', { value, email, phone })
  // TODO: sendMetaConversion({ eventName: 'Purchase', value, email, phone })

  console.log('HUBSPOT_WEBHOOK: received events', events?.length ?? 0);
  return new Response(JSON.stringify({ success: true }), { status: 200 });
}
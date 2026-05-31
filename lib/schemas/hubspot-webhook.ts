import { z } from 'zod';

export const HubSpotWebhookEventSchema = z.looseObject({
    subscriptionType: z.string().optional(),
    propertyName:     z.string().optional(),
    propertyValue:    z.string().optional(),
    objectId:         z.union([z.string(), z.number()]).optional(),
});

export const HubSpotWebhookPayloadSchema = z.array(HubSpotWebhookEventSchema);

export type HubSpotWebhookEvent = z.infer<typeof HubSpotWebhookEventSchema>;

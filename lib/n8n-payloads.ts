import { cleanString } from './lead-logic';

/**
 * n8n payload builders. After the Odoo cut-over (the 4 lead forms post directly
 * to Odoo), the post-trip NPS form is the only remaining n8n consumer.
 */

export interface N8nNpsPayload {
    requestId: string;
    firstname: string;
    email: string;
    score: number;
    reason: string;
    highlight: string;
    submittedAt: string;
}

export interface N8nNpsInput {
    firstname: string;
    email: string;
    score: number;
    reason: string;
    highlight: string;
}

export function buildN8nNpsPayload(input: N8nNpsInput, requestId: string): N8nNpsPayload {
    return {
        requestId,
        firstname: cleanString(input.firstname),
        email: cleanString(input.email),
        score: input.score,
        reason: cleanString(input.reason),
        highlight: cleanString(input.highlight),
        submittedAt: new Date().toISOString(),
    };
}

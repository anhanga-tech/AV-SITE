import { GoogleGenAI } from "@google/genai";
import { checkRateLimit as checkRateLimitInternal } from '../lib/rate-limit.ts';
import {
    RATE_LIMIT_WINDOW_MS,
    RATE_LIMIT_MAX_REQUESTS
} from '../lib/ai/constants.ts';
import {
    resolveMaxMessageLength,
    hasOversizedMessage,
    getClientIP
} from '../lib/ai/utils.ts';
import {
    budgetTool,
    extractBudgetToolCallFromText,
    stripToolCallJsonBlock,
    extractChipsFromText
} from '../lib/ai/tools.ts';
import {
    validateBudgetToolArgs,
    buildSafetyMessage,
    buildRefinementMessage
} from '../lib/ai/validation.ts';
import { SYSTEM_INSTRUCTION } from '../lib/ai/prompt.ts';

// Re-export for backward compatibility (tests often import from the API file)
export { resolveMaxMessageLength, hasOversizedMessage } from '../lib/ai/utils.ts';
export { extractBudgetToolCallFromText } from '../lib/ai/tools.ts';
export { detectBlockedDestination } from '../lib/ai/validation.ts';
export { SYSTEM_INSTRUCTION } from '../lib/ai/prompt.ts';

export default async function handler(request: Request) {
    // CORS headers for all responses
    const corsHeaders = {
        'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGIN || '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
    };

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
        return new Response(null, { status: 204, headers: corsHeaders });
    }

    if (request.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method not allowed' }), {
            status: 405,
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
    }

    // Rate limiting check
    const clientIP = getClientIP(request);
    const rateLimit = await checkRateLimitInternal(clientIP, {
        limit: RATE_LIMIT_MAX_REQUESTS,
        windowMs: RATE_LIMIT_WINDOW_MS,
        prefix: 'ratelimit:generate',
    });

    if (!rateLimit.allowed) {
        console.warn(`RATE_LIMIT: IP ${clientIP} exceeded limit. Reset in ${Math.ceil(rateLimit.resetIn / 1000)}s`);
        return new Response(JSON.stringify({
            error: 'Muitas requisições. Por favor, aguarde um momento.',
            retryAfter: Math.ceil(rateLimit.resetIn / 1000)
        }), {
            status: 429,
            headers: {
                'Content-Type': 'application/json',
                'Retry-After': String(Math.ceil(rateLimit.resetIn / 1000)),
                'X-RateLimit-Remaining': '0',
                'X-RateLimit-Reset': String(Math.ceil(rateLimit.resetIn / 1000)),
                ...corsHeaders
            },
        });
    }

    try {
        const apiKey = process.env.GEMINI_API_KEY;

        // Debug logs for environment variables
        console.log('[Edge Function] Environment check:');
        console.log('- GEMINI_API_KEY present:', !!apiKey);
        console.log('- GEMINI_MODEL:', process.env.GEMINI_MODEL || 'gemini-3.1-flash-lite-preview (default)');
        console.log('- ALLOWED_ORIGIN:', process.env.ALLOWED_ORIGIN || '*');

        if (!apiKey) {
            console.error('SERVER: GEMINI_API_KEY not found in environment variables');
            console.error('SERVER: Available GEMINI_* keys:', Object.keys(process.env).filter(k => k.includes('GEMINI')));
            return new Response(JSON.stringify({
                error: 'Erro interno de configuração'
            }), {
                status: 500,
                headers: { 'Content-Type': 'application/json', ...corsHeaders },
            });
        }

        console.log('SERVER: GEMINI_API_KEY is configured');

        const { contents } = await request.json();

        // Security validation for input
        if (!contents || !Array.isArray(contents) || contents.length === 0) {
            return new Response(JSON.stringify({ error: 'Contents must be a non-empty array' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json', ...corsHeaders },
            });
        }

        // Limit the number of messages to prevent excessive resource consumption (basic DoS protection)
        if (contents.length > 50) {
            return new Response(JSON.stringify({ error: 'Too many messages in history' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json', ...corsHeaders },
            });
        }

        const MAX_MESSAGE_LENGTH = resolveMaxMessageLength(process.env.MAX_MESSAGE_LENGTH);
        if (hasOversizedMessage(contents, MAX_MESSAGE_LENGTH)) {
            return new Response(JSON.stringify({ error: 'Message too long' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json', ...corsHeaders },
            });
        }

        const ai = new GoogleGenAI({ apiKey });
        const modelName = process.env.GEMINI_MODEL || 'gemini-3.1-flash-lite-preview';

        const response = await ai.models.generateContent({
            model: modelName,
            contents,
            config: {
                tools: [{ functionDeclarations: [budgetTool] }],
                systemInstruction: SYSTEM_INSTRUCTION,
                temperature: 0.7,
            }
        });

        const candidate = response.candidates?.[0];
        const textPart = candidate?.content?.parts?.find((part) => part.text);
        const functionCallPart = candidate?.content?.parts?.find((part) => part.functionCall);

        let responseText = textPart?.text;
        let responseFunctionCall = functionCallPart?.functionCall;

        if (!responseFunctionCall && responseText) {
            const fallbackToolCall = extractBudgetToolCallFromText(responseText);
            if (fallbackToolCall) {
                responseFunctionCall = fallbackToolCall;
                responseText = stripToolCallJsonBlock(responseText);
                if (!responseText) {
                    responseText = 'Prontinho! ✨ Preparei seu link direto para falar com nossos especialistas. É só clicar abaixo 👇';
                }
            }
        }

        if (responseFunctionCall?.name === 'generate_budget_link') {
            const validation = validateBudgetToolArgs(responseFunctionCall.args);

            if (validation.safetyBlock) {
                responseText = buildSafetyMessage(validation.safetyBlock);
                responseFunctionCall = undefined;
            } else if (!validation.valid || !validation.normalizedArgs) {
                responseText = buildRefinementMessage(validation.missing);
                responseFunctionCall = undefined;
            } else {
                const normalizedArgs: Record<string, unknown> = { ...validation.normalizedArgs };
                responseFunctionCall = {
                    name: 'generate_budget_link',
                    args: normalizedArgs,
                };
            }
        }

        // Extract chips from response text if present
        const { text: cleanedText, chips } = extractChipsFromText(responseText || '');
        responseText = cleanedText;

        return new Response(JSON.stringify({
            text: responseText,
            chips,
            functionCall: responseFunctionCall
        }), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'X-RateLimit-Remaining': String(rateLimit.remaining),
                'X-RateLimit-Reset': String(Math.ceil(rateLimit.resetIn / 1000)),
                ...corsHeaders
            },
        });

    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('SERVER: Error proxying to Gemini:', errorMessage);

        // Don't leak internal error details to the client
        return new Response(JSON.stringify({
            error: 'Error processing request'
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
    }
}

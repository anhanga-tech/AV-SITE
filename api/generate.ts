import { GoogleGenAI } from "@google/genai";
import { checkRateLimit as checkRateLimitInternal } from '../lib/rate-limit.ts';
import { buildCorsHeaders, getClientIP } from '../lib/network.ts';
import { budgetTool } from '../lib/ai/tools.ts';
import { SYSTEM_INSTRUCTION } from '../lib/ai/prompt.ts';
import { DEFAULT_GEMINI_MODEL } from '../lib/ai/constants.ts';
import {
    resolveMaxMessageLength,
    hasOversizedMessage,
    extractBudgetToolCallFromText,
    stripToolCallJsonBlock,
    extractChipsFromText
} from '../lib/ai/utils.ts';
import {
    validateBudgetToolArgs,
    buildSafetyMessage,
    buildRefinementMessage
} from '../lib/ai/validation.ts';

// Configuration
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute window
const RATE_LIMIT_MAX_REQUESTS = 10; // Max 10 requests per minute per IP
const GEMINI_3_DEFAULT_TEMPERATURE = 1.0;
const LEGACY_DEFAULT_TEMPERATURE = 0.7;

interface ApiErrorShape {
    status?: number;
    message?: string;
    error?: {
        message?: string;
        status?: string | number;
    };
}

function buildJsonResponse(
    body: Record<string, unknown>,
    status: number,
    corsHeaders: Record<string, string>,
): Response {
    return new Response(JSON.stringify(body), {
        status,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
}

function resolveTemperature(modelName: string): number {
    const envValue = Number(process.env.GEMINI_TEMPERATURE);

    if (Number.isFinite(envValue) && envValue >= 0) {
        return envValue;
    }

    return modelName.startsWith('gemini-3') ? GEMINI_3_DEFAULT_TEMPERATURE : LEGACY_DEFAULT_TEMPERATURE;
}

function collectTextParts(parts: Array<{ text?: string | null }> | undefined): string | undefined {
    if (!parts || parts.length === 0) return undefined;

    const text = parts
        .map((part) => typeof part.text === 'string' ? part.text.trim() : '')
        .filter(Boolean)
        .join('\n')
        .trim();

    return text || undefined;
}

function buildEmptyModelResponseMessage(): string {
    return 'Não consegui gerar uma resposta agora. Pode reformular sua pergunta de viagem e tentar novamente?';
}

function normalizeError(error: unknown): { status?: number; message: string } {
    if (!error || typeof error !== 'object') {
        return { message: 'Unknown error' };
    }

    const candidate = error as ApiErrorShape;
    const nestedMessage = candidate.error?.message;

    return {
        status: typeof candidate.status === 'number' ? candidate.status : undefined,
        message: nestedMessage || candidate.message || 'Unknown error',
    };
}

export default async function handler(request: Request) {
    // CORS headers for all responses
    const corsHeaders = buildCorsHeaders();

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
        console.log('- GEMINI_MODEL:', process.env.GEMINI_MODEL || `${DEFAULT_GEMINI_MODEL} (default)`);
        console.log('- ALLOWED_ORIGIN:', process.env.ALLOWED_ORIGIN || '*');

        if (!apiKey) {
            console.error('SERVER: GEMINI_API_KEY not found in environment variables');
            console.error('SERVER: Available GEMINI_* keys:', Object.keys(process.env).filter(k => k.includes('GEMINI')));
            return buildJsonResponse({
                code: 'SERVER_CONFIG_ERROR',
                error: 'Erro interno de configuração'
            }, 500, corsHeaders);
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
        const modelName = process.env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL;
        const temperature = resolveTemperature(modelName);

        const response = await ai.models.generateContent({
            model: modelName,
            contents,
            config: {
                tools: [{ functionDeclarations: [budgetTool] }],
                systemInstruction: SYSTEM_INSTRUCTION,
                temperature,
            }
        });

        const candidate = response.candidates?.[0];
        const textPart = collectTextParts(candidate?.content?.parts);
        const functionCallPart = candidate?.content?.parts?.find((part) => part.functionCall);
        const promptBlockReason = response.promptFeedback?.blockReason;
        const finishReason = candidate?.finishReason;

        let responseText = response.text?.trim() || textPart;
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

        if (!responseFunctionCall && !responseText) {
            if (promptBlockReason) {
                console.warn('SERVER: Gemini blocked prompt', {
                    blockReason: promptBlockReason,
                    responseId: response.responseId,
                    modelVersion: response.modelVersion,
                });
            } else {
                console.warn('SERVER: Gemini returned empty payload', {
                    finishReason,
                    responseId: response.responseId,
                    modelVersion: response.modelVersion,
                });
            }

            responseText = buildEmptyModelResponseMessage();
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

        return buildJsonResponse({
            text: responseText,
            chips,
            functionCall: responseFunctionCall
        }, 200, {
            'X-RateLimit-Remaining': String(rateLimit.remaining),
            'X-RateLimit-Reset': String(Math.ceil(rateLimit.resetIn / 1000)),
            ...corsHeaders
        });

    } catch (error: unknown) {
        const normalized = normalizeError(error);
        console.error('SERVER: Error proxying to Gemini:', normalized);

        if (normalized.status === 401 || normalized.status === 403) {
            return buildJsonResponse({
                code: 'GEMINI_AUTH_ERROR',
                error: 'Erro de autenticação com o provedor de IA'
            }, 401, corsHeaders);
        }

        if (normalized.status === 429) {
            return buildJsonResponse({
                code: 'GEMINI_RATE_LIMIT',
                error: 'O serviço de IA atingiu o limite temporário de uso'
            }, 429, corsHeaders);
        }

        if (normalized.status === 404 && /model/i.test(normalized.message)) {
            return buildJsonResponse({
                code: 'GEMINI_MODEL_ERROR',
                error: 'Modelo Gemini inválido ou indisponível no servidor'
            }, 500, corsHeaders);
        }

        if (normalized.status && normalized.status >= 500) {
            return buildJsonResponse({
                code: 'GEMINI_UPSTREAM_ERROR',
                error: 'Serviço de IA temporariamente indisponível'
            }, 503, corsHeaders);
        }

        return buildJsonResponse({
            code: 'GEMINI_INTERNAL_ERROR',
            error: 'Error processing request'
        }, 500, corsHeaders);
    }
}

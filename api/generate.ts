export const config = {
    runtime: 'edge',
};

import type { ContentListUnion } from '@google/genai';
import { checkRateLimit } from '../lib/rate-limit';
import { buildCorsHeaders, getClientIP } from '../lib/network';
import { logger } from '../lib/logger';
import { budgetTool } from '../lib/ai/tools';
import { SYSTEM_INSTRUCTION } from '../lib/ai/prompt';
import {
    buildGeminiClientOptions,
    resolveGeminiProviderConfig,
    type GeminiProviderConfig,
} from '../lib/ai/gemini-config';
import { buildGenerateHandoff, type GenerateHandoff } from '../lib/ai/handoff';
import type { BudgetToolArgs } from '../lib/ai/types';
import {
    resolveMaxMessageLength,
    hasOversizedMessage,
    hasOversizedPayload,
    extractBudgetToolCallFromText,
    stripToolCallJsonBlock,
    extractChipsFromText,
    normalizeText,
} from '../lib/ai/utils';
import {
    validateBudgetToolArgs,
    buildSafetyMessage,
    buildRefinementMessage,
} from '../lib/ai/validation';
import { GenerateRequestSchema } from '../lib/schemas/generate';

// Configuration
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute window
const RATE_LIMIT_MAX_REQUESTS = 10; // Max 10 requests per minute per IP
const GEMINI_3_DEFAULT_TEMPERATURE = 1.0;
const LEGACY_DEFAULT_TEMPERATURE = 0.7;
const HANDOFF_REPAIR_TEMPERATURE = 0.1;
const HANDOFF_READY_MESSAGE = 'Perfeito. Seu pré-atendimento está pronto. Preencha seus dados abaixo para continuar com nossa equipe.';
const HANDOFF_REPAIR_SYSTEM_INSTRUCTION = `${SYSTEM_INSTRUCTION}

HANDOFF_REPAIR_POLICY
- Sua tarefa agora é APENAS revisar o histórico e concluir o handoff corretamente.
- Se os dados mínimos já estiverem disponíveis, use SOMENTE a ferramenta generate_budget_link.
- Se ainda faltar dado obrigatório, responda com uma única mensagem curta pedindo apenas o dado faltante.
- É proibido encerrar com link manual, markdown de CTA, URL, ou instrução para clicar no WhatsApp.
- Não escreva JSON manual de ferramenta. Use a ferramenta real quando o handoff estiver pronto.`;

interface ApiErrorShape {
    status?: number;
    message?: string;
    error?: {
        message?: string;
        status?: string | number;
    };
}

interface ResponseFunctionCall {
    name?: string;
    args?: unknown;
}

interface ResponsePartShape {
    text?: string | null;
    functionCall?: ResponseFunctionCall;
}

interface ResponseCandidateShape {
    content?: {
        parts?: ResponsePartShape[];
    };
    finishReason?: string | null;
}

export interface ModelResponseShape {
    candidates?: ResponseCandidateShape[];
    promptFeedback?: {
        blockReason?: string | null;
    };
    responseId?: string;
    modelVersion?: string;
    text?: string | null;
}

interface GenerateSuccessBody {
    text: string;
    chips?: string[];
    functionCall?: ResponseFunctionCall;
    handoff?: GenerateHandoff;
}

interface RequestModelResponseOptions {
    systemInstruction?: string;
    temperature?: number;
}

interface BuildGenerateSuccessOptions {
    apiKey: string;
    modelName: string;
    contents: unknown[];
    clientOptions?: GeminiClientOptions;
    repairModelResponse?: (repairContents: unknown[]) => Promise<ModelResponseShape>;
}

type ResolvedGeminiProviderConfig = Exclude<GeminiProviderConfig, { ok: false }>;
type GeminiClientOptions = ReturnType<typeof buildGeminiClientOptions>;

function buildJsonResponse(
    body: unknown,
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
        .flatMap((part) => {
            const t = typeof part.text === 'string' ? part.text.trim() : '';
            return t ? [t] : [];
        })
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

function buildMethodNotAllowedResponse(corsHeaders: Record<string, string>): Response {
    return buildJsonResponse({ error: 'Method not allowed' }, 405, corsHeaders);
}

function buildRateLimitHeaders(rateLimit: { resetIn: number; remaining: number }): Record<string, string> {
    return {
        'X-RateLimit-Remaining': String(rateLimit.remaining),
        'X-RateLimit-Reset': String(Math.ceil(rateLimit.resetIn / 1000)),
    };
}

async function getRateLimitState(
    request: Request,
    corsHeaders: Record<string, string>,
): Promise<Response | { rateLimit: Awaited<ReturnType<typeof checkRateLimit>> }> {
    const clientIP = getClientIP(request);
    const rateLimit = await checkRateLimit(clientIP, {
        limit: RATE_LIMIT_MAX_REQUESTS,
        windowMs: RATE_LIMIT_WINDOW_MS,
        prefix: 'ratelimit:generate',
    });

    if (rateLimit.allowed) {
        return { rateLimit };
    }

    logger.warn('RATE_LIMIT', {
        clientIP,
        retryAfterSeconds: Math.ceil(rateLimit.resetIn / 1000),
    });
    return buildJsonResponse({
        error: 'Muitas requisições. Por favor, aguarde um momento.',
        retryAfter: Math.ceil(rateLimit.resetIn / 1000)
    }, 429, {
        'Retry-After': String(Math.ceil(rateLimit.resetIn / 1000)),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': String(Math.ceil(rateLimit.resetIn / 1000)),
        ...corsHeaders
    });
}

function buildConfigErrorResponse(
    config: Extract<GeminiProviderConfig, { ok: false }>,
    corsHeaders: Record<string, string>,
): Response {
    logger.error('SERVER: Gemini provider configuration is incomplete', {
        missing: config.missing,
    });

    return buildJsonResponse({
        code: 'SERVER_CONFIG_ERROR',
        error: 'Erro interno de configuração'
    }, 500, corsHeaders);
}

function logProviderStatus(config: ResolvedGeminiProviderConfig): void {
    logger.info('SERVER: Gemini provider configured', {
        modelName: config.modelName,
        useGateway: config.useGateway,
        gatewayId: config.useGateway ? config.gatewayId : undefined,
    });
}

async function parseGenerateContents(
    request: Request,
    corsHeaders: Record<string, string>,
): Promise<unknown[] | Response> {
    let body: unknown;
    try {
        body = await request.json();
    } catch {
        return buildJsonResponse({ error: 'VALIDATION_ERROR', details: { formErrors: ['Corpo JSON inválido'], fieldErrors: {} } }, 400, corsHeaders);
    }

    const result = GenerateRequestSchema.safeParse(body);
    if (!result.success) {
        return buildJsonResponse(
            { error: 'VALIDATION_ERROR', details: result.error.flatten() },
            400,
            corsHeaders,
        );
    }

    const { contents } = result.data;

    if (hasOversizedPayload(contents)) {
        return buildJsonResponse({ error: 'VALIDATION_ERROR', details: { formErrors: ['Carga útil muito grande'], fieldErrors: {} } }, 400, corsHeaders);
    }

    const maxMessageLength = resolveMaxMessageLength(process.env.MAX_MESSAGE_LENGTH);
    if (hasOversizedMessage(contents, maxMessageLength)) {
        return buildJsonResponse({ error: 'Message too long' }, 400, corsHeaders);
    }

    return contents;
}

async function requestModelResponse(
    clientOptions: GeminiClientOptions,
    modelName: string,
    contents: unknown[],
    options: RequestModelResponseOptions = {},
): Promise<ModelResponseShape> {
    const { GoogleGenAI } = await import("@google/genai");
    const ai = new GoogleGenAI(clientOptions);

    return await ai.models.generateContent({
        model: modelName,
        contents: contents as ContentListUnion,
        config: {
            tools: [{ functionDeclarations: [budgetTool] }],
            systemInstruction: options.systemInstruction || SYSTEM_INSTRUCTION,
            temperature: options.temperature ?? resolveTemperature(modelName),
        }
    }) as ModelResponseShape;
}

function containsWhatsAppUrl(text?: string): boolean {
    if (!text) return false;
    return /wa\.me|api\.whatsapp\.com/i.test(text);
}

export function containsInvalidTextualHandoff(text?: string): boolean {
    if (!text) return false;
    if (containsWhatsAppUrl(text)) return true;

    const normalized = normalizeText(text);
    const invalidSignals = [
        'clique aqui para receber seu orcamento',
        'clique no link abaixo',
        'finalizar seu atendimento',
        'falar com nossos especialistas',
        'preparei seu link direto',
        'preparei tudo por aqui',
        'orcamento personalizado',
    ];

    return invalidSignals.some((signal) => normalized.includes(signal));
}

function stripUnsafeWhatsAppLinks(text: string): string {
    return text
        .replace(/\[([^\]]+)\]\((https?:\/\/(?:wa\.me|api\.whatsapp\.com)[^)]+)\)/gi, '$1')
        .replace(/https?:\/\/(?:wa\.me|api\.whatsapp\.com)\S*/gi, '')
        .trim();
}

function buildHandoffRepairPrompt(originalText: string): string {
    return [
        'A resposta anterior tentou encerrar o atendimento com CTA textual/manual, o que é inválido.',
        'Reavalie apenas o histórico e a resposta anterior.',
        'Se já houver dados suficientes, use SOMENTE a ferramenta generate_budget_link.',
        'Se faltar dado obrigatório, responda com uma única pergunta curta, sem links, sem markdown e sem CTA externo.',
        '',
        'Resposta inválida anterior:',
        originalText,
    ].join('\n');
}

function getRepairClientOptions(options: BuildGenerateSuccessOptions): GeminiClientOptions {
    if (!options.clientOptions) {
        throw new Error('Gemini client options are required to repair textual handoff');
    }

    return options.clientOptions;
}

function extractModelOutput(
    response: ModelResponseShape,
): { responseText?: string; responseFunctionCall?: ResponseFunctionCall } {
    const candidate = response.candidates?.[0];
    const parts = candidate?.content?.parts;

    // Gemini can return a non-array `parts` on certain safety stops or malformed upstream responses
    const textPart = Array.isArray(parts) ? collectTextParts(parts) : undefined;
    const functionCallPart = Array.isArray(parts) ? parts.find((part) => part.functionCall) : undefined;

    let responseText = response.text?.trim() || textPart;
    let responseFunctionCall = functionCallPart?.functionCall;

    if (!responseFunctionCall && responseText) {
        const fallbackToolCall = extractBudgetToolCallFromText(responseText);
        if (fallbackToolCall) {
            responseFunctionCall = fallbackToolCall;
            responseText = stripToolCallJsonBlock(responseText)
                || 'Prontinho! ✨ Preparei seu link direto para falar com nossos especialistas. É só clicar abaixo 👇';
        }
    }

    return { responseText, responseFunctionCall };
}

function logEmptyModelResponse(response: ModelResponseShape): void {
    const candidate = response.candidates?.[0];
    const promptBlockReason = response.promptFeedback?.blockReason;

    if (promptBlockReason) {
        logger.warn('SERVER: Gemini blocked prompt', {
            blockReason: promptBlockReason,
            responseId: response.responseId,
            modelVersion: response.modelVersion,
        });
        return;
    }

    logger.warn('SERVER: Gemini returned empty payload', {
        finishReason: candidate?.finishReason,
        responseId: response.responseId,
        modelVersion: response.modelVersion,
    });
}

function ensureResponseText(
    response: ModelResponseShape,
    output: { responseText?: string; responseFunctionCall?: ResponseFunctionCall },
): { responseText: string; responseFunctionCall?: ResponseFunctionCall } {
    if (output.responseText || output.responseFunctionCall) {
        return {
            responseText: output.responseText || '',
            responseFunctionCall: output.responseFunctionCall,
        };
    }

    logEmptyModelResponse(response);
    return {
        responseText: buildEmptyModelResponseMessage(),
        responseFunctionCall: output.responseFunctionCall,
    };
}

function normalizeBudgetToolResponse(
    output: { responseText: string; responseFunctionCall?: ResponseFunctionCall },
): { responseText: string; responseFunctionCall?: ResponseFunctionCall } {
    if (output.responseFunctionCall?.name !== 'generate_budget_link') {
        return output;
    }

    const validation = validateBudgetToolArgs(output.responseFunctionCall.args);
    if (validation.safetyBlock) {
        return {
            responseText: buildSafetyMessage(validation.safetyBlock),
        };
    }

    if (!validation.valid || !validation.normalizedArgs) {
        return {
            responseText: buildRefinementMessage(validation.missing),
        };
    }

    return {
        responseText: output.responseText,
        responseFunctionCall: {
            name: 'generate_budget_link',
            args: { ...validation.normalizedArgs },
        },
    };
}

function buildStructuredHandoff(
    responseFunctionCall: ResponseFunctionCall | undefined,
    source: GenerateHandoff['source'],
): GenerateHandoff | undefined {
    if (responseFunctionCall?.name !== 'generate_budget_link') {
        return undefined;
    }

    const args = responseFunctionCall.args;
    if (!args || typeof args !== 'object') {
        return undefined;
    }

    return buildGenerateHandoff(args as BudgetToolArgs, source);
}

async function repairTextualHandoff(
    response: ModelResponseShape,
    responseText: string,
    options: BuildGenerateSuccessOptions,
): Promise<GenerateSuccessBody | null> {
    logger.warn('SERVER: invalid textual handoff detected', {
        responseId: response.responseId,
        modelVersion: response.modelVersion,
        preview: responseText.slice(0, 160),
    });

    const repairContents = [
        ...options.contents,
        { role: 'model', parts: [{ text: responseText }] },
        { role: 'user', parts: [{ text: buildHandoffRepairPrompt(responseText) }] },
    ];

    const repairResponse = options.repairModelResponse
        ? await options.repairModelResponse(repairContents)
        : await requestModelResponse(getRepairClientOptions(options), options.modelName, repairContents, {
            systemInstruction: HANDOFF_REPAIR_SYSTEM_INSTRUCTION,
            temperature: HANDOFF_REPAIR_TEMPERATURE,
        });

    const repairRawOutput = extractModelOutput(repairResponse);
    const repairValidation = repairRawOutput.responseFunctionCall?.name === 'generate_budget_link'
        ? validateBudgetToolArgs(repairRawOutput.responseFunctionCall.args)
        : undefined;
    const repairNormalizedOutput = normalizeBudgetToolResponse(ensureResponseText(repairResponse, repairRawOutput));
    const repairedHandoff = buildStructuredHandoff(repairNormalizedOutput.responseFunctionCall, 'repair');

    if (repairedHandoff) {
        logger.info('SERVER: handoff repaired', {
            responseId: response.responseId,
            repairResponseId: repairResponse.responseId,
            source: repairedHandoff.source,
        });

        return {
            text: HANDOFF_READY_MESSAGE,
            functionCall: repairNormalizedOutput.responseFunctionCall,
            handoff: repairedHandoff,
        };
    }

    logger.warn('SERVER: handoff repair failed', {
        responseId: response.responseId,
        repairResponseId: repairResponse.responseId,
        missing: repairValidation?.missing || [],
    });

    const { text, chips } = extractChipsFromText(stripUnsafeWhatsAppLinks(repairNormalizedOutput.responseText));

    return {
        text,
        chips,
    };
}

export async function buildGenerateSuccessBody(
    response: ModelResponseShape,
    options: BuildGenerateSuccessOptions,
): Promise<GenerateSuccessBody> {
    const rawOutput = extractModelOutput(response);
    const normalizedOutput = normalizeBudgetToolResponse(ensureResponseText(response, rawOutput));
    const handoff = buildStructuredHandoff(normalizedOutput.responseFunctionCall, 'tool');

    if (!handoff && containsInvalidTextualHandoff(normalizedOutput.responseText)) {
        const repaired = await repairTextualHandoff(response, normalizedOutput.responseText, options);
        if (repaired) {
            return repaired;
        }
    }

    const sanitizedText = stripUnsafeWhatsAppLinks(normalizedOutput.responseText);
    const { text, chips } = extractChipsFromText(sanitizedText);

    return {
        text,
        chips,
        functionCall: normalizedOutput.responseFunctionCall,
        handoff,
    };
}

export function buildGeminiErrorResponse(error: unknown, corsHeaders: Record<string, string>): Response {
    const normalized = normalizeError(error);
    logger.error('SERVER: Error proxying to Gemini', normalized);

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

export default async function handler(request: Request) {
    const corsHeaders = buildCorsHeaders();

    if (request.method === 'OPTIONS') {
        return new Response(null, { status: 204, headers: corsHeaders });
    }

    if (request.method !== 'POST') {
        return buildMethodNotAllowedResponse(corsHeaders);
    }

    try {
        const rateLimitState = await getRateLimitState(request, corsHeaders);
        if (rateLimitState instanceof Response) return rateLimitState;

        const providerConfig = resolveGeminiProviderConfig();
        if (providerConfig.ok === false) {
            return buildConfigErrorResponse(providerConfig, corsHeaders);
        }

        logProviderStatus(providerConfig);

        const contents = await parseGenerateContents(request, corsHeaders);
        if (contents instanceof Response) return contents;

        const clientOptions = buildGeminiClientOptions(providerConfig);
        const response = await requestModelResponse(clientOptions, providerConfig.modelName, contents);
        const successBody = await buildGenerateSuccessBody(response, {
            apiKey: providerConfig.apiKey,
            modelName: providerConfig.modelName,
            contents,
            clientOptions,
        });

        return buildJsonResponse(
            successBody,
            200,
            {
                ...buildRateLimitHeaders(rateLimitState.rateLimit),
                ...corsHeaders,
            },
        );
    } catch (error: unknown) {
        return buildGeminiErrorResponse(error, corsHeaders);
    }
}

// Diagnostic: lazy-load all dependencies to surface the exact failing module
let _deps: Awaited<ReturnType<typeof loadDeps>> | null = null;

async function loadDeps() {
    const [
        genaiMod,
        rateLimitMod,
        networkMod,
        toolsMod,
        promptMod,
        constantsMod,
        utilsMod,
        validationMod
    ] = await Promise.all([
        import("@google/genai"),
        import('../lib/rate-limit'),
        import('../lib/network'),
        import('../lib/ai/tools'),
        import('../lib/ai/prompt'),
        import('../lib/ai/constants'),
        import('../lib/ai/utils'),
        import('../lib/ai/validation'),
    ]);
    return {
        GoogleGenAI: genaiMod.GoogleGenAI,
        checkRateLimitInternal: rateLimitMod.checkRateLimit,
        buildCorsHeaders: networkMod.buildCorsHeaders,
        getClientIP: networkMod.getClientIP,
        budgetTool: toolsMod.budgetTool,
        SYSTEM_INSTRUCTION: promptMod.SYSTEM_INSTRUCTION,
        DEFAULT_GEMINI_MODEL: constantsMod.DEFAULT_GEMINI_MODEL,
        resolveMaxMessageLength: utilsMod.resolveMaxMessageLength,
        hasOversizedMessage: utilsMod.hasOversizedMessage,
        extractBudgetToolCallFromText: utilsMod.extractBudgetToolCallFromText,
        stripToolCallJsonBlock: utilsMod.stripToolCallJsonBlock,
        extractChipsFromText: utilsMod.extractChipsFromText,
        validateBudgetToolArgs: validationMod.validateBudgetToolArgs,
        buildSafetyMessage: validationMod.buildSafetyMessage,
        buildRefinementMessage: validationMod.buildRefinementMessage,
    };
}

async function getDeps() {
    if (!_deps) _deps = await loadDeps();
    return _deps;
}

type Deps = Awaited<ReturnType<typeof getDeps>>;

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

interface GenerateRequestBody {
    contents?: unknown[];
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

interface ModelResponseShape {
    candidates?: ResponseCandidateShape[];
    promptFeedback?: {
        blockReason?: string | null;
    };
    responseId?: string;
    modelVersion?: string;
    text?: string | null;
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

function buildModuleLoadErrorResponse(loadError: unknown): Response {
    const msg = loadError instanceof Error ? loadError.message : String(loadError);
    const stack = loadError instanceof Error ? loadError.stack : undefined;
    console.error('FATAL: Failed to load dependencies:', msg, stack);

    return new Response(JSON.stringify({
        code: 'MODULE_LOAD_ERROR',
        error: 'Erro ao carregar dependências do servidor',
    }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
    });
}

async function loadRuntimeDeps(): Promise<Deps | Response> {
    try {
        return await getDeps();
    } catch (loadError: unknown) {
        return buildModuleLoadErrorResponse(loadError);
    }
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
    deps: Pick<Deps, 'checkRateLimitInternal' | 'getClientIP'>,
    corsHeaders: Record<string, string>,
): Promise<Response | { rateLimit: Awaited<ReturnType<Deps['checkRateLimitInternal']>> }> {
    const clientIP = deps.getClientIP(request);
    const rateLimit = await deps.checkRateLimitInternal(clientIP, {
        limit: RATE_LIMIT_MAX_REQUESTS,
        windowMs: RATE_LIMIT_WINDOW_MS,
        prefix: 'ratelimit:generate',
    });

    if (rateLimit.allowed) {
        return { rateLimit };
    }

    console.warn(`RATE_LIMIT: IP ${clientIP} exceeded limit. Reset in ${Math.ceil(rateLimit.resetIn / 1000)}s`);
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

function logEnvironmentStatus(apiKey: string | undefined): void {
    console.log('[Edge Function] Environment check:');
    console.log('- GEMINI_API_KEY present:', !!apiKey);
    console.log('- GEMINI_MODEL:', process.env.GEMINI_MODEL || 'gemini-2.5-flash-lite (default)');
    console.log('- ALLOWED_ORIGIN:', process.env.ALLOWED_ORIGIN || '*');
}

function getConfiguredApiKey(corsHeaders: Record<string, string>): string | Response {
    const apiKey = process.env.GEMINI_API_KEY;
    logEnvironmentStatus(apiKey);

    if (apiKey) {
        console.log('SERVER: GEMINI_API_KEY is configured');
        return apiKey;
    }

    console.error('SERVER: GEMINI_API_KEY not found in environment variables');
    console.error('SERVER: Available GEMINI_* keys:', Object.keys(process.env).filter(k => k.includes('GEMINI')));
    return buildJsonResponse({
        code: 'SERVER_CONFIG_ERROR',
        error: 'Erro interno de configuração'
    }, 500, corsHeaders);
}

async function parseGenerateContents(
    request: Request,
    deps: Pick<Deps, 'resolveMaxMessageLength' | 'hasOversizedMessage'>,
    corsHeaders: Record<string, string>,
): Promise<unknown[] | Response> {
    const { contents } = await request.json() as GenerateRequestBody;

    if (!contents || !Array.isArray(contents) || contents.length === 0) {
        return buildJsonResponse({ error: 'Contents must be a non-empty array' }, 400, corsHeaders);
    }

    if (contents.length > 50) {
        return buildJsonResponse({ error: 'Too many messages in history' }, 400, corsHeaders);
    }

    const maxMessageLength = deps.resolveMaxMessageLength(process.env.MAX_MESSAGE_LENGTH);
    if (deps.hasOversizedMessage(contents, maxMessageLength)) {
        return buildJsonResponse({ error: 'Message too long' }, 400, corsHeaders);
    }

    return contents;
}

async function requestModelResponse(
    apiKey: string,
    modelName: string,
    contents: unknown[],
    deps: Pick<Deps, 'GoogleGenAI' | 'budgetTool' | 'SYSTEM_INSTRUCTION'>,
): Promise<ModelResponseShape> {
    const ai = new deps.GoogleGenAI({ apiKey });

    return await ai.models.generateContent({
        model: modelName,
        contents,
        config: {
            tools: [{ functionDeclarations: [deps.budgetTool] }],
            systemInstruction: deps.SYSTEM_INSTRUCTION,
            temperature: resolveTemperature(modelName),
        }
    }) as ModelResponseShape;
}

function extractModelOutput(
    response: ModelResponseShape,
    deps: Pick<Deps, 'extractBudgetToolCallFromText' | 'stripToolCallJsonBlock'>,
): { responseText?: string; responseFunctionCall?: ResponseFunctionCall } {
    const candidate = response.candidates?.[0];
    const textPart = collectTextParts(candidate?.content?.parts);
    const functionCallPart = candidate?.content?.parts?.find((part) => part.functionCall);

    let responseText = response.text?.trim() || textPart;
    let responseFunctionCall = functionCallPart?.functionCall;

    if (!responseFunctionCall && responseText) {
        const fallbackToolCall = deps.extractBudgetToolCallFromText(responseText);
        if (fallbackToolCall) {
            responseFunctionCall = fallbackToolCall;
            responseText = deps.stripToolCallJsonBlock(responseText)
                || 'Prontinho! ✨ Preparei seu link direto para falar com nossos especialistas. É só clicar abaixo 👇';
        }
    }

    return { responseText, responseFunctionCall };
}

function logEmptyModelResponse(response: ModelResponseShape): void {
    const candidate = response.candidates?.[0];
    const promptBlockReason = response.promptFeedback?.blockReason;

    if (promptBlockReason) {
        console.warn('SERVER: Gemini blocked prompt', {
            blockReason: promptBlockReason,
            responseId: response.responseId,
            modelVersion: response.modelVersion,
        });
        return;
    }

    console.warn('SERVER: Gemini returned empty payload', {
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
    deps: Pick<Deps, 'validateBudgetToolArgs' | 'buildSafetyMessage' | 'buildRefinementMessage'>,
): { responseText: string; responseFunctionCall?: ResponseFunctionCall } {
    if (output.responseFunctionCall?.name !== 'generate_budget_link') {
        return output;
    }

    const validation = deps.validateBudgetToolArgs(output.responseFunctionCall.args);
    if (validation.safetyBlock) {
        return {
            responseText: deps.buildSafetyMessage(validation.safetyBlock),
        };
    }

    if (!validation.valid || !validation.normalizedArgs) {
        return {
            responseText: deps.buildRefinementMessage(validation.missing),
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

function buildGenerateSuccessBody(
    response: ModelResponseShape,
    deps: Pick<
        Deps,
        'extractBudgetToolCallFromText'
        | 'stripToolCallJsonBlock'
        | 'validateBudgetToolArgs'
        | 'buildSafetyMessage'
        | 'buildRefinementMessage'
        | 'extractChipsFromText'
    >,
): Record<string, unknown> {
    const rawOutput = extractModelOutput(response, deps);
    const normalizedOutput = normalizeBudgetToolResponse(ensureResponseText(response, rawOutput), deps);
    const { text, chips } = deps.extractChipsFromText(normalizedOutput.responseText);

    return {
        text,
        chips,
        functionCall: normalizedOutput.responseFunctionCall
    };
}

function buildGeminiErrorResponse(error: unknown, corsHeaders: Record<string, string>): Response {
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

export default async function handler(request: Request) {
    const deps = await loadRuntimeDeps();
    if (deps instanceof Response) return deps;

    const {
        GoogleGenAI, checkRateLimitInternal, buildCorsHeaders, getClientIP,
        budgetTool, SYSTEM_INSTRUCTION, DEFAULT_GEMINI_MODEL,
        resolveMaxMessageLength, hasOversizedMessage, extractBudgetToolCallFromText,
        stripToolCallJsonBlock, extractChipsFromText,
        validateBudgetToolArgs, buildSafetyMessage, buildRefinementMessage,
    } = deps;

    const corsHeaders = buildCorsHeaders();
    if (request.method === 'OPTIONS') {
        return new Response(null, { status: 204, headers: corsHeaders });
    }

    if (request.method !== 'POST') {
        return buildMethodNotAllowedResponse(corsHeaders);
    }

    const rateLimitState = await getRateLimitState(request, { checkRateLimitInternal, getClientIP }, corsHeaders);
    if (rateLimitState instanceof Response) return rateLimitState;

    try {
        const apiKey = getConfiguredApiKey(corsHeaders);
        if (apiKey instanceof Response) return apiKey;

        const contents = await parseGenerateContents(request, { resolveMaxMessageLength, hasOversizedMessage }, corsHeaders);
        if (contents instanceof Response) return contents;

        const modelName = process.env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL;
        const response = await requestModelResponse(apiKey, modelName, contents, {
            GoogleGenAI,
            budgetTool,
            SYSTEM_INSTRUCTION,
        });

        return buildJsonResponse(
            buildGenerateSuccessBody(response, {
                extractBudgetToolCallFromText,
                stripToolCallJsonBlock,
                validateBudgetToolArgs,
                buildSafetyMessage,
                buildRefinementMessage,
                extractChipsFromText,
            }),
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

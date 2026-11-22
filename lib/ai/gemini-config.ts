import type { GoogleGenAIOptions } from '@google/genai';

import { DEFAULT_GEMINI_MODEL } from './constants';

const DEFAULT_AI_GATEWAY_ID = 'default';
const AI_GATEWAY_PROVIDER_PATH = 'google-ai-studio';
const DEPRECATED_GEMINI_3_1_FLASH_LITE_PREVIEW_PREFIX = 'gemini-3.1-flash-lite-preview';
// Sem cf-aig-byok-alias o AI Gateway usa a chave guardada no alias "default".
const DEFAULT_BYOK_ALIAS = 'default';
// O SDK @google/genai exige um apiKey não vazio; no modo gateway o valor nunca chega ao
// provedor porque o header x-goog-api-key é esvaziado em buildGeminiClientOptions.
const BYOK_PLACEHOLDER_API_KEY = 'managed-by-ai-gateway-byok';

type EnvSource = Record<string, string | undefined>;

interface GeminiProviderConfigBase {
    ok: true;
    apiKey: string;
    modelName: string;
}

interface DirectGeminiProviderConfig extends GeminiProviderConfigBase {
    useGateway: false;
}

interface AiGatewayGeminiProviderConfig extends GeminiProviderConfigBase {
    useGateway: true;
    gatewayBaseUrl: string;
    gatewayId: string;
    gatewayToken: string;
    byokAlias: string;
    // Nomes (nunca valores) de variáveis presentes no ambiente mas ignoradas no modo gateway.
    ignoredEnv: string[];
    metadata: Record<string, string>;
}

export interface GeminiProviderConfigError {
    ok: false;
    code: 'SERVER_CONFIG_ERROR';
    missing: string[];
}

export type GeminiProviderConfig =
    | DirectGeminiProviderConfig
    | AiGatewayGeminiProviderConfig
    | GeminiProviderConfigError;

function readEnv(env: EnvSource, key: string): string | undefined {
    const value = env[key]?.trim();
    return value || undefined;
}

function isAiGatewayEnabled(value: string | undefined): boolean {
    return value?.trim().toLowerCase() === 'true';
}

function buildGatewayBaseUrl(accountId: string, gatewayId: string): string {
    return [
        'https://gateway.ai.cloudflare.com/v1',
        encodeURIComponent(accountId),
        encodeURIComponent(gatewayId),
        AI_GATEWAY_PROVIDER_PATH,
    ].join('/');
}

function resolveRuntimeEnvironment(env: EnvSource): string {
    return readEnv(env, 'VERCEL_ENV') || readEnv(env, 'NODE_ENV') || 'unknown';
}

function buildAiGatewayMetadata(env: EnvSource, modelName: string): Record<string, string> {
    return {
        endpoint: 'api-generate',
        feature: 'travel-chat',
        model: modelName,
        environment: resolveRuntimeEnvironment(env),
        requestType: 'chat',
    };
}

function resolveGeminiModelName(env: EnvSource): string {
    const configuredModelName = readEnv(env, 'GEMINI_MODEL') || DEFAULT_GEMINI_MODEL;
    const lowerModelName = configuredModelName.toLowerCase();

    if (lowerModelName.startsWith(DEPRECATED_GEMINI_3_1_FLASH_LITE_PREVIEW_PREFIX)) {
        return DEFAULT_GEMINI_MODEL;
    }

    return lowerModelName;
}

export function resolveGeminiProviderConfig(env: EnvSource = process.env): GeminiProviderConfig {
    const apiKey = readEnv(env, 'GEMINI_API_KEY');
    const modelName = resolveGeminiModelName(env);
    const useGateway = isAiGatewayEnabled(readEnv(env, 'AI_GATEWAY_ENABLED'));

    if (!useGateway) {
        if (!apiKey) {
            return { ok: false, code: 'SERVER_CONFIG_ERROR', missing: ['GEMINI_API_KEY'] };
        }

        return {
            ok: true,
            apiKey,
            modelName,
            useGateway: false,
        };
    }

    // Modo gateway: a chave do Gemini vive no AI Gateway (BYOK) e GEMINI_API_KEY nunca é
    // exigida nem enviada. O gateway só usa a chave guardada quando o header de autorização
    // do provedor está ausente; qualquer valor presente seria repassado ao Google.
    const accountId = readEnv(env, 'CLOUDFLARE_ACCOUNT_ID');
    const gatewayId = readEnv(env, 'CLOUDFLARE_AI_GATEWAY_ID') || DEFAULT_AI_GATEWAY_ID;
    const gatewayToken = readEnv(env, 'CLOUDFLARE_AI_GATEWAY_TOKEN');
    const byokAlias = readEnv(env, 'AI_GATEWAY_BYOK_ALIAS') || DEFAULT_BYOK_ALIAS;
    const missing: string[] = [];

    if (!accountId) {
        missing.push('CLOUDFLARE_ACCOUNT_ID');
    }

    if (!gatewayToken) {
        missing.push('CLOUDFLARE_AI_GATEWAY_TOKEN');
    }

    if (missing.length > 0) {
        return { ok: false, code: 'SERVER_CONFIG_ERROR', missing };
    }

    return {
        ok: true,
        apiKey: BYOK_PLACEHOLDER_API_KEY,
        modelName,
        useGateway: true,
        gatewayId,
        gatewayBaseUrl: buildGatewayBaseUrl(accountId!, gatewayId),
        gatewayToken: gatewayToken!,
        byokAlias,
        ignoredEnv: apiKey ? ['GEMINI_API_KEY'] : [],
        metadata: buildAiGatewayMetadata(env, modelName),
    };
}

export function buildGeminiClientOptions(config: Exclude<GeminiProviderConfig, GeminiProviderConfigError>): GoogleGenAIOptions {
    if (!config.useGateway) {
        return { apiKey: config.apiKey };
    }

    const headers: Record<string, string> = {
        'cf-aig-authorization': `Bearer ${config.gatewayToken}`,
        'cf-aig-byok-alias': config.byokAlias,
        'cf-aig-collect-log-payload': 'false',
        'cf-aig-metadata': JSON.stringify(config.metadata),
        'cf-aig-skip-cache': 'true',
        // Header vazio sobrescreve o x-goog-api-key que o SDK monta a partir do apiKey;
        // o AI Gateway trata como ausente e injeta a credencial BYOK do alias indicado.
        'x-goog-api-key': '',
    };

    return {
        apiKey: config.apiKey,
        httpOptions: {
            baseUrl: config.gatewayBaseUrl,
            headers,
        },
    };
}

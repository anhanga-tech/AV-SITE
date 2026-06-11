import type { GoogleGenAIOptions } from '@google/genai';

import { DEFAULT_GEMINI_MODEL } from './constants';

const DEFAULT_AI_GATEWAY_ID = 'default';
const AI_GATEWAY_PROVIDER_PATH = 'google-ai-studio';
const DEPRECATED_GEMINI_3_1_FLASH_LITE_PREVIEW_PREFIX = 'gemini-3.1-flash-lite-preview';
// O SDK @google/genai exige um apiKey não vazio; em modo BYOK o valor nunca chega ao
// provedor porque o header x-goog-api-key é esvaziado em buildGeminiClientOptions.
const BYOK_PLACEHOLDER_API_KEY = 'managed-by-ai-gateway-byok';

type EnvSource = Record<string, string | undefined>;

interface GeminiProviderConfigBase {
    ok: true;
    apiKey: string;
    modelName: string;
}

export interface DirectGeminiProviderConfig extends GeminiProviderConfigBase {
    useGateway: false;
}

export interface AiGatewayGeminiProviderConfig extends GeminiProviderConfigBase {
    useGateway: true;
    gatewayBaseUrl: string;
    gatewayId: string;
    gatewayToken: string;
    byokAlias?: string;
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
    // BYOK só vale com o gateway ativo: no caminho direto a chave continua obrigatória.
    const byokAlias = useGateway ? readEnv(env, 'AI_GATEWAY_BYOK_ALIAS') : undefined;
    const missing: string[] = [];

    if (!apiKey && !byokAlias) {
        missing.push('GEMINI_API_KEY');
    }

    if (!useGateway) {
        if (missing.length > 0) {
            return { ok: false, code: 'SERVER_CONFIG_ERROR', missing };
        }

        return {
            ok: true,
            apiKey: apiKey!,
            modelName,
            useGateway: false,
        };
    }

    const accountId = readEnv(env, 'CLOUDFLARE_ACCOUNT_ID');
    const gatewayId = readEnv(env, 'CLOUDFLARE_AI_GATEWAY_ID') || DEFAULT_AI_GATEWAY_ID;
    const gatewayToken = readEnv(env, 'CLOUDFLARE_AI_GATEWAY_TOKEN');

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
        apiKey: byokAlias ? BYOK_PLACEHOLDER_API_KEY : apiKey!,
        modelName,
        useGateway: true,
        gatewayId,
        gatewayBaseUrl: buildGatewayBaseUrl(accountId!, gatewayId),
        gatewayToken: gatewayToken!,
        byokAlias,
        metadata: buildAiGatewayMetadata(env, modelName),
    };
}

export function buildGeminiClientOptions(config: Exclude<GeminiProviderConfig, GeminiProviderConfigError>): GoogleGenAIOptions {
    if (!config.useGateway) {
        return { apiKey: config.apiKey };
    }

    const headers: Record<string, string> = {
        'cf-aig-authorization': `Bearer ${config.gatewayToken}`,
        'cf-aig-collect-log-payload': 'false',
        'cf-aig-metadata': JSON.stringify(config.metadata),
        'cf-aig-skip-cache': 'true',
    };

    if (config.byokAlias) {
        // Header vazio sobrescreve o x-goog-api-key que o SDK monta a partir do apiKey;
        // o AI Gateway trata como ausente e injeta a credencial BYOK do alias indicado.
        headers['x-goog-api-key'] = '';
        headers['cf-aig-byok-alias'] = config.byokAlias;
    }

    return {
        apiKey: config.apiKey,
        httpOptions: {
            baseUrl: config.gatewayBaseUrl,
            headers,
        },
    };
}

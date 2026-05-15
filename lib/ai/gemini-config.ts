import type { GoogleGenAIOptions } from '@google/genai';

import { DEFAULT_GEMINI_MODEL } from './constants';

const DEFAULT_AI_GATEWAY_ID = 'default';
const AI_GATEWAY_PROVIDER_PATH = 'google-ai-studio';
const DEPRECATED_GEMINI_3_1_FLASH_LITE_PREVIEW_PREFIX = 'gemini-3.1-flash-lite-preview';

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

    if (configuredModelName.toLowerCase().startsWith(DEPRECATED_GEMINI_3_1_FLASH_LITE_PREVIEW_PREFIX)) {
        return DEFAULT_GEMINI_MODEL;
    }

    return configuredModelName;
}

export function resolveGeminiProviderConfig(env: EnvSource = process.env): GeminiProviderConfig {
    const apiKey = readEnv(env, 'GEMINI_API_KEY');
    const modelName = resolveGeminiModelName(env);
    const useGateway = isAiGatewayEnabled(readEnv(env, 'AI_GATEWAY_ENABLED'));
    const missing: string[] = [];

    if (!apiKey) {
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
        apiKey: apiKey!,
        modelName,
        useGateway: true,
        gatewayId,
        gatewayBaseUrl: buildGatewayBaseUrl(accountId!, gatewayId),
        gatewayToken: gatewayToken!,
        metadata: buildAiGatewayMetadata(env, modelName),
    };
}

export function buildGeminiClientOptions(config: Exclude<GeminiProviderConfig, GeminiProviderConfigError>): GoogleGenAIOptions {
    if (!config.useGateway) {
        return { apiKey: config.apiKey };
    }

    return {
        apiKey: config.apiKey,
        httpOptions: {
            baseUrl: config.gatewayBaseUrl,
            headers: {
                'cf-aig-authorization': `Bearer ${config.gatewayToken}`,
                'cf-aig-metadata': JSON.stringify(config.metadata),
            },
        },
    };
}

import type { AIProviderMode, AITextProviderId } from "@/types/ai";

const DEFAULT_DASHSCOPE_BASE_URL = "https://dashscope.aliyuncs.com/compatible-mode/v1";
const DEFAULT_DASHSCOPE_TEXT_MODEL = "qwen-plus";

function normalizeMode(value?: string | null): AIProviderMode {
  return value === "real" ? "real" : "mock";
}

function normalizeProviderId(value?: string | null, mode: AIProviderMode = "mock"): AITextProviderId {
  if (value === "dashscope") {
    return "dashscope";
  }

  return mode === "real" ? "dashscope" : "mock";
}

function normalizeBoolean(value?: string | null, fallback = true) {
  if (value == null) {
    return fallback;
  }

  return value !== "false";
}

export interface ClientAIConfig {
  mode: AIProviderMode;
  providerId: AITextProviderId;
  routePath: string;
}

export interface ServerAIConfig {
  mode: AIProviderMode;
  providerId: AITextProviderId;
  allowMockFallback: boolean;
  dashscope: {
    apiKey: string | null;
    baseUrl: string;
    model: string;
  };
}

export function getClientAIConfig(): ClientAIConfig {
  const mode = normalizeMode(process.env.NEXT_PUBLIC_AI_PROVIDER_MODE);
  const providerId = normalizeProviderId(process.env.NEXT_PUBLIC_AI_TEXT_PROVIDER, mode);

  return {
    mode,
    providerId,
    routePath: "/api/ai"
  };
}

export function getServerAIConfig(): ServerAIConfig {
  const mode = normalizeMode(process.env.AI_PROVIDER_MODE ?? process.env.NEXT_PUBLIC_AI_PROVIDER_MODE);
  const providerId = normalizeProviderId(
    process.env.AI_TEXT_PROVIDER ?? process.env.NEXT_PUBLIC_AI_TEXT_PROVIDER,
    mode
  );

  return {
    mode,
    providerId,
    allowMockFallback: normalizeBoolean(process.env.AI_ALLOW_MOCK_FALLBACK, true),
    dashscope: {
      apiKey: process.env.DASHSCOPE_API_KEY ?? null,
      baseUrl: process.env.DASHSCOPE_BASE_URL ?? DEFAULT_DASHSCOPE_BASE_URL,
      model: process.env.DASHSCOPE_TEXT_MODEL ?? DEFAULT_DASHSCOPE_TEXT_MODEL
    }
  };
}

export function canUseDashScope(config: ServerAIConfig) {
  return Boolean(config.dashscope.apiKey);
}

import type { AIImageProviderId, AIProviderMode } from "@/types/ai";

const DEFAULT_DASHSCOPE_IMAGE_URL = "https://dashscope.aliyuncs.com/api/v1/services/aigc/image-generation/generation";
const DEFAULT_DASHSCOPE_IMAGE_MODEL = "wan2.7-image";

function normalizeMode(value?: string | null): AIProviderMode {
  return value === "real" ? "real" : "mock";
}

function normalizeProviderId(value?: string | null, mode: AIProviderMode = "mock"): AIImageProviderId {
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

function normalizeNumber(value?: string | null, fallback = 0) {
  if (value == null || value.trim().length === 0) {
    return fallback;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export interface ClientImageConfig {
  mode: AIProviderMode;
  providerId: AIImageProviderId;
  routePath: string;
}

export interface ServerImageConfig {
  mode: AIProviderMode;
  providerId: AIImageProviderId;
  allowMockFallback: boolean;
  polling: {
    maxAttempts: number;
    initialDelayMs: number;
    intervalMs: number;
  };
  dashscope: {
    apiKey: string | null;
    generationUrl: string;
    model: string;
  };
}

export function getClientImageConfig(): ClientImageConfig {
  const mode = normalizeMode(process.env.NEXT_PUBLIC_AI_PROVIDER_MODE);
  const providerId = normalizeProviderId(process.env.NEXT_PUBLIC_AI_IMAGE_PROVIDER, mode);

  return {
    mode,
    providerId,
    routePath: "/api/ai-image"
  };
}

export function getServerImageConfig(): ServerImageConfig {
  const mode = normalizeMode(process.env.AI_PROVIDER_MODE ?? process.env.NEXT_PUBLIC_AI_PROVIDER_MODE);
  const providerId = normalizeProviderId(
    process.env.AI_IMAGE_PROVIDER ?? process.env.NEXT_PUBLIC_AI_IMAGE_PROVIDER,
    mode
  );

  return {
    mode,
    providerId,
    allowMockFallback: normalizeBoolean(process.env.AI_ALLOW_MOCK_FALLBACK, true),
    polling: {
      maxAttempts: normalizeNumber(process.env.DASHSCOPE_IMAGE_POLL_MAX_ATTEMPTS, 24),
      initialDelayMs: normalizeNumber(process.env.DASHSCOPE_IMAGE_POLL_INITIAL_DELAY_MS, 1800),
      intervalMs: normalizeNumber(process.env.DASHSCOPE_IMAGE_POLL_INTERVAL_MS, 2200)
    },
    dashscope: {
      apiKey: process.env.DASHSCOPE_API_KEY ?? null,
      generationUrl: process.env.DASHSCOPE_IMAGE_GENERATION_URL ?? DEFAULT_DASHSCOPE_IMAGE_URL,
      model: process.env.DASHSCOPE_IMAGE_MODEL ?? DEFAULT_DASHSCOPE_IMAGE_MODEL
    }
  };
}

export function canUseDashScopeImage(config: ServerImageConfig) {
  return Boolean(config.dashscope.apiKey);
}

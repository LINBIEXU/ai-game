import type { GenerationProvider } from "@/types/ai";
import { canUseDashScope, getServerAIConfig } from "@/lib/ai/config";
import { dashscopeTextProvider } from "@/lib/ai/dashscope-provider";
import { mockGenerationProvider } from "@/lib/ai/mock-provider";

export function getServerGenerationProvider(): GenerationProvider {
  const config = getServerAIConfig();

  if (config.mode === "real" && config.providerId === "dashscope") {
    if (canUseDashScope(config)) {
      return dashscopeTextProvider;
    }

    if (!config.allowMockFallback) {
      throw new Error("阿里百炼文本 provider 未配置 DASHSCOPE_API_KEY。");
    }
  }

  return mockGenerationProvider;
}

import type { ImageGenerationProvider } from "@/types/ai";
import { canUseDashScopeImage, getServerImageConfig } from "@/lib/ai-image/config";
import { dashscopeCrewImageProvider } from "@/lib/ai-image/dashscope-provider";
import { mockCrewImageProvider } from "@/lib/ai-image/mock-provider";

export function getServerCrewImageProvider(): ImageGenerationProvider {
  const config = getServerImageConfig();

  if (config.mode === "real" && config.providerId === "dashscope") {
    if (canUseDashScopeImage(config)) {
      return dashscopeCrewImageProvider;
    }

    if (!config.allowMockFallback) {
      throw new Error("阿里百炼图像 provider 未配置 DASHSCOPE_API_KEY。");
    }
  }

  return mockCrewImageProvider;
}

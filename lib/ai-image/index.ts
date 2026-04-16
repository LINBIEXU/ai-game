import type { AIProviderMode, ImageGenerationProvider } from "@/types/ai";
import { mockCrewImageProvider } from "@/lib/ai-image/mock-provider";
import { remoteCrewImageProvider } from "@/lib/ai-image/remote-provider";

const providers: Record<AIProviderMode, ImageGenerationProvider> = {
  mock: mockCrewImageProvider,
  real: remoteCrewImageProvider
};

export function getCrewImageProvider(mode: AIProviderMode = "mock") {
  return providers[mode];
}

import type { AIProviderMode, GenerationProvider } from "@/types/ai";
import { mockGenerationProvider } from "@/lib/ai/mock-provider";
import { remoteGenerationProvider } from "@/lib/ai/remote-provider";

const providers: Record<AIProviderMode, GenerationProvider> = {
  mock: mockGenerationProvider,
  real: remoteGenerationProvider
};

export function getGenerationProvider(mode: AIProviderMode = "mock") {
  return providers[mode];
}

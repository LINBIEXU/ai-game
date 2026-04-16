import type {
  CrewImageGenerationRequest,
  CrewImageGenerationResult,
  ImageGenerationProvider
} from "@/types/ai";
import { getClientImageConfig } from "@/lib/ai-image/config";
import { providerPromptBindings } from "@/lib/prompts/provider-bindings";

async function callImageService(payload: CrewImageGenerationRequest): Promise<CrewImageGenerationResult> {
  const config = getClientImageConfig();
  const response = await fetch(config.routePath, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    cache: "no-store",
    body: JSON.stringify(payload)
  });

  const data = (await response.json().catch(() => null)) as
    | { ok: true; data: CrewImageGenerationResult }
    | { ok: false; error: string }
    | null;

  if (!response.ok || !data?.ok) {
    throw new Error(data && "error" in data ? data.error : "船员形象回路暂时没有回应。");
  }

  return data.data;
}

export const remoteCrewImageProvider: ImageGenerationProvider = {
  mode: "real",
  providerId: "dashscope",
  prompts: {
    worldRules: providerPromptBindings.worldRules,
    generateCrewImage: providerPromptBindings.generateCrewImage
  },
  generateCrewImage(request) {
    return callImageService(request);
  }
};

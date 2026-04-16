import type {
  AIServiceError,
  AIServiceOperation,
  AIServiceRequest,
  AIServiceResultMap,
  GenerationProvider
} from "@/types/ai";
import { getClientAIConfig } from "@/lib/ai/config";
import { providerPromptBindings } from "@/lib/prompts/provider-bindings";

async function callAIService<TOperation extends AIServiceOperation>(
  operation: TOperation,
  payload: AIServiceRequest<TOperation>["payload"]
): Promise<AIServiceResultMap[TOperation]> {
  const config = getClientAIConfig();
  const response = await fetch(config.routePath, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    cache: "no-store",
    body: JSON.stringify({
      operation,
      payload
    })
  });

  const data = (await response.json().catch(() => null)) as
    | { ok: true; data: AIServiceResultMap[TOperation] }
    | AIServiceError<TOperation>
    | null;

  if (!response.ok || !data?.ok) {
    throw new Error(data && "error" in data ? data.error : "主舰外部文本回路暂时没有回应。");
  }

  return data.data;
}

export const remoteGenerationProvider: GenerationProvider = {
  mode: "real",
  providerId: "dashscope",
  prompts: providerPromptBindings,

  analyzeCrew(request) {
    return callAIService("analyzeCrew", request);
  },

  generateCrew(request) {
    return callAIService("generateCrew", request);
  },

  chatWithCrew(request) {
    return callAIService("chatWithCrew", request);
  },

  prepareSignalSources(request) {
    return callAIService("prepareSignalSources", request);
  },

  analyzeSignal(input) {
    return callAIService("analyzeSignal", input);
  },

  repairSignal(request) {
    return callAIService("repairSignal", request);
  },

  runShipTask(request) {
    return callAIService("runShipTask", request);
  },

  generateChapterTwoEcho(input) {
    return callAIService("generateChapterTwoEcho", input);
  },

  analyzeChapterTwoResponse(request) {
    return callAIService("analyzeChapterTwoResponse", request);
  },

  analyzeChapterTwoAssignment(request) {
    return callAIService("analyzeChapterTwoAssignment", request);
  },

  analyzeChapterTwoRound(request) {
    return callAIService("analyzeChapterTwoRound", request);
  },

  runChapterTwoRoundOne(request) {
    return callAIService("runChapterTwoRoundOne", request);
  },

  runChapterTwoRoundTwo(request) {
    return callAIService("runChapterTwoRoundTwo", request);
  },

  completeChapterOne(request) {
    return callAIService("completeChapterOne", request);
  },

  completeChapterTwo(request) {
    return callAIService("completeChapterTwo", request);
  }
};

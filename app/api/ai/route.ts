import { NextResponse } from "next/server";

import type {
  AIServiceError,
  AIServiceOperation,
  AIServicePayloadMap,
  AIServiceRequest,
  AIServiceResultMap
} from "@/types/ai";
import { getServerGenerationProvider } from "@/lib/ai/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

const handlers: {
  [K in AIServiceOperation]: (provider: ReturnType<typeof getServerGenerationProvider>, payload: AIServicePayloadMap[K]) => Promise<AIServiceResultMap[K]> | AIServiceResultMap[K];
} = {
  analyzeCrew: (provider, payload) => provider.analyzeCrew(payload),
  generateCrew: (provider, payload) => provider.generateCrew(payload),
  chatWithCrew: (provider, payload) => provider.chatWithCrew(payload),
  prepareSignalSources: (provider, payload) => provider.prepareSignalSources(payload),
  analyzeSignal: (provider, payload) => provider.analyzeSignal(payload),
  repairSignal: (provider, payload) => provider.repairSignal(payload),
  runShipTask: (provider, payload) => provider.runShipTask(payload),
  generateChapterTwoEcho: (provider, payload) => provider.generateChapterTwoEcho(payload),
  analyzeChapterTwoResponse: (provider, payload) => provider.analyzeChapterTwoResponse(payload),
  analyzeChapterTwoAssignment: (provider, payload) => provider.analyzeChapterTwoAssignment(payload),
  analyzeChapterTwoRound: (provider, payload) => provider.analyzeChapterTwoRound(payload),
  runChapterTwoRoundOne: (provider, payload) => provider.runChapterTwoRoundOne(payload),
  runChapterTwoRoundTwo: (provider, payload) => provider.runChapterTwoRoundTwo(payload),
  completeChapterOne: (provider, payload) => provider.completeChapterOne(payload),
  completeChapterTwo: (provider, payload) => provider.completeChapterTwo(payload)
};

function isOperation(value: string): value is AIServiceOperation {
  return value in handlers;
}

export async function POST(request: Request) {
  let body: AIServiceRequest | null = null;

  try {
    body = (await request.json()) as AIServiceRequest;
    if (!body || typeof body.operation !== "string" || !isOperation(body.operation)) {
      return NextResponse.json(
        {
          ok: false,
          operation: (body?.operation ?? "analyzeCrew") as AIServiceOperation,
          providerMode: "mock",
          providerId: "mock",
          error: "无效的文本能力请求。"
        } satisfies AIServiceError,
        { status: 400 }
      );
    }

    const provider = getServerGenerationProvider();
    const data = await handlers[body.operation](provider, body.payload as never);

    return NextResponse.json({
      ok: true,
      operation: body.operation,
      providerMode: provider.mode,
      providerId: provider.providerId,
      data
    });
  } catch (error) {
    let providerMode: "mock" | "real" = "mock";
    let providerId: "mock" | "dashscope" = "mock";

    try {
      const provider = getServerGenerationProvider();
      providerMode = provider.mode;
      providerId = provider.providerId;
    } catch {
      providerMode = "real";
      providerId = "dashscope";
    }

    return NextResponse.json(
      {
        ok: false,
        operation: body?.operation ?? "analyzeCrew",
        providerMode,
        providerId,
        error: error instanceof Error ? error.message : "主舰文本回路暂时没有回应。"
      } satisfies AIServiceError,
      { status: 500 }
    );
  }
}

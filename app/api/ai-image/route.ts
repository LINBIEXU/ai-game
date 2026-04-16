import { NextResponse } from "next/server";

import type { CrewImageGenerationRequest } from "@/types/ai";
import { getServerCrewImageProvider } from "@/lib/ai-image/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 55;

export async function POST(request: Request) {
  let body: CrewImageGenerationRequest | null = null;

  try {
    body = (await request.json()) as CrewImageGenerationRequest;
    if (!body?.crew) {
      return NextResponse.json({ ok: false, error: "无效的船员形象请求。" }, { status: 400 });
    }

    const provider = getServerCrewImageProvider();
    const data = await provider.generateCrewImage(body);

    return NextResponse.json({
      ok: true,
      providerMode: provider.mode,
      providerId: provider.providerId,
      data
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "船员形象回路暂时没有回应。"
      },
      { status: 500 }
    );
  }
}

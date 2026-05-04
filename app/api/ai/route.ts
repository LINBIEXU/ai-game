import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  return NextResponse.json(
    {
      ok: false,
      providerMode: "classroom-local",
      providerId: "disabled",
      error: "本地主舰版已关闭实时 AI 文本调用。请先在流程中记录设定，必要时由外部工具处理后再归档。"
    },
    { status: 410 }
  );
}

import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  return NextResponse.json(
    {
      ok: false,
      providerMode: "classroom-local",
      providerId: "disabled",
      error: "课堂本地版已关闭实时 AI 文本调用。请在课堂流程中记录设定，必要时由老师外部处理后再归档。"
    },
    { status: 410 }
  );
}

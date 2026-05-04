import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  return NextResponse.json(
    {
      ok: false,
      providerMode: "classroom-local",
      providerId: "disabled",
      error: "本地主舰版已关闭实时生图调用。请由外部工具生成图片后，在角色或星球档案中导入归档。"
    },
    { status: 410 }
  );
}

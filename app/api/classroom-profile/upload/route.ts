import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { NextRequest, NextResponse } from "next/server";

import { getProfileAssetDir, sanitizeProfileName } from "@/lib/classroom-storage";

export const runtime = "nodejs";

function sanitizeFileName(name: string) {
  return name.replace(/[\\/:*?"<>|]/g, "-").replace(/\s+/g, "-").slice(-80);
}

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const name = sanitizeProfileName(String(formData.get("name") ?? ""));
  const kind = String(formData.get("kind") ?? "chapter");
  const ownerId = String(formData.get("ownerId") ?? "general");
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ ok: false, error: "缺少图片文件" }, { status: 400 });
  }

  const assetDir = getProfileAssetDir(name);
  await mkdir(assetDir, { recursive: true });

  const ext = path.extname(file.name) || ".png";
  const storedName = `${Date.now()}-${sanitizeFileName(ownerId)}-${sanitizeFileName(file.name || `asset${ext}`)}`;
  const bytes = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(assetDir, storedName), bytes);

  return NextResponse.json({
    ok: true,
    asset: {
      imageUrl: `/api/classroom-profile/assets?name=${encodeURIComponent(name)}&file=${encodeURIComponent(storedName)}`,
      fileName: storedName,
      kind,
      ownerId,
      updatedAt: Date.now()
    }
  });
}

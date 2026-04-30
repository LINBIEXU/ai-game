import { readFile } from "node:fs/promises";
import path from "node:path";

import { NextRequest, NextResponse } from "next/server";

import { getProfileAssetDir, sanitizeProfileName } from "@/lib/classroom-storage";

export const runtime = "nodejs";

const contentTypes: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif"
};

export async function GET(request: NextRequest) {
  const name = sanitizeProfileName(request.nextUrl.searchParams.get("name") ?? "");
  const fileName = path.basename(request.nextUrl.searchParams.get("file") ?? "");

  if (!fileName) {
    return new NextResponse("Missing file", { status: 400 });
  }

  try {
    const filePath = path.join(getProfileAssetDir(name), fileName);
    const file = await readFile(filePath);
    const type = contentTypes[path.extname(fileName).toLowerCase()] ?? "application/octet-stream";

    return new NextResponse(file, {
      headers: {
        "Content-Type": type,
        "Cache-Control": "public, max-age=31536000, immutable"
      }
    });
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
}

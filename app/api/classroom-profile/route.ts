import { mkdir, readFile, writeFile } from "node:fs/promises";

import { NextRequest, NextResponse } from "next/server";

import { getProfileDir, getProfileStatePath, sanitizeProfileName } from "@/lib/classroom-storage";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const name = sanitizeProfileName(request.nextUrl.searchParams.get("name") ?? "");

  try {
    const raw = await readFile(getProfileStatePath(name), "utf8");

    return NextResponse.json({
      ok: true,
      name,
      exists: true,
      state: JSON.parse(raw)
    });
  } catch {
    return NextResponse.json({
      ok: true,
      name,
      exists: false,
      state: null
    });
  }
}

export async function POST(request: NextRequest) {
  const payload = (await request.json().catch(() => null)) as { name?: string; state?: unknown } | null;
  const name = sanitizeProfileName(payload?.name ?? "");

  await mkdir(getProfileDir(name), { recursive: true });
  await writeFile(
    getProfileStatePath(name),
    JSON.stringify(
      {
        savedAt: Date.now(),
        state: payload?.state ?? null
      },
      null,
      2
    ),
    "utf8"
  );

  return NextResponse.json({
    ok: true,
    name,
    savedAt: Date.now()
  });
}

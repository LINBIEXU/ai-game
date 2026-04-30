import { cp, mkdir, stat } from "node:fs/promises";
import path from "node:path";

const rootDir = process.cwd();
const standaloneDir = path.join(rootDir, ".next", "standalone");
const standaloneNextDir = path.join(standaloneDir, ".next");
const sourceStaticDir = path.join(rootDir, ".next", "static");
const targetStaticDir = path.join(standaloneNextDir, "static");
const sourcePublicDir = path.join(rootDir, "public");
const targetPublicDir = path.join(standaloneDir, "public");

async function exists(targetPath) {
  try {
    await stat(targetPath);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  if (!(await exists(standaloneDir))) {
    throw new Error("未找到 .next/standalone，standalone 构建结果不存在。");
  }

  await mkdir(standaloneNextDir, { recursive: true });

  if (await exists(sourceStaticDir)) {
    await cp(sourceStaticDir, targetStaticDir, { recursive: true, force: true });
  }

  if (await exists(sourcePublicDir)) {
    await cp(sourcePublicDir, targetPublicDir, { recursive: true, force: true });
  }
}

await main();

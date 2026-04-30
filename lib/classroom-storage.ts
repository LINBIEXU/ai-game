import path from "node:path";

export const CLASSROOM_DATA_DIR = path.join(process.cwd(), "classroom-data");

export function sanitizeProfileName(name: string) {
  const cleaned = name
    .trim()
    .replace(/[\\/:*?"<>|]/g, "-")
    .replace(/\s+/g, "-")
    .slice(0, 48);

  return cleaned || "未命名学员";
}

export function getProfileDir(name: string) {
  return path.join(CLASSROOM_DATA_DIR, sanitizeProfileName(name));
}

export function getProfileStatePath(name: string) {
  return path.join(getProfileDir(name), "state.json");
}

export function getProfileAssetDir(name: string) {
  return path.join(getProfileDir(name), "assets");
}

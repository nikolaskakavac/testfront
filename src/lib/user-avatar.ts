import fs from "node:fs/promises";
import path from "node:path";

const USERS_IMAGE_DIR = path.join(process.cwd(), "baza", "images", "users");
const USERS_IMAGE_INDEX = path.join(USERS_IMAGE_DIR, "index.json");

type AvatarIndexEntry = {
  fileName: string;
  updatedAt: string;
};

type AvatarIndex = Record<string, AvatarIndexEntry>;

function normalizeUsername(username: string) {
  return username.trim().toLowerCase();
}

async function ensureAvatarIndexFile() {
  await fs.mkdir(USERS_IMAGE_DIR, { recursive: true });

  try {
    await fs.access(USERS_IMAGE_INDEX);
  } catch {
    await fs.writeFile(USERS_IMAGE_INDEX, "{}\n", "utf8");
  }
}

export async function readAvatarIndex(): Promise<AvatarIndex> {
  await ensureAvatarIndexFile();

  try {
    const raw = await fs.readFile(USERS_IMAGE_INDEX, "utf8");
    const parsed = JSON.parse(raw) as AvatarIndex;
    return parsed ?? {};
  } catch {
    return {};
  }
}

export async function writeAvatarIndex(index: AvatarIndex) {
  await ensureAvatarIndexFile();
  await fs.writeFile(USERS_IMAGE_INDEX, `${JSON.stringify(index, null, 2)}\n`, "utf8");
}

export async function getAvatarEntry(username: string) {
  const index = await readAvatarIndex();
  return index[normalizeUsername(username)] ?? null;
}

export async function getAvatarUrl(username: string) {
  const entry = await getAvatarEntry(username);

  if (!entry) {
    return null;
  }

  return `/api/users/avatar/${encodeURIComponent(username)}?v=${encodeURIComponent(entry.updatedAt)}`;
}

export function getAvatarFilePath(fileName: string) {
  return path.join(USERS_IMAGE_DIR, fileName);
}

export function getAvatarMimeType(fileName: string) {
  const lower = fileName.toLowerCase();

  if (lower.endsWith(".png")) {
    return "image/png";
  }

  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) {
    return "image/jpeg";
  }

  if (lower.endsWith(".webp")) {
    return "image/webp";
  }

  return "application/octet-stream";
}

export function sanitizeUsernameForFile(username: string) {
  return username.trim().toLowerCase().replace(/[^a-z0-9_-]/g, "-");
}

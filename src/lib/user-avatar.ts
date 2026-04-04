import path from "node:path";

import { toBackendUrl } from "@/lib/backend-url";

const USERS_IMAGE_DIR = path.join(process.cwd(), "baza", "images", "users");

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

export function getAvatarUrl(imgUrl?: string | null) {
  if (!imgUrl) {
    return null;
  }

  const fileName = path.basename(imgUrl);
  if (!fileName || fileName === "DEFAULT.png") {
    return null;
  }

  return toBackendUrl(`/media/users/${encodeURIComponent(fileName)}`);
}

import fs from "node:fs/promises";
import path from "node:path";

const POSTS_IMAGE_DIR = path.join(process.cwd(), "baza", "images", "posts");

export async function ensurePostsImageDir() {
  await fs.mkdir(POSTS_IMAGE_DIR, { recursive: true });
}

export function getPostImageFilePath(fileName: string) {
  return path.join(POSTS_IMAGE_DIR, fileName);
}

export function getPostImageMimeType(fileName: string) {
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

export function sanitizePostFileName(name: string) {
  return name.trim().toLowerCase().replace(/[^a-z0-9_-]/g, "-");
}

export function getPostImageUrl(imgPath?: string | null) {
  if (!imgPath) {
    return null;
  }

  if (imgPath.startsWith("http://") || imgPath.startsWith("https://")) {
    return imgPath;
  }

  const fileName = path.basename(imgPath);
  if (!fileName) {
    return null;
  }

  return `/api/posts/image/${encodeURIComponent(fileName)}`;
}

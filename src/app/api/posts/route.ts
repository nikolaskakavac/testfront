import fs from "node:fs/promises";
import path from "node:path";

import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import { ensurePostsImageDir, getPostImageFilePath, sanitizePostFileName } from "@/lib/post-image";

const BACKEND_API_BASE_URL =
  process.env.BACKEND_API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "http://localhost:8080";

const BACKEND_POSTS_PATH = process.env.BACKEND_POSTS_PATH || "/web/posts";

export async function GET() {
  try {
    const backendResponse = await fetch(`${BACKEND_API_BASE_URL}${BACKEND_POSTS_PATH}`, {
      cache: "no-store",
    });

    const text = await backendResponse.text();
    const contentType = backendResponse.headers.get("content-type") ?? "application/json";

    return new NextResponse(text, {
      status: backendResponse.status,
      headers: {
        "content-type": contentType,
      },
    });
  } catch {
    return NextResponse.json(
      { message: "Backend posts service unavailable." },
      { status: 503 }
    );
  }
}

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("session_token")?.value;
  const csrfToken = cookieStore.get("csrf_token")?.value;
  const refreshToken = cookieStore.get("refresh_token")?.value;

  if (!sessionToken || !csrfToken) {
    return NextResponse.json({ message: "Moras biti ulogovan." }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const title = String(formData.get("title") ?? "");
    const description = String(formData.get("description") ?? "");
    const category = String(formData.get("category") ?? "");
    const tags = String(formData.get("tags") ?? "");
    const files = formData.getAll("images").filter((file) => file instanceof File) as File[];

    if (!files.length) {
      return NextResponse.json({ message: "Dodaj bar jednu sliku." }, { status: 400 });
    }

    await ensurePostsImageDir();

    const savedPaths: string[] = [];

    for (const file of files) {
      if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
        return NextResponse.json({ message: "Dozvoljeni su PNG, JPG i WEBP." }, { status: 400 });
      }

      const extension =
        path.extname(file.name) ||
        (file.type === "image/png" ? ".png" : file.type === "image/webp" ? ".webp" : ".jpg");
      const fileName = `${sanitizePostFileName(title || "post")}-${Date.now()}-${savedPaths.length}${extension}`;
      const filePath = getPostImageFilePath(fileName);
      const bytes = Buffer.from(await file.arrayBuffer());

      await fs.writeFile(filePath, bytes);
      savedPaths.push(`images/posts/${fileName}`);
    }

    const body = JSON.stringify({
      title,
      description,
      category,
      images: savedPaths,
      tags: tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
    });

    const backendResponse = await fetch(`${BACKEND_API_BASE_URL}${BACKEND_POSTS_PATH}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: [
          `session_token=${sessionToken}`,
          `csrf_token=${csrfToken}`,
          refreshToken ? `refresh_token=${refreshToken}` : "",
        ]
          .filter(Boolean)
          .join("; "),
        "X-CSRF-Token": csrfToken,
      },
      body,
      cache: "no-store",
    });

    if (!backendResponse.ok) {
      await Promise.all(
        savedPaths.map(async (imgPath) => {
          const fileName = path.basename(imgPath);
          await fs.rm(getPostImageFilePath(fileName), { force: true });
        })
      );
    }

    const text = await backendResponse.text();
    const contentType = backendResponse.headers.get("content-type") ?? "application/json";

    return new NextResponse(text, {
      status: backendResponse.status,
      headers: {
        "content-type": contentType,
      },
    });
  } catch {
    return NextResponse.json(
      { message: "Backend posts service unavailable." },
      { status: 503 }
    );
  }
}

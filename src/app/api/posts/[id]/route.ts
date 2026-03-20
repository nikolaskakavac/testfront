import fs from "node:fs/promises";
import path from "node:path";

import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { getPostImageFilePath } from "@/lib/post-image";

const BACKEND_API_BASE_URL =
  process.env.BACKEND_API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "http://localhost:8080";

const BACKEND_POSTS_PATH = process.env.BACKEND_POSTS_PATH || "/web/posts";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function DELETE(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("session_token")?.value;
  const csrfToken = cookieStore.get("csrf_token")?.value;
  const refreshToken = cookieStore.get("refresh_token")?.value;

  if (!sessionToken || !csrfToken) {
    return NextResponse.json({ message: "Moras biti ulogovan." }, { status: 401 });
  }

  try {
    const backendResponse = await fetch(`${BACKEND_API_BASE_URL}${BACKEND_POSTS_PATH}/${id}`, {
      method: "DELETE",
      headers: {
        Cookie: [
          `session_token=${sessionToken}`,
          `csrf_token=${csrfToken}`,
          refreshToken ? `refresh_token=${refreshToken}` : "",
        ]
          .filter(Boolean)
          .join("; "),
        "X-CSRF-Token": csrfToken,
      },
      cache: "no-store",
    });

    const data = (await backendResponse.json().catch(() => ({}))) as {
      message?: string;
      images?: string[];
    };

    if (backendResponse.ok && Array.isArray(data.images)) {
      await Promise.all(
        data.images.map(async (imgPath) => {
          if (!imgPath || imgPath.startsWith("http://") || imgPath.startsWith("https://")) {
            return;
          }

          const fileName = path.basename(imgPath);
          if (!fileName) {
            return;
          }

          await fs.rm(getPostImageFilePath(fileName), { force: true });
        })
      );
    }

    return NextResponse.json(
      { message: data.message || (backendResponse.ok ? "Post deleted." : "Delete failed.") },
      { status: backendResponse.status }
    );
  } catch {
    return NextResponse.json({ message: "Backend posts service unavailable." }, { status: 503 });
  }
}

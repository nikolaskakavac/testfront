import { cookies } from "next/headers";
import { NextResponse } from "next/server";

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

async function forwardFavorite(method: "POST" | "DELETE", id: string) {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("session_token")?.value;
  const csrfToken = cookieStore.get("csrf_token")?.value;
  const refreshToken = cookieStore.get("refresh_token")?.value;

  if (!sessionToken || !csrfToken) {
    return NextResponse.json({ message: "Moras biti ulogovan." }, { status: 401 });
  }

  try {
    const backendResponse = await fetch(`${BACKEND_API_BASE_URL}${BACKEND_POSTS_PATH}/${id}/favorite`, {
      method,
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

    const text = await backendResponse.text();
    const contentType = backendResponse.headers.get("content-type") ?? "application/json";

    return new NextResponse(text, {
      status: backendResponse.status,
      headers: {
        "content-type": contentType,
      },
    });
  } catch {
    return NextResponse.json({ message: "Backend favorites service unavailable." }, { status: 503 });
  }
}

export async function POST(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  return forwardFavorite("POST", id);
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  return forwardFavorite("DELETE", id);
}

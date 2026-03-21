import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const BACKEND_API_BASE_URL =
  process.env.BACKEND_API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "http://localhost:8080";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

async function forward(method: "GET" | "POST" | "DELETE", id: string) {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("session_token")?.value;
  const csrfToken = cookieStore.get("csrf_token")?.value;
  const refreshToken = cookieStore.get("refresh_token")?.value;

  try {
    const headers: Record<string, string> = {
      Cookie: [
        sessionToken ? `session_token=${sessionToken}` : "",
        csrfToken ? `csrf_token=${csrfToken}` : "",
        refreshToken ? `refresh_token=${refreshToken}` : "",
      ]
        .filter(Boolean)
        .join("; "),
    };

    if (method !== "GET") {
      if (!sessionToken || !csrfToken) {
        return NextResponse.json({ message: "Moras biti ulogovan." }, { status: 401 });
      }
      headers["X-CSRF-Token"] = csrfToken;
    }

    const backendResponse = await fetch(`${BACKEND_API_BASE_URL}/web/users/${id}/follow`, {
      method,
      headers,
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
    return NextResponse.json({ message: "Backend follow service unavailable." }, { status: 503 });
  }
}

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  return forward("GET", id);
}

export async function POST(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  return forward("POST", id);
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  return forward("DELETE", id);
}

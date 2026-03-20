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

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;

  try {
    const backendResponse = await fetch(`${BACKEND_API_BASE_URL}${BACKEND_POSTS_PATH}/${id}/ratings`, {
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
    return NextResponse.json({ message: "Backend ratings service unavailable." }, { status: 503 });
  }
}

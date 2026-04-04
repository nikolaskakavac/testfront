import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const BACKEND_API_BASE_URL =
  process.env.BACKEND_API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "http://localhost:8080";

export async function PATCH(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    username?: string;
    email?: string;
  } | null;

  if (!body?.username || !body?.email) {
    return NextResponse.json({ message: "Username i email su obavezni." }, { status: 400 });
  }

  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("session_token")?.value;
  const csrfToken = cookieStore.get("csrf_token")?.value;
  const refreshToken = cookieStore.get("refresh_token")?.value;

  const backendResponse = await fetch(`${BACKEND_API_BASE_URL}/web/profile`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Cookie: [
        sessionToken ? `session_token=${sessionToken}` : "",
        csrfToken ? `csrf_token=${csrfToken}` : "",
        refreshToken ? `refresh_token=${refreshToken}` : "",
      ]
        .filter(Boolean)
        .join("; "),
      "X-CSRF-Token": csrfToken ?? "",
    },
    body: JSON.stringify({
      username: body.username,
      email: body.email,
    }),
    cache: "no-store",
  });

  const text = await backendResponse.text();

  try {
    return NextResponse.json(JSON.parse(text), { status: backendResponse.status });
  } catch {
    return NextResponse.json(
      { message: text || "Ne mogu da sacuvam profil." },
      { status: backendResponse.status },
    );
  }
}

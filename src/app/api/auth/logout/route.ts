import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import { forwardAuthRequest } from "@/lib/backend-auth";
import { applyBackendSetCookies } from "@/lib/backend-cookie";

export async function POST() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("session_token")?.value;
  const csrfToken = cookieStore.get("csrf_token")?.value;
  const refreshToken = cookieStore.get("refresh_token")?.value;

  if (!sessionToken || !csrfToken) {
    return NextResponse.json({ message: "Nema aktivne sesije." }, { status: 401 });
  }

  const backendResponse = await forwardAuthRequest(
    "/web/logout",
    {},
    {
      Cookie: [
        `session_token=${sessionToken}`,
        `csrf_token=${csrfToken}`,
        refreshToken ? `refresh_token=${refreshToken}` : "",
      ]
        .filter(Boolean)
        .join("; "),
      "X-CSRF-Token": csrfToken,
    }
  );

  const text = await backendResponse.text();
  const response = NextResponse.json(
    { message: text || "User logout successful" },
    { status: backendResponse.status }
  );

  applyBackendSetCookies(response, backendResponse.headers.getSetCookie());

  return response;
}

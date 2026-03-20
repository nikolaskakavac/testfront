import { NextResponse } from "next/server";

import { forwardAuthRequest } from "@/lib/backend-auth";

export async function POST(request: Request) {
  const { username, email, password, mfa } = await request.json();

  const backendResponse = await forwardAuthRequest("/web/register", {
    username,
    email,
    password,
    mfa: String(Boolean(mfa)),
  });

  const text = await backendResponse.text();

  return new NextResponse(text, {
    status: backendResponse.status,
    headers: {
      "content-type":
        backendResponse.headers.get("content-type") ?? "text/plain",
    },
  });
}

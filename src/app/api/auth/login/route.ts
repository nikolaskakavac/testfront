import { NextResponse } from "next/server";

import { forwardAuthRequest } from "@/lib/backend-auth";
import { applyBackendSetCookies } from "@/lib/backend-cookie";

export async function POST(request: Request) {
  const { username, password } = await request.json();

  const backendResponse = await forwardAuthRequest("/web/login", {
    username,
    password,
  });

  const text = await backendResponse.text();
  const response = new NextResponse(text, {
    status: backendResponse.status,
  });

  applyBackendSetCookies(response, backendResponse.headers.getSetCookie());

  const contentType = backendResponse.headers.get("content-type");
  if (contentType) {
    response.headers.set("content-type", contentType);
  }

  return response;
}

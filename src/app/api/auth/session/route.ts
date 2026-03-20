import { NextResponse } from "next/server";

import { getAuthSession } from "@/lib/auth-session";

export async function GET() {
  const session = await getAuthSession();
  return NextResponse.json(session);
}

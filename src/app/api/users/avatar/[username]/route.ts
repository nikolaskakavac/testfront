import fs from "node:fs/promises";

import { NextResponse } from "next/server";

import { getAvatarEntry, getAvatarFilePath, getAvatarMimeType } from "@/lib/user-avatar";

type RouteContext = {
  params: Promise<{
    username: string;
  }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { username } = await context.params;
  const entry = await getAvatarEntry(username);

  if (!entry) {
    return new NextResponse("Avatar not found", { status: 404 });
  }

  try {
    const filePath = getAvatarFilePath(entry.fileName);
    const file = await fs.readFile(filePath);

    return new NextResponse(file, {
      headers: {
        "Content-Type": getAvatarMimeType(entry.fileName),
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return new NextResponse("Avatar not found", { status: 404 });
  }
}

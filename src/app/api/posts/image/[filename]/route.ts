import fs from "node:fs/promises";

import { NextResponse } from "next/server";

import { getPostImageFilePath, getPostImageMimeType } from "@/lib/post-image";

type RouteContext = {
  params: Promise<{
    filename: string;
  }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { filename } = await context.params;

  try {
    const filePath = getPostImageFilePath(filename);
    const file = await fs.readFile(filePath);

    return new NextResponse(file, {
      headers: {
        "Content-Type": getPostImageMimeType(filename),
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new NextResponse("Image not found", { status: 404 });
  }
}

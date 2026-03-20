import fs from "node:fs/promises";

import { NextResponse } from "next/server";

import { getAuthSession } from "@/lib/auth-session";
import {
  getAvatarEntry,
  getAvatarFilePath,
  readAvatarIndex,
  sanitizeUsernameForFile,
  writeAvatarIndex,
} from "@/lib/user-avatar";

const ALLOWED_TYPES = new Map([
  ["image/png", ".png"],
  ["image/jpeg", ".jpg"],
  ["image/webp", ".webp"],
]);

export async function POST(request: Request) {
  const session = await getAuthSession();

  if (!session.authenticated || !session.username) {
    return NextResponse.json({ message: "Moras biti ulogovan." }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("avatar");

  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ message: "Slika nije prosledjena." }, { status: 400 });
  }

  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ message: "Slika je prevelika. Maksimum je 5MB." }, { status: 400 });
  }

  const extension = ALLOWED_TYPES.get(file.type);
  if (!extension) {
    return NextResponse.json({ message: "Dozvoljeni su PNG, JPG i WEBP." }, { status: 400 });
  }

  const index = await readAvatarIndex();
  const usernameKey = session.username.trim().toLowerCase();
  const previousEntry = await getAvatarEntry(session.username);

  const fileName = `${sanitizeUsernameForFile(session.username)}-${Date.now()}${extension}`;
  const filePath = getAvatarFilePath(fileName);
  const bytes = Buffer.from(await file.arrayBuffer());

  await fs.writeFile(filePath, bytes);

  index[usernameKey] = {
    fileName,
    updatedAt: new Date().toISOString(),
  };

  await writeAvatarIndex(index);

  if (previousEntry && previousEntry.fileName !== "DEFAULT.png" && previousEntry.fileName !== fileName) {
    const previousPath = getAvatarFilePath(previousEntry.fileName);
    await fs.rm(previousPath, { force: true });
  }

  return NextResponse.json({
    message: "Profilna je uspesno sacuvana.",
  });
}

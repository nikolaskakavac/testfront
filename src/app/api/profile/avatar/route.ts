import fs from "node:fs/promises";
import { cookies } from "next/headers";

import { NextResponse } from "next/server";

import { getAuthSession } from "@/lib/auth-session";
import {
  getAvatarFilePath,
  sanitizeUsernameForFile,
} from "@/lib/user-avatar";

const BACKEND_API_BASE_URL =
  process.env.BACKEND_API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "http://localhost:8080";

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

  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("session_token")?.value;
  const csrfToken = cookieStore.get("csrf_token")?.value;
  const refreshToken = cookieStore.get("refresh_token")?.value;
  const previousFileName = session.imgUrl ? session.imgUrl.split("/").pop() : null;

  const fileName = `${sanitizeUsernameForFile(session.username)}-${Date.now()}${extension}`;
  const filePath = getAvatarFilePath(fileName);
  const bytes = Buffer.from(await file.arrayBuffer());
  const dbPath = `images/users/${fileName}`;

  await fs.writeFile(filePath, bytes);

  const backendResponse = await fetch(`${BACKEND_API_BASE_URL}/web/profile/avatar`, {
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
      img_url: dbPath,
    }),
    cache: "no-store",
  });

  if (!backendResponse.ok) {
    await fs.rm(filePath, { force: true });
    return NextResponse.json({ message: "Ne mogu da sacuvam profilnu u bazi." }, { status: backendResponse.status });
  }

  if (previousFileName && previousFileName !== "DEFAULT.png" && previousFileName !== fileName) {
    await fs.rm(getAvatarFilePath(previousFileName), { force: true });
  }

  return NextResponse.json({
    message: "Profilna je uspesno sacuvana.",
  });
}

export async function DELETE() {
  const session = await getAuthSession();

  if (!session.authenticated || !session.username) {
    return NextResponse.json({ message: "Moras biti ulogovan." }, { status: 401 });
  }

  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("session_token")?.value;
  const csrfToken = cookieStore.get("csrf_token")?.value;
  const refreshToken = cookieStore.get("refresh_token")?.value;
  const previousFileName = session.imgUrl ? session.imgUrl.split("/").pop() : null;

  if (!previousFileName) {
    return NextResponse.json({ message: "Profilna vec nije postavljena." });
  }

  const backendResponse = await fetch(`${BACKEND_API_BASE_URL}/web/profile/avatar`, {
    method: "DELETE",
    headers: {
      Cookie: [
        sessionToken ? `session_token=${sessionToken}` : "",
        csrfToken ? `csrf_token=${csrfToken}` : "",
        refreshToken ? `refresh_token=${refreshToken}` : "",
      ]
        .filter(Boolean)
        .join("; "),
      "X-CSRF-Token": csrfToken ?? "",
    },
    cache: "no-store",
  });

  if (!backendResponse.ok) {
    return NextResponse.json({ message: "Ne mogu da uklonim profilnu iz baze." }, { status: backendResponse.status });
  }

  await fs.rm(getAvatarFilePath(previousFileName), { force: true });

  return NextResponse.json({
    message: "Profilna je uklonjena.",
  });
}

import { cookies } from "next/headers";

import { NextResponse } from "next/server";

import { getAuthSession } from "@/lib/auth-session";

const BACKEND_API_BASE_URL =
  process.env.BACKEND_API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "http://localhost:8080";

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

  if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
    return NextResponse.json({ message: "Dozvoljeni su PNG, JPG i WEBP." }, { status: 400 });
  }

  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("session_token")?.value;
  const csrfToken = cookieStore.get("csrf_token")?.value;
  const refreshToken = cookieStore.get("refresh_token")?.value;
  const form = new FormData();
  form.append("avatar", file);

  const backendResponse = await fetch(`${BACKEND_API_BASE_URL}/web/profile/avatar`, {
    method: "PATCH",
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
    body: form,
    cache: "no-store",
  });

  if (!backendResponse.ok) {
    return NextResponse.json({ message: "Ne mogu da sacuvam profilnu u bazi." }, { status: backendResponse.status });
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
  if (!session.imgUrl) {
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

  return NextResponse.json({
    message: "Profilna je uklonjena.",
  });
}

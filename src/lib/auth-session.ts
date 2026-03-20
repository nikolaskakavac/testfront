import { cookies } from "next/headers";

const BACKEND_API_BASE_URL =
  process.env.BACKEND_API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "http://localhost:8080";

export type AuthSession = {
  authenticated: boolean;
  username: string | null;
  email: string | null;
  imgUrl: string | null;
};

type AuthSessionResponse = Partial<AuthSession> & {
  img_url?: string | null;
};

export async function getAuthSession(): Promise<AuthSession> {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("session_token")?.value;
  const csrfToken = cookieStore.get("csrf_token")?.value;
  const refreshToken = cookieStore.get("refresh_token")?.value;

  if (!sessionToken) {
    return {
      authenticated: false,
      username: null,
      email: null,
      imgUrl: null,
    };
  }

  try {
    const backendResponse = await fetch(`${BACKEND_API_BASE_URL}/web/session`, {
      method: "GET",
      headers: {
        Cookie: [
          `session_token=${sessionToken}`,
          csrfToken ? `csrf_token=${csrfToken}` : "",
          refreshToken ? `refresh_token=${refreshToken}` : "",
        ]
          .filter(Boolean)
          .join("; "),
      },
      cache: "no-store",
    });

    if (!backendResponse.ok) {
      return {
        authenticated: false,
        username: null,
        email: null,
        imgUrl: null,
      };
    }

    const data = (await backendResponse.json()) as AuthSessionResponse;

    return {
      authenticated: Boolean(data.authenticated),
      username: data.username ?? null,
      email: data.email ?? null,
      imgUrl: data.imgUrl ?? data.img_url ?? null,
    };
  } catch {
    return {
      authenticated: false,
      username: null,
      email: null,
      imgUrl: null,
    };
  }
}

const BACKEND_API_BASE_URL =
  process.env.BACKEND_API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "http://localhost:8080";

type BackendAuthPayload = Record<string, string>;
type BackendHeaders = Record<string, string>;

export async function forwardAuthRequest(
  path: string,
  payload: BackendAuthPayload,
  headers: BackendHeaders = {}
) {
  const body = new URLSearchParams(payload);

  return fetch(`${BACKEND_API_BASE_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      ...headers,
    },
    body,
    cache: "no-store",
  });
}

const backendBase =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.BACKEND_API_BASE_URL ||
  "http://localhost:8080";

export function getBackendBaseUrl() {
  return backendBase.replace(/\/+$/, "");
}

export function toBackendUrl(pathname: string) {
  const normalizedPath = pathname.startsWith("/") ? pathname : `/${pathname}`;
  return `${getBackendBaseUrl()}${normalizedPath}`;
}

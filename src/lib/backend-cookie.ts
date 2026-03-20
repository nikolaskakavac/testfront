import { NextResponse } from "next/server";

function normalizeSetCookieHeaders(setCookies: string[]) {
  return setCookies.flatMap((setCookie) =>
    setCookie
      .split(/,(?=\s*[A-Za-z0-9!#$%&'*+.^_`|~-]+=)/)
      .map((part) => part.trim())
      .filter(Boolean)
  );
}

function parseSetCookieHeader(setCookie: string) {
  const parts = setCookie.split(";").map((part) => part.trim());
  const [nameValue, ...attributes] = parts;
  const separatorIndex = nameValue.indexOf("=");

  if (separatorIndex === -1) {
    return null;
  }

  const name = nameValue.slice(0, separatorIndex);
  const value = nameValue.slice(separatorIndex + 1);

  const options: {
    path?: string;
    domain?: string;
    expires?: Date;
    httpOnly?: boolean;
    secure?: boolean;
    sameSite?: "strict" | "lax" | "none";
    maxAge?: number;
  } = {};

  for (const attribute of attributes) {
    const [rawKey, ...rawValueParts] = attribute.split("=");
    const key = rawKey.toLowerCase();
    const rawValue = rawValueParts.join("=");

    if (key === "httponly") {
      options.httpOnly = true;
      continue;
    }

    if (key === "secure") {
      options.secure = true;
      continue;
    }

    if (key === "path" && rawValue) {
      options.path = rawValue;
      continue;
    }

    if (key === "domain" && rawValue) {
      options.domain = rawValue;
      continue;
    }

    if (key === "expires" && rawValue) {
      const expires = new Date(rawValue);
      if (!Number.isNaN(expires.getTime())) {
        options.expires = expires;
      }
      continue;
    }

    if (key === "max-age" && rawValue) {
      const maxAge = Number(rawValue);
      if (!Number.isNaN(maxAge)) {
        options.maxAge = maxAge;
      }
      continue;
    }

    if (key === "samesite" && rawValue) {
      const sameSite = rawValue.toLowerCase();
      if (sameSite === "strict" || sameSite === "lax" || sameSite === "none") {
        options.sameSite = sameSite;
      }
    }
  }

  return {
    name,
    value,
    options,
  };
}

export function applyBackendSetCookies(response: NextResponse, setCookies: string[]) {
  for (const setCookie of normalizeSetCookieHeaders(setCookies)) {
    const parsed = parseSetCookieHeader(setCookie);

    if (!parsed) {
      continue;
    }

    response.cookies.set(parsed.name, parsed.value, parsed.options);
  }
}

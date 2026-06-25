const SECURE = process.env.COOKIE_SECURE === "true";

export const ACCESS_COOKIE = "k360_at";
export const REFRESH_COOKIE = "k360_rt";

export const ACCESS_TOKEN_MAX_AGE = 15 * 60; // 15 dakika
export const REFRESH_TOKEN_MAX_AGE = 7 * 24 * 60 * 60; // 7 gün

export function accessCookieOptions() {
  return {
    httpOnly: true,
    secure: SECURE,
    sameSite: "lax" as const,
    path: "/",
    maxAge: ACCESS_TOKEN_MAX_AGE,
  };
}

export function refreshCookieOptions() {
  return {
    httpOnly: true,
    secure: SECURE,
    sameSite: "lax" as const,
    path: "/api/auth/refresh",
    maxAge: REFRESH_TOKEN_MAX_AGE,
  };
}

export function expiredCookieOptions(path: string) {
  return {
    httpOnly: true,
    secure: SECURE,
    sameSite: "lax" as const,
    path,
    maxAge: 0,
  };
}

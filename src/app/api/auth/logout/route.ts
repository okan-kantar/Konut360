import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { ACCESS_COOKIE, REFRESH_COOKIE, expiredCookieOptions } from "@/lib/auth/cookies";
import { logAction } from "@/lib/audit/logAction";

export async function POST() {
  const session = await getSession();
  const response = NextResponse.json({ ok: true });
  response.cookies.set(ACCESS_COOKIE, "", expiredCookieOptions("/"));
  response.cookies.set(REFRESH_COOKIE, "", expiredCookieOptions("/api/auth/refresh"));

  if (session) {
    await logAction({
      siteId: session.siteId,
      userId: session.sub,
      rol: session.rol,
      action: "auth.logout",
      entityType: "User",
      entityId: session.sub,
    });
  }

  return response;
}

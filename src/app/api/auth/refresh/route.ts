import { NextResponse, type NextRequest } from "next/server";
import { connectDB } from "@/lib/db/connect";
import User from "@/models/User";
import Site from "@/models/Site";
import { verifyRefreshToken, signAccessToken, signRefreshToken } from "@/lib/auth/jwt";
import {
  ACCESS_COOKIE,
  REFRESH_COOKIE,
  accessCookieOptions,
  refreshCookieOptions,
  expiredCookieOptions,
} from "@/lib/auth/cookies";
import { permissionsForRole } from "@/lib/auth/permissions";
import { errorResponse, HttpError } from "@/lib/http/errors";

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get(REFRESH_COOKIE)?.value;
    if (!token) throw new HttpError(401, "unauthorized");

    const payload = await verifyRefreshToken(token).catch(() => null);
    if (!payload) throw new HttpError(401, "unauthorized");

    await connectDB();
    const user = await User.findOne({ _id: payload.sub, aktif: true });
    if (!user) throw new HttpError(401, "unauthorized");

    let siteId: string | null = null;
    if (user.siteId) {
      const site = await Site.findOne({ _id: user.siteId, aktif: true });
      if (!site) throw new HttpError(401, "unauthorized");
      siteId = site.id;
    }

    const permissions = permissionsForRole(user.rol);
    const accessToken = await signAccessToken({
      sub: user.id,
      rol: user.rol,
      siteId,
      permissions,
      adSoyad: user.adSoyad,
      daireId: user.daireId?.toString(),
      sakinSubId: user.sakinSubId?.toString(),
    });
    const refreshToken = await signRefreshToken(user.id);

    const response = NextResponse.json({ ok: true });
    response.cookies.set(ACCESS_COOKIE, accessToken, accessCookieOptions());
    response.cookies.set(REFRESH_COOKIE, refreshToken, refreshCookieOptions());
    return response;
  } catch (error) {
    const res = errorResponse(error);
    res.cookies.set(ACCESS_COOKIE, "", expiredCookieOptions("/"));
    res.cookies.set(REFRESH_COOKIE, "", expiredCookieOptions("/api/auth/refresh"));
    return res;
  }
}

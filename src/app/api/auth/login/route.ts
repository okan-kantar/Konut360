import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db/connect";
import Site from "@/models/Site";
import User from "@/models/User";
import { verifyPassword } from "@/lib/auth/password";
import { signAccessToken, signRefreshToken } from "@/lib/auth/jwt";
import {
  ACCESS_COOKIE,
  REFRESH_COOKIE,
  accessCookieOptions,
  refreshCookieOptions,
} from "@/lib/auth/cookies";
import { permissionsForRole, ROLE_HOME_PATH } from "@/lib/auth/permissions";
import { checkRateLimit, getClientIp } from "@/lib/security/rateLimit";
import { logAction } from "@/lib/audit/logAction";
import { errorResponse, HttpError } from "@/lib/http/errors";

const bodySchema = z.object({
  siteSlug: z.string().min(1),
  rol: z.enum(["site_yoneticisi", "site_sakini"]),
  kullaniciAdi: z.string().min(1).max(100),
  sifre: z.string().min(1).max(200),
});

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    if (!checkRateLimit(`login:${ip}`, 10, 5 * 60 * 1000)) {
      throw new HttpError(429, "too_many_attempts");
    }

    const json = await request.json().catch(() => null);
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) throw new HttpError(400, "invalid_request");
    const { siteSlug, rol, kullaniciAdi, sifre } = parsed.data;

    await connectDB();
    const site = await Site.findOne({ slug: siteSlug.toLowerCase(), aktif: true });
    if (!site) throw new HttpError(401, "invalid_credentials");

    const user = await User.findOne({
      siteId: site._id,
      kullaniciAdi: kullaniciAdi.toLowerCase(),
      rol,
      aktif: true,
    });
    if (!user) throw new HttpError(401, "invalid_credentials");

    const ok = await verifyPassword(sifre, user.sifreHash);
    if (!ok) throw new HttpError(401, "invalid_credentials");

    const permissions = permissionsForRole(user.rol);
    const accessToken = await signAccessToken({
      sub: user.id,
      rol: user.rol,
      siteId: site.id,
      permissions,
      adSoyad: user.adSoyad,
      daireId: user.daireId?.toString(),
      sakinSubId: user.sakinSubId?.toString(),
    });
    const refreshToken = await signRefreshToken(user.id);

    await logAction({
      siteId: site.id,
      userId: user.id,
      rol: user.rol,
      action: "auth.login",
      entityType: "User",
      entityId: user.id,
      ip,
      userAgent: request.headers.get("user-agent") ?? undefined,
    });

    const response = NextResponse.json({ ok: true, redirectTo: ROLE_HOME_PATH[user.rol] });
    response.cookies.set(ACCESS_COOKIE, accessToken, accessCookieOptions());
    response.cookies.set(REFRESH_COOKIE, refreshToken, refreshCookieOptions());
    return response;
  } catch (error) {
    return errorResponse(error);
  }
}

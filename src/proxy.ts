import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyAccessToken } from "@/lib/auth/jwt";
import { ACCESS_COOKIE } from "@/lib/auth/cookies";
import { ROLE_HOME_PATH, type Role } from "@/lib/auth/permissions";

const IS_DEV = process.env.NODE_ENV === "development";

const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${IS_DEV ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "font-src 'self' data: https://fonts.gstatic.com",
  "connect-src 'self'",
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ");

const SECURITY_HEADERS: Record<string, string> = {
  "X-Frame-Options": "DENY",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Content-Security-Policy": CONTENT_SECURITY_POLICY,
};

function withSecurityHeaders(res: NextResponse): NextResponse {
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    res.headers.set(key, value);
  }
  return res;
}

interface ProtectedPrefix {
  prefix: string;
  roles: Role[];
  loginPath: string;
}

const PROTECTED_PREFIXES: ProtectedPrefix[] = [
  { prefix: "/sistem-admin", roles: ["sistem_admin"], loginPath: "/sistem-admin/giris" },
  { prefix: "/portal", roles: ["site_sakini"], loginPath: "/giris" },
  { prefix: "/dashboard", roles: ["site_yoneticisi", "muhasebe"], loginPath: "/giris" },
  { prefix: "/aidat", roles: ["site_yoneticisi", "muhasebe"], loginPath: "/giris" },
  { prefix: "/ekodenek", roles: ["site_yoneticisi", "muhasebe"], loginPath: "/giris" },
  { prefix: "/finans", roles: ["site_yoneticisi", "muhasebe"], loginPath: "/giris" },
  { prefix: "/daireler", roles: ["site_yoneticisi"], loginPath: "/giris" },
  { prefix: "/bloklar", roles: ["site_yoneticisi"], loginPath: "/giris" },
  { prefix: "/firmalar", roles: ["site_yoneticisi"], loginPath: "/giris" },
  { prefix: "/tanimlar", roles: ["site_yoneticisi"], loginPath: "/giris" },
  { prefix: "/raporlar", roles: ["site_yoneticisi", "muhasebe"], loginPath: "/giris" },
];

function matchProtected(pathname: string): ProtectedPrefix | undefined {
  return PROTECTED_PREFIXES.find(
    (p) => pathname === p.prefix || pathname.startsWith(`${p.prefix}/`),
  );
}

const STATE_CHANGING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);
const PUBLIC_API_PREFIXES = ["/api/auth/", "/api/health", "/api/sistem-admin/login"];

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isApi = pathname.startsWith("/api/");
  const isPublicApi = PUBLIC_API_PREFIXES.some((p) => pathname.startsWith(p));

  if (isApi && !isPublicApi && STATE_CHANGING_METHODS.has(request.method)) {
    const origin = request.headers.get("origin");
    if (origin) {
      try {
        if (new URL(origin).host !== request.nextUrl.host) {
          return withSecurityHeaders(
            NextResponse.json({ error: "forbidden_origin" }, { status: 403 }),
          );
        }
      } catch {
        return withSecurityHeaders(
          NextResponse.json({ error: "forbidden_origin" }, { status: 403 }),
        );
      }
    }
  }

  const token = request.cookies.get(ACCESS_COOKIE)?.value;
  let session: { rol: Role } | null = null;
  if (token) {
    try {
      const payload = await verifyAccessToken(token);
      session = { rol: payload.rol };
    } catch {
      session = null;
    }
  }

  if (isApi) {
    if (isPublicApi) return withSecurityHeaders(NextResponse.next());
    if (!session) {
      return withSecurityHeaders(NextResponse.json({ error: "unauthorized" }, { status: 401 }));
    }
    return withSecurityHeaders(NextResponse.next());
  }

  const match = matchProtected(pathname);
  if (match) {
    if (!session || !match.roles.includes(session.rol)) {
      return withSecurityHeaders(NextResponse.redirect(new URL(match.loginPath, request.url)));
    }
  }

  if ((pathname === "/giris" || pathname === "/sistem-admin/giris") && session) {
    return withSecurityHeaders(
      NextResponse.redirect(new URL(ROLE_HOME_PATH[session.rol], request.url)),
    );
  }

  return withSecurityHeaders(NextResponse.next());
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};

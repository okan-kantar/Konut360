import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ACCESS_COOKIE } from "./cookies";
import { verifyAccessToken, type AccessTokenPayload } from "./jwt";
import { hasPermission, type Permission, type Role } from "./permissions";
import { HttpError } from "@/lib/http/errors";

export async function getSession(): Promise<AccessTokenPayload | null> {
  const store = await cookies();
  const token = store.get(ACCESS_COOKIE)?.value;
  if (!token) return null;
  try {
    return await verifyAccessToken(token);
  } catch {
    return null;
  }
}

export async function requireSession(): Promise<AccessTokenPayload> {
  const session = await getSession();
  if (!session) throw new HttpError(401, "unauthorized");
  return session;
}

export async function requireRole(...roles: Role[]): Promise<AccessTokenPayload> {
  const session = await requireSession();
  if (!roles.includes(session.rol)) throw new HttpError(403, "forbidden");
  return session;
}

export async function requirePermission(permission: Permission): Promise<AccessTokenPayload> {
  const session = await requireSession();
  if (!hasPermission(session.permissions, permission)) throw new HttpError(403, "forbidden");
  return session;
}

export async function requireAnyPermission(...permissions: Permission[]): Promise<AccessTokenPayload> {
  const session = await requireSession();
  if (!permissions.some((p) => hasPermission(session.permissions, p))) {
    throw new HttpError(403, "forbidden");
  }
  return session;
}

/**
 * Server Component (page) içinde kullanılır. İlgili route group layout'u zaten
 * rol kontrolü yapıp yönlendirdiği için burada session'ın var olduğu varsayılır;
 * yine de savunma amaçlı (defense-in-depth) tekrar kontrol edilir.
 */
export async function requirePageSession(loginPath = "/giris"): Promise<AccessTokenPayload> {
  const session = await getSession();
  if (!session) redirect(loginPath);
  return session;
}

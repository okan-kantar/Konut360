import { SignJWT, jwtVerify } from "jose";
import type { Permission, Role } from "./permissions";

export interface AccessTokenPayload {
  sub: string;
  rol: Role;
  siteId: string | null;
  permissions: Permission[];
  adSoyad: string;
  daireId?: string;
  sakinSubId?: string;
}

export interface RefreshTokenPayload {
  sub: string;
}

const ACCESS_TTL = "15m";
const REFRESH_TTL = "7d";

function secretFor(name: "JWT_SECRET" | "JWT_REFRESH_SECRET"): Uint8Array {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} ortam değişkeni tanımlı değil`);
  }
  return new TextEncoder().encode(value);
}

export async function signAccessToken(payload: AccessTokenPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(ACCESS_TTL)
    .sign(secretFor("JWT_SECRET"));
}

export async function verifyAccessToken(token: string): Promise<AccessTokenPayload> {
  const { payload } = await jwtVerify(token, secretFor("JWT_SECRET"));
  return payload as unknown as AccessTokenPayload;
}

export async function signRefreshToken(userId: string): Promise<string> {
  return new SignJWT({ sub: userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(REFRESH_TTL)
    .sign(secretFor("JWT_REFRESH_SECRET"));
}

export async function verifyRefreshToken(token: string): Promise<RefreshTokenPayload> {
  const { payload } = await jwtVerify(token, secretFor("JWT_REFRESH_SECRET"));
  return payload as unknown as RefreshTokenPayload;
}

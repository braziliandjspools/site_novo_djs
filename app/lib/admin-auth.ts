import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

export const ADMIN_COOKIE = "bp_admin_session";
const SESSION_MAX_AGE = 60 * 60 * 8;

function getAdminSecret() {
  return (process.env.PORTAL_ADMIN_SECRET ?? "").trim();
}

function signPayload(payloadB64: string) {
  return createHmac("sha256", getAdminSecret()).update(payloadB64).digest("base64url");
}

export function createAdminToken() {
  const payload = {
    role: "admin" as const,
    exp: Date.now() + SESSION_MAX_AGE * 1000,
  };
  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${payloadB64}.${signPayload(payloadB64)}`;
}

export function isValidAdminToken(token: string | undefined) {
  const secret = getAdminSecret();
  if (!secret || !token) return false;

  const [payloadB64, signature] = token.split(".");
  if (!payloadB64 || !signature) return false;

  const expected = signPayload(payloadB64);
  try {
    const sigBuf = Buffer.from(signature, "base64url");
    const expBuf = Buffer.from(expected, "base64url");
    if (sigBuf.length !== expBuf.length || !timingSafeEqual(sigBuf, expBuf)) {
      return false;
    }
  } catch {
    return false;
  }

  try {
    const payload = JSON.parse(Buffer.from(payloadB64, "base64url").toString("utf8")) as {
      role?: string;
      exp?: number;
    };
    return payload.role === "admin" && Boolean(payload.exp && payload.exp > Date.now());
  } catch {
    return false;
  }
}

export function verifyAdminSecret(secret: string) {
  const expected = getAdminSecret().trim();
  const provided = secret.trim();
  if (!expected || !provided) return false;

  try {
    const left = Buffer.from(provided, "utf8");
    const right = Buffer.from(expected, "utf8");
    if (left.length !== right.length) return false;
    return timingSafeEqual(left, right);
  } catch {
    return false;
  }
}

export async function isAdminAuthenticated() {
  const store = await cookies();
  return isValidAdminToken(store.get(ADMIN_COOKIE)?.value);
}

export function adminCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: SESSION_MAX_AGE,
  };
}

export function isAuthorizedAdminRequest(request: Request) {
  if (isValidAdminToken(getCookieFromRequest(request))) {
    return true;
  }

  const secret = getAdminSecret();
  if (!secret) return false;

  const header = request.headers.get("authorization") ?? "";
  const bearer = header.startsWith("Bearer ") ? header.slice(7) : "";
  const alt = request.headers.get("x-admin-secret") ?? "";

  return bearer === secret || alt === secret;
}

function getCookieFromRequest(request: Request) {
  const cookieHeader = request.headers.get("cookie") ?? "";
  const match = cookieHeader.match(/(?:^|;\s*)bp_admin_session=([^;]+)/);
  return match?.[1];
}

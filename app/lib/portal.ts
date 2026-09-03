import { createHmac, timingSafeEqual } from "crypto";
import { cookies, headers } from "next/headers";
import {
  findUserById,
  formatMonthlyValue,
  getServicesLabel,
  userHasAllavsoft,
  userHasDeemix,
  userHasPools,
  userHasSubscriptionPlan,
  type PortalUser,
} from "./portal-users";

export const PORTAL_COOKIE = "bp_portal_session";
export const PORTAL_DESKTOP_CLIENT_HEADER = "X-BP-Client";
export const PORTAL_DESKTOP_CLIENT_ID = "downloader";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7;

function getSessionSecret() {
  return process.env.PORTAL_SESSION_SECRET ?? "altere-este-segredo-no-env-local";
}

type SessionPayload = {
  userId: number;
  exp: number;
};

function signPayload(payloadB64: string) {
  return createHmac("sha256", getSessionSecret()).update(payloadB64).digest("base64url");
}

export function createPortalToken(userId: number) {
  const payload: SessionPayload = {
    userId,
    exp: Date.now() + SESSION_MAX_AGE * 1000,
  };
  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${payloadB64}.${signPayload(payloadB64)}`;
}

export function parsePortalToken(token: string | undefined): number | null {
  if (!token) return null;

  const [payloadB64, signature] = token.split(".");
  if (!payloadB64 || !signature) return null;

  const expected = signPayload(payloadB64);
  try {
    const sigBuf = Buffer.from(signature, "base64url");
    const expBuf = Buffer.from(expected, "base64url");
    if (sigBuf.length !== expBuf.length || !timingSafeEqual(sigBuf, expBuf)) {
      return null;
    }
  } catch {
    return null;
  }

  try {
    const payload = JSON.parse(Buffer.from(payloadB64, "base64url").toString("utf8")) as SessionPayload;
    if (!payload.userId || !payload.exp || payload.exp < Date.now()) {
      return null;
    }
    return payload.userId;
  } catch {
    return null;
  }
}

function readBearerToken(authorization: string | null) {
  if (!authorization?.startsWith("Bearer ")) return null;
  const token = authorization.slice(7).trim();
  return token || null;
}

export async function resolvePortalSessionToken() {
  const store = await cookies();
  const cookieToken = store.get(PORTAL_COOKIE)?.value;
  if (cookieToken) return cookieToken;

  const headerStore = await headers();
  return readBearerToken(headerStore.get("authorization"));
}

export async function getAuthenticatedPortalUser() {
  const userId = parsePortalToken((await resolvePortalSessionToken()) ?? undefined);
  if (!userId) return null;

  const user = await findUserById(userId);
  if (!user || !user.active) return null;

  return user;
}

export async function isPortalAuthenticated() {
  return (await getAuthenticatedPortalUser()) !== null;
}

export function portalCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: SESSION_MAX_AGE,
  };
}

function getGreeting(hour: number) {
  if (hour >= 5 && hour < 12) return "Bom dia";
  if (hour >= 12 && hour < 18) return "Boa tarde";
  return "Boa noite";
}

function formatPortalDateTime(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function getGreetingHour(date: Date) {
  const parts = new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    hour: "numeric",
    hour12: false,
  }).formatToParts(date);

  return Number(parts.find((part) => part.type === "hour")?.value ?? "0");
}

function getLicenseConfig() {
  return {
    deemix: {
      arl320: process.env.DEEMIX_ARL_320 ?? "",
      arl128: process.env.DEEMIX_ARL_128 || process.env.DEEMIX_ARL_320 || "",
      downloadUrl: process.env.DEEMIX_DOWNLOAD_URL ?? "",
      spotify: {
        clientId: process.env.SPOTIFY_CLIENT_ID ?? "",
        clientSecret: process.env.SPOTIFY_CLIENT_SECRET ?? "",
        user: process.env.SPOTIFY_USER ?? "",
      },
    },
    allavsoft: {
      availableFrom: process.env.ALLAVSOFT_AVAILABLE_DATE ?? "2026-10-27",
      launchLabel: process.env.ALLAVSOFT_LAUNCH_LABEL ?? "Outubro 2026",
    },
    pools: {
      catalogUrl: "/musicas/atualizacoes",
    },
  };
}

export function getPortalDataForUser(user: PortalUser) {
  const now = new Date();
  const config = getLicenseConfig();
  const greeting = getGreeting(getGreetingHour(now));

  return {
    user: {
      name: user.name,
      email: user.email,
      whatsapp: user.whatsapp,
      plan: user.plan,
      planLabel: getServicesLabel(user.services),
      services: user.services,
      servicesLabel: getServicesLabel(user.services),
      monthlyValue: user.monthlyValue,
      monthlyValueLabel: formatMonthlyValue(user.monthlyValue),
      dueDay: user.dueDay,
      nextDueAt: user.nextDueAt.toISOString(),
      createdAt: user.createdAt.toISOString(),
      active: user.active,
    },
    musicProducerDeliveries: {
      enabled: user.musicProducerDeliveriesEnabled,
    },
    hasSubscriptionPlan: userHasSubscriptionPlan(user),
    greeting,
    datetime: formatPortalDateTime(now),
    deemix: userHasDeemix(user)
      ? {
          status: "active" as const,
          ...config.deemix,
        }
      : null,
    allavsoft: userHasAllavsoft(user) ? config.allavsoft : null,
    pools: userHasPools(user) ? config.pools : null,
  };
}

import { apiFetch } from "./client";
import type { AuthUser, PlanBillingInfo, PlanServices } from "../plan-status";

type LoginResponse = {
  ok: boolean;
  token?: string;
  expiresIn?: number;
  error?: string;
  planExpired?: boolean;
};

type SessionResponse = {
  authenticated: boolean;
  canPlay: boolean;
  hasVip: boolean;
  planExpired?: boolean;
  user: {
    name: string;
    email?: string;
    whatsapp?: string | null;
    plan: string;
    planLabel?: string;
    services?: PlanServices;
    servicesLabel?: string;
    monthlyValue?: number;
    monthlyValueLabel?: string;
    billing?: PlanBillingInfo;
  } | null;
};

export async function loginWithPassword(email: string, password: string, apiBaseUrl?: string) {
  const data = await apiFetch<LoginResponse>("/api/portal/login", {
    method: "POST",
    apiBaseUrl,
    body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
  });

  if (!data.token) {
    throw new Error(
      "Servidor não devolveu token de acesso. Atualize o app ou confira se a URL aponta para sitenovodjs.vercel.app.",
    );
  }

  return data.token;
}

export async function fetchSession(token: string, apiBaseUrl?: string) {
  return apiFetch<SessionResponse>("/api/musicas/session", {
    method: "GET",
    token,
    apiBaseUrl,
  });
}

export function mapSessionUser(user: NonNullable<SessionResponse["user"]>): AuthUser {
  return {
    name: user.name,
    email: user.email,
    whatsapp: user.whatsapp,
    plan: user.plan,
    planLabel: user.planLabel || user.servicesLabel || user.plan,
    services: user.services,
    servicesLabel: user.servicesLabel || user.planLabel,
    monthlyValue: user.monthlyValue,
    monthlyValueLabel: user.monthlyValueLabel,
    billing: user.billing ?? null,
  };
}

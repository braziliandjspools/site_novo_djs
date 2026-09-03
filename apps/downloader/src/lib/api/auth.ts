import { apiFetch } from "./client";

type LoginResponse = {
  ok: boolean;
  token?: string;
  expiresIn?: number;
  error?: string;
};

type SessionResponse = {
  authenticated: boolean;
  canPlay: boolean;
  hasVip: boolean;
  user: { name: string; plan: string } | null;
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

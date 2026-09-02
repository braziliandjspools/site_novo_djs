import { apiFetch } from "./client";
import { DESKTOP_CLIENT_HEADER, DESKTOP_CLIENT_ID } from "./config";

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

export async function loginWithPassword(email: string, password: string) {
  const data = await apiFetch<LoginResponse>("/api/portal/login", {
    method: "POST",
    headers: {
      [DESKTOP_CLIENT_HEADER]: DESKTOP_CLIENT_ID,
    },
    body: JSON.stringify({ email, password }),
  });

  if (!data.token) {
    throw new Error("Resposta de login inválida para o aplicativo desktop.");
  }

  return data.token;
}

export async function fetchSession(token: string) {
  return apiFetch<SessionResponse>("/api/musicas/session", {
    method: "GET",
    token,
  });
}

import {
  DESKTOP_CLIENT_HEADER,
  DESKTOP_CLIENT_ID,
  getCachedApiBaseUrl,
  normalizeApiBaseUrl,
  resolveApiBaseUrl,
} from "./config";

export class ApiError extends Error {
  status: number;
  payload?: unknown;

  constructor(message: string, status: number, payload?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.payload = payload;
  }
}

export class NetworkError extends Error {
  apiBaseUrl: string;

  constructor(apiBaseUrl: string, detail?: string) {
    const hint =
      apiBaseUrl.includes("localhost") || apiBaseUrl.includes("127.0.0.1")
        ? "Confirme que o site está rodando (npm run dev na raiz do projeto)."
        : "Verifique a URL (ex.: sitenovodjs.vercel.app) e sua conexão.";
    const suffix = detail ? ` (${detail})` : "";
    super(`Sem conexão com ${apiBaseUrl}. ${hint}${suffix}`);
    this.name = "NetworkError";
    this.apiBaseUrl = apiBaseUrl;
  }
}

type ApiFetchOptions = RequestInit & {
  token?: string | null;
  apiBaseUrl?: string;
};

function isTauriRuntime() {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

async function tauriHttpFetch(
  url: string,
  method: string,
  headers: Record<string, string>,
  body?: string,
): Promise<{ status: number; body: string }> {
  const { invoke } = await import("@tauri-apps/api/core");
  return invoke<{ status: number; body: string }>("desktop_api_fetch", {
    request: { method, url, headers, body: body ?? null },
  });
}

async function performFetch(
  url: string,
  method: string,
  headers: Headers,
  body?: BodyInit | null,
): Promise<Response> {
  const headerRecord: Record<string, string> = {};
  headers.forEach((value, key) => {
    headerRecord[key] = value;
  });

  const bodyText = typeof body === "string" ? body : body ? String(body) : undefined;

  if (isTauriRuntime()) {
    const result = await tauriHttpFetch(url, method, headerRecord, bodyText);
    return new Response(result.body, {
      status: result.status,
      headers: { "Content-Type": "application/json" },
    });
  }

  return fetch(url, { method, headers, body });
}

export async function apiFetch<T>(path: string, options: ApiFetchOptions = {}): Promise<T> {
  const { token, headers, apiBaseUrl: baseOverride, ...rest } = options;
  const apiBaseUrl = baseOverride ?? (await resolveApiBaseUrl());
  const requestHeaders = new Headers(headers);

  if (!requestHeaders.has("Content-Type") && rest.body) {
    requestHeaders.set("Content-Type", "application/json");
  }

  if (token) {
    requestHeaders.set("Authorization", `Bearer ${token}`);
  }

  if (!requestHeaders.has(DESKTOP_CLIENT_HEADER)) {
    requestHeaders.set(DESKTOP_CLIENT_HEADER, DESKTOP_CLIENT_ID);
  }

  const url = `${apiBaseUrl}${path}`;

  let response: Response;
  try {
    response = await performFetch(url, rest.method ?? "GET", requestHeaders, rest.body ?? null);
  } catch (error) {
    const detail =
      error instanceof Error ? error.message : typeof error === "string" ? error : undefined;
    throw new NetworkError(apiBaseUrl, detail);
  }

  const rawBody = await response.text();
  let data = {} as T & { error?: string; message?: string };
  try {
    data = rawBody ? (JSON.parse(rawBody) as T & { error?: string; message?: string }) : data;
  } catch {
    if (!response.ok) {
      throw new ApiError(
        `Servidor respondeu com erro ${response.status}. Confira a URL do site.`,
        response.status,
      );
    }
    throw new Error(
      "Resposta inválida do servidor. Use só o domínio (ex.: sitenovodjs.vercel.app) em Configurar servidor.",
    );
  }

  if (!response.ok) {
    const message = data.error ?? data.message ?? `Erro ${response.status} ao comunicar com o servidor.`;
    throw new ApiError(message, response.status, data);
  }

  return data;
}

export async function pingApi(apiBaseUrl?: string): Promise<{ ok: boolean; message: string }> {
  const base = normalizeApiBaseUrl(apiBaseUrl ?? getCachedApiBaseUrl());

  try {
    const response = await performFetch(`${base}/api/musicas/session`, "GET", new Headers());
    if (response.status >= 200 && response.status < 500) {
      return { ok: true, message: `Servidor respondeu em ${base}` };
    }
    return { ok: false, message: `Servidor respondeu com erro ${response.status} em ${base}.` };
  } catch (error) {
    const detail = error instanceof Error ? error.message : "erro de rede";
    return { ok: false, message: `Sem resposta em ${base}. ${detail}` };
  }
}

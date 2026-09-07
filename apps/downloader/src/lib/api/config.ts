export const DEFAULT_API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000";
export const DEFAULT_BP_SITE_URL =
  import.meta.env.VITE_BP_SITE_URL ?? `${DEFAULT_API_BASE_URL.replace(/\/+$/, "")}/musicas/atualizacoes`;
export const APP_VERSION = import.meta.env.VITE_APP_VERSION ?? "1.0.3_public_beta";
export const DESKTOP_CLIENT_HEADER = "X-BP-Client";
export const DESKTOP_CLIENT_ID = "downloader";

const APEX_HOST = "brazilianremixservice.com.br";
const CANONICAL_HOST = "www.brazilianremixservice.com.br";

let resolvedApiBaseUrl: string | null = null;

/**
 * Aceita domínio, URL completa ou link /musicas/... — retorna origem https://host.
 * Reescreve apex → www (o 308 da Vercel remove Authorization e quebra a sessão).
 */
export function normalizeApiBaseUrl(value: string) {
  let trimmed = value.trim();
  if (!trimmed) return DEFAULT_API_BASE_URL;

  trimmed = trimmed.replace(/\/+$/, "");

  if (/^\/\//.test(trimmed)) {
    trimmed = `https:${trimmed}`;
  } else if (!/^https?:\/\//i.test(trimmed)) {
    trimmed = `https://${trimmed}`;
  }

  try {
    const parsed = new URL(trimmed.includes("://") ? trimmed : `https://${trimmed}`);
    if (parsed.hostname.toLowerCase() === APEX_HOST) {
      parsed.hostname = CANONICAL_HOST;
    }
    return `${parsed.protocol}//${parsed.host}`;
  } catch {
    return trimmed.replace(/\/+$/, "");
  }
}

export function getCachedApiBaseUrl() {
  return resolvedApiBaseUrl ?? DEFAULT_API_BASE_URL;
}

export function setCachedApiBaseUrl(value: string | null) {
  resolvedApiBaseUrl = value ? normalizeApiBaseUrl(value) : null;
}

function isLocalhostUrl(value: string) {
  return /localhost|127\.0\.0\.1/i.test(value);
}

export async function resolveApiBaseUrl(): Promise<string> {
  if (resolvedApiBaseUrl) return resolvedApiBaseUrl;

  try {
    const { getAppPreferences, setAppPreferences } = await import("../native/app-preferences");
    const prefs = await getAppPreferences();
    const override = prefs.apiBaseUrl?.trim();
    const normalizedOverride = override ? normalizeApiBaseUrl(override) : null;
    const savedLocal =
      normalizedOverride &&
      isLocalhostUrl(normalizedOverride) &&
      !isLocalhostUrl(DEFAULT_API_BASE_URL);

    resolvedApiBaseUrl =
      normalizedOverride && !savedLocal ? normalizedOverride : normalizeApiBaseUrl(DEFAULT_API_BASE_URL);

    // Persist rewrite apex → www so a sessão não quebra no próximo boot.
    if (override && normalizedOverride && normalizedOverride !== override && !savedLocal) {
      await setAppPreferences({ ...prefs, apiBaseUrl: normalizedOverride }).catch(() => undefined);
    }
  } catch {
    resolvedApiBaseUrl = normalizeApiBaseUrl(DEFAULT_API_BASE_URL);
  }

  return resolvedApiBaseUrl;
}

/** @deprecated use resolveApiBaseUrl() */
export const API_BASE_URL = DEFAULT_API_BASE_URL;

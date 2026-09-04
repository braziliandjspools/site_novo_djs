export const DEFAULT_API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000";
export const DEFAULT_BP_SITE_URL =
  import.meta.env.VITE_BP_SITE_URL ?? `${DEFAULT_API_BASE_URL.replace(/\/+$/, "")}/musicas/atualizacoes`;
export const APP_VERSION = import.meta.env.VITE_APP_VERSION ?? "0.3.0";
export const DESKTOP_CLIENT_HEADER = "X-BP-Client";
export const DESKTOP_CLIENT_ID = "downloader";

let resolvedApiBaseUrl: string | null = null;

/** Aceita domínio, URL completa ou link /musicas/... — retorna origem https://host */
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
    const { getAppPreferences } = await import("../native/app-preferences");
    const prefs = await getAppPreferences();
    const override = prefs.apiBaseUrl?.trim();
    const normalizedOverride = override ? normalizeApiBaseUrl(override) : null;
    const savedLocal =
      normalizedOverride &&
      isLocalhostUrl(normalizedOverride) &&
      !isLocalhostUrl(DEFAULT_API_BASE_URL);

    resolvedApiBaseUrl =
      normalizedOverride && !savedLocal ? normalizedOverride : DEFAULT_API_BASE_URL;
  } catch {
    resolvedApiBaseUrl = DEFAULT_API_BASE_URL;
  }

  return resolvedApiBaseUrl;
}

/** @deprecated use resolveApiBaseUrl() */
export const API_BASE_URL = DEFAULT_API_BASE_URL;

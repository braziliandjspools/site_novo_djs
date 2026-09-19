import "server-only";
import { SITE_PRODUCTION_URL } from "../branding";
import {
  isUnsafeMercadoPagoCheckoutHost,
  resolveMercadoPagoCheckoutSiteUrl,
} from "./preference-policy";

export type MercadoPagoMode = "test" | "production";

export type MercadoPagoEnv = {
  accessToken: string;
  webhookSecret: string;
  mode: MercadoPagoMode;
  siteUrl: string;
  /** Opcional — se definido, o webhook exige collector_id igual no pagamento. */
  collectorId: number | null;
};

export type MercadoPagoEnvDiagnostic = {
  ok: boolean;
  mode: MercadoPagoMode | null;
  siteUrlHost: string | null;
  /** Host configurado na env antes do fallback de produção (se houver). */
  configuredSiteUrlHost: string | null;
  /** Quais chaves estão presentes (nunca valores). */
  present: {
    accessToken: boolean;
    webhookSecret: boolean;
    mode: boolean;
    siteUrl: boolean;
    collectorId: boolean;
  };
  /** Problemas seguros para UI/logs (sem secrets). */
  issues: string[];
};

const ACCESS_TOKEN_KEY = "MERCADO_PAGO_ACCESS_TOKEN";
const WEBHOOK_SECRET_KEY = "MERCADO_PAGO_WEBHOOK_SECRET";
const MODE_KEY = "MERCADO_PAGO_MODE";
const SITE_URL_KEYS = ["NEXT_PUBLIC_SITE_URL", "SITE_URL", "MERCADO_PAGO_SITE_URL"] as const;

/** Remove aspas, BOM e espaços — comum ao colar na Vercel. */
function readTrimmed(name: string): string {
  const raw = process.env[name];
  if (raw == null) return "";
  return raw
    .replace(/^\uFEFF/, "")
    .trim()
    .replace(/^["']|["']$/g, "")
    .trim();
}

function readFirstPresent(keys: readonly string[]): { key: string; value: string } | null {
  for (const key of keys) {
    const value = readTrimmed(key);
    if (value) return { key, value };
  }
  return null;
}

function assertNoPublicSecretLeak() {
  const forbiddenPublicKeys = [
    "NEXT_PUBLIC_MERCADO_PAGO_ACCESS_TOKEN",
    "NEXT_PUBLIC_MERCADO_PAGO_WEBHOOK_SECRET",
    "NEXT_PUBLIC_MERCADO_PAGO_CLIENT_SECRET",
  ] as const;

  for (const key of forbiddenPublicKeys) {
    if (readTrimmed(key)) {
      throw new Error(
        `[Mercado Pago] Remova ${key}. Access Token e Webhook Secret nunca podem usar o prefixo NEXT_PUBLIC_.`,
      );
    }
  }
}

function parseMode(raw: string): MercadoPagoMode {
  const normalized = raw.trim().toLowerCase();
  if (normalized === "test" || normalized === "production") return normalized;
  throw new Error(
    `[Mercado Pago] ${MODE_KEY} deve ser exatamente "test" ou "production" (sem aspas).`,
  );
}

function requireEnv(name: string): string {
  const value = readTrimmed(name);
  if (!value) {
    throw new Error(`[Mercado Pago] Variável de ambiente obrigatória ausente: ${name}`);
  }
  return value;
}

function peekConfiguredSiteHost(): string | null {
  const found = readFirstPresent(SITE_URL_KEYS);
  if (!found) return null;
  try {
    let value = found.value.replace(/\/+$/, "");
    if (!/^https?:\/\//i.test(value)) {
      value = `https://${value.replace(/^\/+/, "")}`;
    } else if (/^http:\/\//i.test(value)) {
      value = `https://${value.slice("http://".length)}`;
    }
    return new URL(value).hostname;
  } catch {
    return null;
  }
}

function resolveSiteUrl(mode: MercadoPagoMode): string {
  const found = readFirstPresent(SITE_URL_KEYS);
  try {
    const siteUrl = resolveMercadoPagoCheckoutSiteUrl({
      mode,
      configuredUrl: found?.value ?? null,
      fallbackUrl: SITE_PRODUCTION_URL,
    });
    const configuredHost = peekConfiguredSiteHost();
    if (
      mode === "production" &&
      configuredHost &&
      isUnsafeMercadoPagoCheckoutHost(configuredHost)
    ) {
      console.warn(
        `[Mercado Pago] ${found?.key} aponta para ${configuredHost}; back_urls usando ${SITE_PRODUCTION_URL}`,
      );
    } else if (mode === "production" && !found) {
      console.warn(
        `[Mercado Pago] SITE_URL ausente; back_urls usando ${SITE_PRODUCTION_URL}`,
      );
    }
    return siteUrl;
  } catch (err) {
    const message = err instanceof Error ? err.message : "SITE_URL inválida.";
    throw new Error(`[Mercado Pago] ${message}`);
  }
}

/**
 * Diagnóstico seguro — só booleanos e códigos, nunca tokens.
 */
export function diagnoseMercadoPagoEnv(): MercadoPagoEnvDiagnostic {
  const issues: string[] = [];
  const accessToken = readTrimmed(ACCESS_TOKEN_KEY);
  const webhookSecret = readTrimmed(WEBHOOK_SECRET_KEY);
  const modeRaw = readTrimmed(MODE_KEY);
  const site = readFirstPresent(SITE_URL_KEYS);
  const collectorRaw = readTrimmed("MERCADO_PAGO_COLLECTOR_ID");

  const present = {
    accessToken: Boolean(accessToken),
    webhookSecret: Boolean(webhookSecret),
    mode: Boolean(modeRaw),
    siteUrl: Boolean(site?.value),
    collectorId: Boolean(collectorRaw),
  };

  for (const key of [
    "NEXT_PUBLIC_MERCADO_PAGO_ACCESS_TOKEN",
    "NEXT_PUBLIC_MERCADO_PAGO_WEBHOOK_SECRET",
    "NEXT_PUBLIC_MERCADO_PAGO_CLIENT_SECRET",
  ] as const) {
    if (readTrimmed(key)) {
      issues.push(`remove_${key}`);
    }
  }

  if (!present.accessToken) issues.push("missing_MERCADO_PAGO_ACCESS_TOKEN");
  if (!present.webhookSecret) issues.push("missing_MERCADO_PAGO_WEBHOOK_SECRET");
  if (!present.mode) issues.push("missing_MERCADO_PAGO_MODE");

  let mode: MercadoPagoMode | null = null;
  if (modeRaw) {
    try {
      mode = parseMode(modeRaw);
    } catch {
      issues.push("invalid_MERCADO_PAGO_MODE");
    }
  }

  if (!present.siteUrl && mode !== "production") {
    issues.push("missing_NEXT_PUBLIC_SITE_URL");
  }

  const configuredSiteUrlHost = peekConfiguredSiteHost();
  let siteUrlHost: string | null = null;

  if (configuredSiteUrlHost && isUnsafeMercadoPagoCheckoutHost(configuredSiteUrlHost)) {
    if (mode === "production") {
      issues.push("site_url_localhost_overridden");
      siteUrlHost = new URL(SITE_PRODUCTION_URL).host;
    } else {
      issues.push("site_url_localhost");
    }
  } else if (site?.value) {
    try {
      const resolved = resolveMercadoPagoCheckoutSiteUrl({
        mode: mode ?? "test",
        configuredUrl: site.value,
        fallbackUrl: SITE_PRODUCTION_URL,
      });
      siteUrlHost = new URL(resolved).host;
    } catch {
      issues.push("invalid_site_url");
    }
  } else if (mode === "production") {
    siteUrlHost = new URL(SITE_PRODUCTION_URL).host;
  }

  if (accessToken && mode === "production" && accessToken.startsWith("TEST-")) {
    issues.push("test_token_with_production_mode");
  }
  if (accessToken && mode === "test" && accessToken.startsWith("APP_USR-")) {
    issues.push("production_token_with_test_mode");
  }

  if (collectorRaw) {
    const parsed = Number(collectorRaw);
    if (!Number.isInteger(parsed) || parsed <= 0) {
      issues.push("invalid_MERCADO_PAGO_COLLECTOR_ID");
    }
  }

  const blockingIssues = issues.filter(
    (issue) => issue !== "site_url_localhost_overridden",
  );

  return {
    ok:
      blockingIssues.length === 0 &&
      present.accessToken &&
      present.webhookSecret &&
      present.mode &&
      (present.siteUrl || mode === "production"),
    mode,
    siteUrlHost,
    configuredSiteUrlHost,
    present,
    issues,
  };
}

/**
 * Validação centralizada das envs do Mercado Pago (somente servidor).
 */
export function getMercadoPagoEnv(): MercadoPagoEnv {
  assertNoPublicSecretLeak();

  const accessToken = requireEnv(ACCESS_TOKEN_KEY);
  const webhookSecret = requireEnv(WEBHOOK_SECRET_KEY);
  const mode = parseMode(requireEnv(MODE_KEY));
  const siteUrl = resolveSiteUrl(mode);

  let collectorId: number | null = null;
  const rawCollector = readTrimmed("MERCADO_PAGO_COLLECTOR_ID");
  if (rawCollector) {
    const parsed = Number(rawCollector);
    if (!Number.isInteger(parsed) || parsed <= 0) {
      throw new Error("[Mercado Pago] MERCADO_PAGO_COLLECTOR_ID inválido.");
    }
    collectorId = parsed;
  } else if (mode === "production") {
    console.warn(
      "[Mercado Pago] MERCADO_PAGO_COLLECTOR_ID não definido — webhook não validará collector_id.",
    );
  }

  if (mode === "production" && accessToken.startsWith("TEST-")) {
    throw new Error(
      "[Mercado Pago] Access Token de teste (TEST-...) com MERCADO_PAGO_MODE=production. Use as credenciais de produção.",
    );
  }

  return {
    accessToken,
    webhookSecret,
    mode,
    siteUrl,
    collectorId,
  };
}

export function getMercadoPagoMode(): MercadoPagoMode {
  return getMercadoPagoEnv().mode;
}

export function isMercadoPagoTestMode(): boolean {
  return getMercadoPagoMode() === "test";
}

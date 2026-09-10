import "server-only";

export type MercadoPagoMode = "test" | "production";

export type MercadoPagoEnv = {
  accessToken: string;
  webhookSecret: string;
  mode: MercadoPagoMode;
  siteUrl: string;
  /** Opcional — se definido, o webhook exige collector_id igual no pagamento. */
  collectorId: number | null;
};

const ACCESS_TOKEN_KEY = "MERCADO_PAGO_ACCESS_TOKEN";
const WEBHOOK_SECRET_KEY = "MERCADO_PAGO_WEBHOOK_SECRET";
const MODE_KEY = "MERCADO_PAGO_MODE";
const SITE_URL_KEY = "NEXT_PUBLIC_SITE_URL";

function readTrimmed(name: string): string {
  return process.env[name]?.trim() ?? "";
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
  if (raw === "test" || raw === "production") return raw;
  throw new Error(
    `[Mercado Pago] ${MODE_KEY} deve ser exatamente "test" ou "production". Valor recebido: ${raw ? JSON.stringify(raw) : "(vazio)"}.`,
  );
}

function requireEnv(name: string): string {
  const value = readTrimmed(name);
  if (!value) {
    throw new Error(`[Mercado Pago] Variável de ambiente obrigatória ausente: ${name}`);
  }
  return value;
}

/**
 * Validação centralizada das envs do Mercado Pago (somente servidor).
 * Não cria preferência nem chama a API — apenas lê e valida configuração.
 */
export function getMercadoPagoEnv(): MercadoPagoEnv {
  assertNoPublicSecretLeak();

  const accessToken = requireEnv(ACCESS_TOKEN_KEY);
  const webhookSecret = requireEnv(WEBHOOK_SECRET_KEY);
  const mode = parseMode(requireEnv(MODE_KEY));
  const siteUrl = requireEnv(SITE_URL_KEY).replace(/\/$/, "");

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

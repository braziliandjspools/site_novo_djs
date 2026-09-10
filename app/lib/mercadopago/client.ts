import "server-only";
import { MercadoPagoConfig } from "mercadopago";
import { getMercadoPagoEnv } from "./env";

let cachedConfig: MercadoPagoConfig | null = null;
let cachedToken: string | null = null;

/**
 * Cliente oficial Mercado Pago (Checkout Pro / Preferences).
 * Usa exclusivamente `process.env.MERCADO_PAGO_ACCESS_TOKEN`.
 * Não cria preferências nem processa webhooks — só inicializa o SDK.
 */
export function getMercadoPagoConfig(): MercadoPagoConfig {
  const { accessToken } = getMercadoPagoEnv();

  if (cachedConfig && cachedToken === accessToken) {
    return cachedConfig;
  }

  cachedConfig = new MercadoPagoConfig({
    accessToken,
    options: {
      timeout: 10_000,
    },
  });
  cachedToken = accessToken;
  return cachedConfig;
}

/** Alias semântico para o config do SDK. */
export function getMercadoPagoClient(): MercadoPagoConfig {
  return getMercadoPagoConfig();
}

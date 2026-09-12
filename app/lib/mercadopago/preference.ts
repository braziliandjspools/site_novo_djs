import "server-only";
import { randomUUID } from "crypto";
import { Preference } from "mercadopago";
import type { CanonicalPlan } from "../billing/plan-catalog";
import { getMercadoPagoConfig } from "./client";
import { getMercadoPagoEnv } from "./env";
import {
  attachMercadoPagoPreferenceId,
  createPendingMercadoPagoOrder,
  markMercadoPagoOrderPreferenceFailed,
} from "./orders";
import {
  buildMercadoPagoPreferenceBody,
  resolveCheckoutUrl,
  sanitizeMercadoPagoErrorMessage,
  type PreferencePayer,
} from "./preference-policy";

export type PreferenceCheckoutResult = {
  checkoutUrl: string;
  orderId: string;
};

export {
  buildMercadoPagoPreferenceBody,
  MERCADO_PAGO_NOTIFICATION_URL,
  resolveCheckoutUrl,
  sanitizeMercadoPagoErrorMessage,
  type MercadoPagoPreferenceBody,
  type PreferencePayer,
} from "./preference-policy";

/**
 * Cria pedido PENDING no Postgres e Preference no Mercado Pago.
 * Em falha da Preference, marca o pedido como CANCELLED.
 */
export async function createMercadoPagoCheckoutPreference(input: {
  plan: CanonicalPlan;
  payer: PreferencePayer;
}): Promise<PreferenceCheckoutResult> {
  const env = getMercadoPagoEnv();

  const order = await createPendingMercadoPagoOrder({
    portalUserId: input.payer.id,
    planId: input.plan.id,
    amount: input.plan.amountBrl,
    payerEmail: input.payer.email,
  });

  const body = buildMercadoPagoPreferenceBody({
    plan: input.plan,
    externalReference: order.externalReference,
    siteUrl: env.siteUrl,
    payer: input.payer,
  });

  const idempotencyKey = randomUUID();

  try {
    const preferenceClient = new Preference(getMercadoPagoConfig());
    const preference = await preferenceClient.create({
      body,
      requestOptions: { idempotencyKey },
    });

    const preferenceId = preference.id?.trim();
    if (!preferenceId) {
      throw new Error("Mercado Pago não retornou preference.id.");
    }

    await attachMercadoPagoPreferenceId(order.id, preferenceId);

    const checkoutUrl = resolveCheckoutUrl({
      mode: env.mode,
      initPoint: preference.init_point,
      sandboxInitPoint: preference.sandbox_init_point,
    });

    if (!checkoutUrl) {
      throw new Error(
        env.mode === "test"
          ? "Mercado Pago não retornou sandbox_init_point."
          : "Mercado Pago não retornou init_point.",
      );
    }

    return { checkoutUrl, orderId: order.id };
  } catch (err) {
    try {
      await markMercadoPagoOrderPreferenceFailed(order.id);
    } catch (markErr) {
      console.error(
        "[mercadopago/preference] falha ao marcar pedido após erro:",
        sanitizeMercadoPagoErrorMessage(markErr),
      );
    }
    console.error(
      "[mercadopago/preference] create failed:",
      sanitizeMercadoPagoErrorMessage(err),
    );
    throw err;
  }
}

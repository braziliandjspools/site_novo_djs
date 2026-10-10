import "server-only";
import { randomUUID } from "crypto";
import { Preference } from "mercadopago";
import type { CanonicalPlan } from "../billing/plan-catalog";
import { getMercadoPagoConfig } from "./client";
import { getMercadoPagoEnv } from "./env";
import { applyWalletFundedOrder } from "./process-webhook";
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
  checkoutUrl: string | null;
  orderId: string;
  paidWithBalance?: boolean;
};

export {
  buildMercadoPagoPreferenceBody,
  MERCADO_PAGO_NOTIFICATION_URL,
  resolveCheckoutUrl,
  resolveMercadoPagoCheckoutSiteUrl,
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
  checkoutKind?: "new" | "renewal" | "plan_change";
  creditBrl?: string;
  catalogAmountBrl?: string;
  previousDueAt?: Date;
  walletAppliedAmountBrl?: string;
}): Promise<PreferenceCheckoutResult> {
  const env = getMercadoPagoEnv();

  const order = await createPendingMercadoPagoOrder({
    portalUserId: input.payer.id,
    planId: input.plan.id,
    amount: input.walletAppliedAmountBrl
      ? (Number(input.plan.amountBrl) - Number(input.walletAppliedAmountBrl)).toFixed(2)
      : input.plan.amountBrl,
    walletAppliedAmount: input.walletAppliedAmountBrl ?? "0.00",
    payerEmail: input.payer.email,
  });

  const paymentAmountBrl = input.walletAppliedAmountBrl
    ? (Math.round(Number(input.plan.amountBrl) * 100) - Math.round(Number(input.walletAppliedAmountBrl) * 100)) / 100
    : Number(input.plan.amountBrl);

  if (paymentAmountBrl <= 0) {
    try {
      const result = await applyWalletFundedOrder(order.id);
      if (!result.applied) throw new Error("Não foi possível concluir a compra com saldo.");
      return { checkoutUrl: null, orderId: order.id, paidWithBalance: true };
    } catch (error) {
      await markMercadoPagoOrderPreferenceFailed(order.id);
      throw error;
    }
  }

  const idempotencyKey = randomUUID();

  try {
    const body = buildMercadoPagoPreferenceBody({
      plan: input.plan,
      externalReference: order.externalReference,
      siteUrl: env.siteUrl,
      payer: input.payer,
      checkoutKind: input.checkoutKind,
      creditBrl: input.creditBrl,
      catalogAmountBrl: input.catalogAmountBrl,
      previousDueAt: input.previousDueAt,
      paymentAmountBrl: input.walletAppliedAmountBrl ? paymentAmountBrl.toFixed(2) : undefined,
    });
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

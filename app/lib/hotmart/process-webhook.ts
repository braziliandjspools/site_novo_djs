import type { HotmartSubscriptionStatus, Prisma } from "@prisma/client";
import { prisma } from "../prisma";
import { updatePortalUser, type PortalUser } from "../portal-users";
import { resolveInternalPlan, HOTMART_PROVIDER } from "./config";
import { sendHotmartAccessGrantedEmail, sendHotmartPendingAccountEmail } from "./email";
import { shouldReactivateAfterRevocation } from "./access-policy";
import {
  extractBuyerEmail,
  extractBuyerName,
  extractExternalUserId,
  extractOfferCode,
  extractProductId,
  extractSubscriberCode,
  extractTransactionId,
  isActivationEvent,
  isCancellationEvent,
  isChargebackEvent,
  isIgnoredPurchaseEvent,
  isRefundEvent,
  parseHotmartPayload,
  resolvePeriodEnd,
  type HotmartWebhookPayload,
  HOTMART_EVENTS,
} from "./types";

export type ProcessHotmartResult = {
  ok: boolean;
  status: number;
  code:
    | "processed"
    | "duplicate"
    | "ignored"
    | "unknown_product"
    | "invalid_payload"
    | "error";
  message?: string;
};

function logHotmart(message: string) {
  console.info(`[Hotmart] ${message}`);
}

async function findUserForPurchase(payload: HotmartWebhookPayload): Promise<PortalUser | null> {
  const externalId = extractExternalUserId(payload);
  if (externalId) {
    const byId = await prisma.portalUser.findUnique({ where: { id: externalId } });
    if (byId) {
      logHotmart("usuário identificado");
      return {
        id: byId.id,
        name: byId.name,
        email: byId.email,
        whatsapp: byId.whatsapp,
        plan: byId.plan,
        services: {
          poolsVip: byId.servicePoolsVip,
          deemix: byId.serviceDeemix,
          allavsoft: byId.serviceAllavsoft,
        },
        monthlyValue: Number(byId.monthlyValue),
        nextDueAt: byId.nextDueAt,
        active: byId.active,
        musicProducerDeliveriesEnabled: byId.musicProducerDeliveriesEnabled,
        createdAt: byId.createdAt,
        updatedAt: byId.updatedAt,
      };
    }
  }

  const email = extractBuyerEmail(payload);
  if (!email) return null;

  const byEmail = await prisma.portalUser.findUnique({ where: { email } });
  if (byEmail) {
    logHotmart("usuário identificado");
    return {
      id: byEmail.id,
      name: byEmail.name,
      email: byEmail.email,
      whatsapp: byEmail.whatsapp,
      plan: byEmail.plan,
      services: {
        poolsVip: byEmail.servicePoolsVip,
        deemix: byEmail.serviceDeemix,
        allavsoft: byEmail.serviceAllavsoft,
      },
      monthlyValue: Number(byEmail.monthlyValue),
      nextDueAt: byEmail.nextDueAt,
      active: byEmail.active,
      musicProducerDeliveriesEnabled: byEmail.musicProducerDeliveriesEnabled,
      createdAt: byEmail.createdAt,
      updatedAt: byEmail.updatedAt,
    };
  }

  return null;
}

async function grantPoolsAccess(userId: number, monthlyValue: number, periodEnd: Date) {
  const user = await prisma.portalUser.findUnique({ where: { id: userId } });
  if (!user) return;
  await updatePortalUser(userId, {
    services: {
      poolsVip: true,
      deemix: user.serviceDeemix,
      allavsoft: user.serviceAllavsoft,
    },
    monthlyValue,
    nextDueAt: periodEnd.toISOString().slice(0, 10),
    active: true,
  });
}

async function revokePoolsAccess(userId: number) {
  const user = await prisma.portalUser.findUnique({ where: { id: userId } });
  if (!user) return;
  await updatePortalUser(userId, {
    services: {
      poolsVip: false,
      deemix: user.serviceDeemix,
      allavsoft: user.serviceAllavsoft,
    },
    nextDueAt: new Date().toISOString().slice(0, 10),
  });
}

function isTerminalRevokedStatus(status: HotmartSubscriptionStatus) {
  return status === "REFUNDED" || status === "CHARGEBACK";
}

async function upsertSubscription(input: {
  portalUserId: number;
  planId: string;
  status: HotmartSubscriptionStatus;
  productId?: string;
  offerId?: string;
  transactionId?: string;
  subscriberCode?: string;
  startedAt?: Date | null;
  currentPeriodEnd?: Date | null;
  canceledAt?: Date | null;
  refundedAt?: Date | null;
  lastPaymentAt?: Date | null;
  accessRevokedAt?: Date | null;
}) {
  const existingBySub =
    input.subscriberCode
      ? await prisma.hotmartSubscription.findUnique({
          where: { providerSubscriptionId: input.subscriberCode },
        })
      : null;

  const existingByUser =
    existingBySub ??
    (await prisma.hotmartSubscription.findFirst({
      where: { portalUserId: input.portalUserId, planId: input.planId },
      orderBy: { updatedAt: "desc" },
    }));

  const data: Prisma.HotmartSubscriptionUpdateInput = {
    status: input.status,
    provider: HOTMART_PROVIDER,
    planId: input.planId,
    providerProductId: input.productId || undefined,
    providerOfferId: input.offerId || undefined,
    providerTransactionId: input.transactionId || undefined,
    providerCustomerId: input.subscriberCode || undefined,
    providerSubscriptionId: input.subscriberCode || undefined,
    startedAt: input.startedAt ?? undefined,
    currentPeriodEnd: input.currentPeriodEnd ?? undefined,
    canceledAt: input.canceledAt === undefined ? undefined : input.canceledAt,
    refundedAt: input.refundedAt === undefined ? undefined : input.refundedAt,
    lastPaymentAt: input.lastPaymentAt ?? undefined,
    accessRevokedAt: input.accessRevokedAt === undefined ? undefined : input.accessRevokedAt,
  };

  if (existingByUser) {
    if (
      isTerminalRevokedStatus(existingByUser.status) &&
      input.status === "ACTIVE" &&
      input.transactionId &&
      existingByUser.providerTransactionId === input.transactionId
    ) {
      return existingByUser;
    }

    return prisma.hotmartSubscription.update({
      where: { id: existingByUser.id },
      data,
    });
  }

  return prisma.hotmartSubscription.create({
    data: {
      portalUserId: input.portalUserId,
      planId: input.planId,
      status: input.status,
      provider: HOTMART_PROVIDER,
      providerProductId: input.productId || null,
      providerOfferId: input.offerId || null,
      providerTransactionId: input.transactionId || null,
      providerCustomerId: input.subscriberCode || null,
      providerSubscriptionId: input.subscriberCode || null,
      startedAt: input.startedAt ?? new Date(),
      currentPeriodEnd: input.currentPeriodEnd ?? null,
      canceledAt: input.canceledAt ?? null,
      refundedAt: input.refundedAt ?? null,
      lastPaymentAt: input.lastPaymentAt ?? null,
      accessRevokedAt: input.accessRevokedAt ?? null,
    },
  });
}

async function maybeSendActivationEmail(subscriptionId: string, user: PortalUser, planId: string) {
  const sub = await prisma.hotmartSubscription.findUnique({ where: { id: subscriptionId } });
  if (!sub || sub.activationEmailSentAt) return;

  const result = await sendHotmartAccessGrantedEmail({
    to: user.email,
    name: user.name,
    planId,
  });

  if (result.sent) {
    await prisma.hotmartSubscription.update({
      where: { id: subscriptionId },
      data: { activationEmailSentAt: new Date() },
    });
  }
}

async function handleActivation(payload: HotmartWebhookPayload): Promise<ProcessHotmartResult> {
  const mapping = resolveInternalPlan({
    productId: extractProductId(payload),
    offerCode: extractOfferCode(payload),
  });

  if (!mapping) {
    logHotmart("produto não reconhecido");
    return { ok: true, status: 200, code: "unknown_product", message: "Produto não mapeado." };
  }

  const periodEnd = resolvePeriodEnd(payload);
  const transactionId = extractTransactionId(payload);
  const subscriberCode = extractSubscriberCode(payload);
  const productId = extractProductId(payload);
  const offerCode = extractOfferCode(payload);
  const approvedAt = payload.data?.purchase?.approved_date
    ? new Date(payload.data.purchase.approved_date)
    : new Date();

  const user = await findUserForPurchase(payload);

  if (!user) {
    const email = extractBuyerEmail(payload);
    if (!email) {
      return { ok: true, status: 200, code: "ignored", message: "Sem e-mail do comprador." };
    }

    await prisma.hotmartPendingPurchase.upsert({
      where: { providerTransactionId: transactionId || `pending-${payload.id}` },
      create: {
        email,
        buyerName: extractBuyerName(payload) || null,
        planId: mapping.planId,
        providerTransactionId: transactionId || `pending-${payload.id}`,
        providerSubscriptionId: subscriberCode || null,
        providerProductId: productId || null,
        providerOfferId: offerCode || null,
        currentPeriodEnd: periodEnd,
      },
      update: {
        email,
        buyerName: extractBuyerName(payload) || null,
        planId: mapping.planId,
        providerSubscriptionId: subscriberCode || null,
        currentPeriodEnd: periodEnd,
        claimedAt: null,
      },
    });

    await sendHotmartPendingAccountEmail({
      to: email,
      name: extractBuyerName(payload) || email,
      planId: mapping.planId,
    });

    logHotmart("compra pendente de associação de usuário");
    return { ok: true, status: 200, code: "processed" };
  }

  const existing = subscriberCode
    ? await prisma.hotmartSubscription.findUnique({
        where: { providerSubscriptionId: subscriberCode },
      })
    : await prisma.hotmartSubscription.findFirst({
        where: { portalUserId: user.id, planId: mapping.planId },
        orderBy: { updatedAt: "desc" },
      });

  if (existing && isTerminalRevokedStatus(existing.status)) {
    const canReactivate = shouldReactivateAfterRevocation({
      existingStatus: existing.status,
      existingTransactionId: existing.providerTransactionId,
      incomingTransactionId: transactionId,
    });
    if (!canReactivate) {
      logHotmart("ativação ignorada (reembolso/chargeback no mesmo transaction)");
      return { ok: true, status: 200, code: "ignored" };
    }
  }

  await grantPoolsAccess(user.id, mapping.monthlyValue, periodEnd);

  const isRenewal = (payload.data?.purchase?.recurrence_number ?? 1) > 1;
  const subscription = await upsertSubscription({
    portalUserId: user.id,
    planId: mapping.planId,
    status: "ACTIVE",
    productId,
    offerId: offerCode,
    transactionId,
    subscriberCode,
    startedAt: existing?.startedAt ?? approvedAt,
    currentPeriodEnd: periodEnd,
    canceledAt: null,
    refundedAt: null,
    lastPaymentAt: approvedAt,
    accessRevokedAt: null,
  });

  if (isRenewal) {
    logHotmart("renovação processada");
  } else {
    logHotmart("plano ativado");
  }

  await maybeSendActivationEmail(subscription.id, user, mapping.planId);
  return { ok: true, status: 200, code: "processed" };
}

async function handleCancellation(payload: HotmartWebhookPayload): Promise<ProcessHotmartResult> {
  const mapping = resolveInternalPlan({
    productId: extractProductId(payload),
    offerCode: extractOfferCode(payload),
  });
  if (!mapping) {
    return { ok: true, status: 200, code: "unknown_product" };
  }

  const user = await findUserForPurchase(payload);
  const subscriberCode = extractSubscriberCode(payload);
  const periodEnd = resolvePeriodEnd(payload);

  if (!user) {
    return { ok: true, status: 200, code: "ignored", message: "Usuário não encontrado." };
  }

  await upsertSubscription({
    portalUserId: user.id,
    planId: mapping.planId,
    status: "CANCELED",
    productId: extractProductId(payload),
    offerId: extractOfferCode(payload),
    transactionId: extractTransactionId(payload),
    subscriberCode,
    currentPeriodEnd: periodEnd,
    canceledAt: new Date(),
  });

  // Mantém acesso até o fim do período pago (nextDueAt / currentPeriodEnd).
  await updatePortalUser(user.id, {
    nextDueAt: periodEnd.toISOString().slice(0, 10),
  });

  logHotmart("plano cancelado");
  return { ok: true, status: 200, code: "processed" };
}

async function handleRevocation(
  payload: HotmartWebhookPayload,
  status: "REFUNDED" | "CHARGEBACK",
): Promise<ProcessHotmartResult> {
  const mapping = resolveInternalPlan({
    productId: extractProductId(payload),
    offerCode: extractOfferCode(payload),
  });
  if (!mapping) {
    return { ok: true, status: 200, code: "unknown_product" };
  }

  const user = await findUserForPurchase(payload);
  if (!user) {
    return { ok: true, status: 200, code: "ignored" };
  }

  await revokePoolsAccess(user.id);
  await upsertSubscription({
    portalUserId: user.id,
    planId: mapping.planId,
    status,
    productId: extractProductId(payload),
    offerId: extractOfferCode(payload),
    transactionId: extractTransactionId(payload),
    subscriberCode: extractSubscriberCode(payload),
    refundedAt: status === "REFUNDED" ? new Date() : null,
    accessRevokedAt: new Date(),
    currentPeriodEnd: new Date(),
  });

  logHotmart(status === "REFUNDED" ? "reembolso processado" : "chargeback processado");
  return { ok: true, status: 200, code: "processed" };
}

async function handleChargeDateUpdate(payload: HotmartWebhookPayload): Promise<ProcessHotmartResult> {
  const mapping = resolveInternalPlan({
    productId: extractProductId(payload),
    offerCode: extractOfferCode(payload),
  });
  if (!mapping) return { ok: true, status: 200, code: "unknown_product" };

  const user = await findUserForPurchase(payload);
  if (!user) return { ok: true, status: 200, code: "ignored" };

  const periodEnd = resolvePeriodEnd(payload);
  await updatePortalUser(user.id, {
    nextDueAt: periodEnd.toISOString().slice(0, 10),
  });
  await upsertSubscription({
    portalUserId: user.id,
    planId: mapping.planId,
    status: "ACTIVE",
    productId: extractProductId(payload),
    offerId: extractOfferCode(payload),
    transactionId: extractTransactionId(payload),
    subscriberCode: extractSubscriberCode(payload),
    currentPeriodEnd: periodEnd,
  });

  logHotmart("renovação processada");
  return { ok: true, status: 200, code: "processed" };
}

export async function processHotmartWebhook(raw: unknown): Promise<ProcessHotmartResult> {
  const payload = parseHotmartPayload(raw);
  if (!payload?.id || !payload.event) {
    return { ok: false, status: 400, code: "invalid_payload" };
  }

  logHotmart("webhook recebido");

  const existing = await prisma.hotmartWebhookEvent.findUnique({
    where: { eventId: payload.id },
  });
  if (existing) {
    return { ok: true, status: 200, code: "duplicate" };
  }

  const event = payload.event;
  let result: ProcessHotmartResult;

  try {
    if (isActivationEvent(event)) {
      result = await handleActivation(payload);
    } else if (isRefundEvent(event)) {
      result = await handleRevocation(payload, "REFUNDED");
    } else if (isChargebackEvent(event)) {
      result = await handleRevocation(payload, "CHARGEBACK");
    } else if (isCancellationEvent(event)) {
      result = await handleCancellation(payload);
    } else if (event === HOTMART_EVENTS.UPDATE_SUBSCRIPTION_CHARGE_DATE) {
      result = await handleChargeDateUpdate(payload);
    } else if (event === HOTMART_EVENTS.PURCHASE_EXPIRED) {
      // Compra não paga expirou — sem liberação.
      result = { ok: true, status: 200, code: "ignored" };
    } else if (isIgnoredPurchaseEvent(event)) {
      result = { ok: true, status: 200, code: "ignored" };
    } else {
      result = { ok: true, status: 200, code: "ignored", message: "Evento não tratado." };
    }

    await prisma.hotmartWebhookEvent.create({
      data: {
        eventId: payload.id,
        event,
        transactionId: extractTransactionId(payload) || null,
        result: result.code,
      },
    });

    logHotmart("evento validado");
    return result;
  } catch {
    console.error("[Hotmart] erro ao processar webhook");
    return { ok: false, status: 500, code: "error" };
  }
}

/** Associa compras pendentes ao usuário recém-cadastrado (mesmo e-mail). */
export async function claimPendingHotmartPurchasesForUser(user: PortalUser) {
  const pending = await prisma.hotmartPendingPurchase.findMany({
    where: { email: user.email.toLowerCase(), claimedAt: null },
    orderBy: { createdAt: "asc" },
  });

  for (const purchase of pending) {
    const mapping = resolveInternalPlan({
      productId: purchase.providerProductId,
      offerCode: purchase.providerOfferId,
    });
    if (!mapping && purchase.planId !== "drive-monthly") continue;

    const planId = mapping?.planId ?? purchase.planId;
    const monthlyValue = mapping?.monthlyValue ?? 50;
    const periodEnd = purchase.currentPeriodEnd ?? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    await grantPoolsAccess(user.id, monthlyValue, periodEnd);
    const subscription = await upsertSubscription({
      portalUserId: user.id,
      planId,
      status: "ACTIVE",
      productId: purchase.providerProductId ?? undefined,
      offerId: purchase.providerOfferId ?? undefined,
      transactionId: purchase.providerTransactionId,
      subscriberCode: purchase.providerSubscriptionId ?? undefined,
      startedAt: purchase.createdAt,
      currentPeriodEnd: periodEnd,
      lastPaymentAt: purchase.createdAt,
      canceledAt: null,
      refundedAt: null,
      accessRevokedAt: null,
    });

    await prisma.hotmartPendingPurchase.update({
      where: { id: purchase.id },
      data: { claimedAt: new Date() },
    });

    await maybeSendActivationEmail(subscription.id, user, planId);
    logHotmart("plano ativado");
  }
}

export async function getActiveHotmartSubscriptionForUser(portalUserId: number) {
  return prisma.hotmartSubscription.findFirst({
    where: {
      portalUserId,
      status: { in: ["ACTIVE", "CANCELED", "PAST_DUE"] },
    },
    orderBy: { updatedAt: "desc" },
  });
}

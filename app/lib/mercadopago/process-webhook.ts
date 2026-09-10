import "server-only";
import {
  InvalidWebhookSignatureError,
  Payment,
  WebhookSignatureValidator,
} from "mercadopago";
import { Prisma, type MercadoPagoOrderStatus } from "@prisma/client";
import { getCanonicalPlanById, isAllavsoftPlanId, isDeemixPlanId, isPoolsVipPlanId } from "../billing/plan-catalog";
import { toDateInputValue } from "../due-queue";
import { prisma } from "../prisma";
import { deriveLegacyPlan } from "../portal-users";
import { getMercadoPagoConfig } from "./client";
import { sendMercadoPagoAccessGrantedEmail, sendMercadoPagoRefundEmail } from "./email";
import { getMercadoPagoEnv } from "./env";
import { sanitizeMercadoPagoErrorMessage } from "./preference-policy";
import {
  computeVipAccessPeriodEnd,
  decideWebhookStatusTransition,
  describeMercadoPagoRefundReason,
  isPaymentWebhookEvent,
  mapPaymentStatusToOrderStatus,
  shouldGrantAccessForPaymentStatus,
  shouldRevokeAccessForPaymentStatus,
  shouldRevokeVipAfterOrderRefund,
  userHasActiveVipAccess,
  validatePaymentAgainstOrder,
  type MercadoPagoPaymentSnapshot,
} from "./webhook-policy";

export type ProcessMercadoPagoWebhookResult = {
  ok: boolean;
  /** HTTP sugerido (401 assinatura; 200 demais casos válidos/ignorados). */
  status: number;
  result:
    | "ignored_event"
    | "invalid_signature"
    | "missing_payment_id"
    | "payment_fetch_failed"
    | "validation_failed"
    | "duplicate"
    | "unchanged"
    | "conflict"
    | "stale"
    | "payment_taken"
    | "approved_access_granted"
    | "status_updated"
    | "access_revoked"
    | "pending_no_access"
    | "error";
  reason?: string;
};

function headerValue(headers: Headers, name: string): string | null {
  return headers.get(name);
}

function readQueryDataId(url: URL): string | null {
  return url.searchParams.get("data.id")?.trim() || url.searchParams.get("id")?.trim() || null;
}

/** data.id pode vir na query (IPN) ou no body JSON (Webhooks). */
function readPaymentDataId(url: URL, body: unknown): string | null {
  const fromQuery = readQueryDataId(url);
  if (fromQuery) return fromQuery;
  if (!body || typeof body !== "object") return null;
  const rec = body as Record<string, unknown>;
  const data = rec.data;
  if (data && typeof data === "object") {
    const id = (data as Record<string, unknown>).id;
    if (typeof id === "string" && id.trim()) return id.trim();
    if (typeof id === "number" && Number.isFinite(id)) return String(id);
  }
  if (typeof rec.id === "string" && /^\d+$/.test(rec.id.trim())) return rec.id.trim();
  return null;
}

function readEventType(url: URL, body: unknown): string | null {
  const fromQuery = url.searchParams.get("type")?.trim() || url.searchParams.get("topic")?.trim();
  if (fromQuery) return fromQuery;
  if (body && typeof body === "object") {
    const rec = body as Record<string, unknown>;
    if (typeof rec.type === "string") return rec.type;
    if (typeof rec.topic === "string") return rec.topic;
    if (typeof rec.action === "string" && rec.action.toLowerCase().startsWith("payment.")) {
      return "payment";
    }
  }
  return null;
}

function logWebhook(message: string, extra?: Record<string, string | number | boolean | undefined>) {
  const safe = extra
    ? Object.fromEntries(
        Object.entries(extra).filter(([k]) => !/token|secret|authorization|signature/i.test(k)),
      )
    : undefined;
  console.info("[mercadopago/webhook]", message, safe ?? "");
}

function derivePlanIdFromMetadata(metadata: unknown): string | null {
  if (!metadata || typeof metadata !== "object") return null;
  const rec = metadata as Record<string, unknown>;
  const value = rec.brs_plan_id ?? rec.plan_id ?? rec.planId;
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function toPaymentSnapshot(payment: {
  id?: number | string;
  status?: string;
  status_detail?: string;
  transaction_amount?: number;
  currency_id?: string;
  live_mode?: boolean;
  external_reference?: string;
  preference_id?: string;
  collector_id?: number;
  payer?: { email?: string };
  metadata?: unknown;
  date_approved?: string;
}): MercadoPagoPaymentSnapshot | null {
  const id = payment.id != null ? String(payment.id).trim() : "";
  const status = payment.status?.trim() ?? "";
  if (!id || !status) return null;
  if (typeof payment.transaction_amount !== "number" || !Number.isFinite(payment.transaction_amount)) {
    return null;
  }
  return {
    id,
    status,
    statusDetail: payment.status_detail ?? null,
    transactionAmount: payment.transaction_amount,
    currencyId: payment.currency_id ?? "",
    liveMode: Boolean(payment.live_mode),
    externalReference: payment.external_reference?.trim() || null,
    preferenceId: payment.preference_id?.trim() || null,
    collectorId: payment.collector_id ?? null,
    payerEmail: payment.payer?.email?.trim().toLowerCase() || null,
    metadataPlanId: derivePlanIdFromMetadata(payment.metadata),
    dateApproved: payment.date_approved ?? null,
  };
}

async function fetchPaymentFromApi(paymentId: string) {
  const client = new Payment(getMercadoPagoConfig());
  return client.get({ id: paymentId });
}

async function hasAlternateVipCoverage(
  tx: Prisma.TransactionClient,
  portalUserId: number,
  excludeOrderId: string,
  now: Date,
): Promise<{ hasOtherApprovedMercadoPagoOrders: boolean; hasActiveHotmartCoverage: boolean }> {
  const otherMp = await tx.mercadoPagoOrder.findMany({
    where: {
      portalUserId,
      status: "APPROVED",
      NOT: { id: excludeOrderId },
    },
    select: { id: true, planId: true },
  });

  const hasOtherApprovedVipOrders = otherMp.some((order) => isPoolsVipPlanId(order.planId));

  const hotmart = await tx.hotmartSubscription.findFirst({
    where: {
      portalUserId,
      status: { in: ["ACTIVE", "CANCELED", "PAST_DUE"] },
      currentPeriodEnd: { gt: now },
    },
    select: { id: true },
  });

  return {
    hasOtherApprovedMercadoPagoOrders: hasOtherApprovedVipOrders,
    hasActiveHotmartCoverage: Boolean(hotmart),
  };
}

async function hasAlternateDeemixCoverage(
  tx: Prisma.TransactionClient,
  portalUserId: number,
  excludeOrderId: string,
): Promise<boolean> {
  const otherMp = await tx.mercadoPagoOrder.findMany({
    where: {
      portalUserId,
      status: "APPROVED",
      NOT: { id: excludeOrderId },
    },
    select: { planId: true },
  });
  return otherMp.some((order) => isDeemixPlanId(order.planId));
}

async function hasAlternateAllavsoftCoverage(
  tx: Prisma.TransactionClient,
  portalUserId: number,
  excludeOrderId: string,
): Promise<boolean> {
  const otherMp = await tx.mercadoPagoOrder.findMany({
    where: {
      portalUserId,
      status: "APPROVED",
      NOT: { id: excludeOrderId },
    },
    select: { planId: true },
  });
  return otherMp.some((order) => isAllavsoftPlanId(order.planId));
}

async function applyApprovedAccessInTx(
  tx: Prisma.TransactionClient,
  input: {
    orderId: string;
    portalUserId: number;
    planId: string;
    paymentId: string;
    rawStatus: string;
    payerEmail: string | null;
    preferenceId: string | null;
    approvedAt: Date;
  },
) {
  const plan = getCanonicalPlanById(input.planId);
  if (!plan) {
    throw new Error("Plano do pedido inválido.");
  }

  const order = await tx.mercadoPagoOrder.findUnique({ where: { id: input.orderId } });
  if (!order) throw new Error("Pedido não encontrado na transação.");

  const taken = await tx.mercadoPagoOrder.findFirst({
    where: {
      mercadoPagoPaymentId: input.paymentId,
      NOT: { id: order.id },
    },
    select: { id: true },
  });
  if (taken) {
    return { applied: false as const, reason: "payment_taken" as const, order };
  }

  const decision = decideWebhookStatusTransition(order, {
    mercadoPagoPaymentId: input.paymentId,
    status: "APPROVED",
  });
  if (!decision.apply) {
    return { applied: false as const, reason: decision.reason, order };
  }

  const user = await tx.portalUser.findUnique({ where: { id: input.portalUserId } });
  if (!user) throw new Error("Usuário do pedido não encontrado.");

  const isDeemix = plan.serviceProduct === "deemix";
  const isAllavsoft = plan.serviceProduct === "allavsoft";

  const updatedOrder = await tx.mercadoPagoOrder.update({
    where: { id: order.id },
    data: {
      status: "APPROVED",
      mercadoPagoPaymentId: input.paymentId,
      rawStatus: input.rawStatus,
      payerEmail: input.payerEmail || order.payerEmail,
      mercadoPagoPreferenceId: input.preferenceId || order.mercadoPagoPreferenceId,
      approvedAt: order.approvedAt ?? input.approvedAt,
    },
  });

  if (isAllavsoft) {
    const nextServices = {
      poolsVip: user.servicePoolsVip,
      deemix: user.serviceDeemix,
      allavsoft: true,
    };
    await tx.portalUser.update({
      where: { id: user.id },
      data: {
        serviceAllavsoft: true,
        plan: deriveLegacyPlan(nextServices),
        active: true,
        // Licença vitalícia: não altera vencimento de VIP/Deemix.
      },
    });
    return { applied: true as const, order: updatedOrder, periodEnd: user.nextDueAt };
  }

  const hasActiveService = isDeemix
    ? user.serviceDeemix && user.nextDueAt.getTime() > input.approvedAt.getTime()
    : userHasActiveVipAccess({
        servicePoolsVip: user.servicePoolsVip,
        nextDueAt: user.nextDueAt,
        now: input.approvedAt,
      });

  let periodEnd = computeVipAccessPeriodEnd({
    now: input.approvedAt,
    durationDays: plan.durationDays,
    durationMonths: plan.durationMonths,
    hasActiveAccess: hasActiveService,
    currentExpiresAt: user.nextDueAt,
  });

  // Conta com VIP e Deemix: nextDueAt fica o maior vencimento entre os dois.
  if (isDeemix && user.servicePoolsVip && user.nextDueAt.getTime() > periodEnd.getTime()) {
    periodEnd = user.nextDueAt;
  }
  if (!isDeemix && user.serviceDeemix && user.nextDueAt.getTime() > periodEnd.getTime()) {
    periodEnd = user.nextDueAt;
  }

  const nextPoolsVip = isDeemix ? user.servicePoolsVip : true;
  const nextDeemix = isDeemix ? true : user.serviceDeemix;
  const nextServices = {
    poolsVip: nextPoolsVip,
    deemix: nextDeemix,
    allavsoft: user.serviceAllavsoft,
  };

  await tx.portalUser.update({
    where: { id: user.id },
    data: {
      servicePoolsVip: nextPoolsVip,
      serviceDeemix: nextDeemix,
      plan: deriveLegacyPlan(nextServices),
      monthlyValue: new Prisma.Decimal(isDeemix && user.servicePoolsVip ? user.monthlyValue : plan.amountBrl),
      nextDueAt: periodEnd,
      active: true,
    },
  });

  return { applied: true as const, order: updatedOrder, periodEnd };
}

async function applyNonApprovedStatusInTx(
  tx: Prisma.TransactionClient,
  input: {
    orderId: string;
    portalUserId: number;
    paymentId: string;
    status: MercadoPagoOrderStatus;
    rawStatus: string;
    payerEmail: string | null;
    preferenceId: string | null;
    revokeAccess: boolean;
  },
) {
  const order = await tx.mercadoPagoOrder.findUnique({ where: { id: input.orderId } });
  if (!order) throw new Error("Pedido não encontrado na transação.");

  const taken = await tx.mercadoPagoOrder.findFirst({
    where: {
      mercadoPagoPaymentId: input.paymentId,
      NOT: { id: order.id },
    },
    select: { id: true },
  });
  if (taken) {
    return { applied: false as const, reason: "payment_taken" as const, order };
  }

  const decision = decideWebhookStatusTransition(order, {
    mercadoPagoPaymentId: input.paymentId,
    status: input.status,
  });
  if (!decision.apply) {
    return { applied: false as const, reason: decision.reason, order };
  }

  const wasApproved = order.status === "APPROVED";
  let vipRevoked = false;
  let accessKeptReason: string | null = null;

  const updatedOrder = await tx.mercadoPagoOrder.update({
    where: { id: order.id },
    data: {
      status: input.status,
      mercadoPagoPaymentId: input.paymentId,
      rawStatus: input.rawStatus,
      payerEmail: input.payerEmail || order.payerEmail,
      mercadoPagoPreferenceId: input.preferenceId || order.mercadoPagoPreferenceId,
    },
  });

  // Só corta acesso se o pedido já tinha liberado (APPROVED → refund/cancel/chargeback).
  if (input.revokeAccess && wasApproved) {
    const orderPlan = getCanonicalPlanById(order.planId);
    const isDeemixOrder = orderPlan?.serviceProduct === "deemix";
    const isAllavsoftOrder = orderPlan?.serviceProduct === "allavsoft";

    if (isAllavsoftOrder) {
      const hasOtherAllavsoft = await hasAlternateAllavsoftCoverage(tx, input.portalUserId, order.id);
      if (!hasOtherAllavsoft) {
        const user = await tx.portalUser.findUnique({ where: { id: input.portalUserId } });
        if (user?.serviceAllavsoft) {
          const nextServices = {
            poolsVip: user.servicePoolsVip,
            deemix: user.serviceDeemix,
            allavsoft: false,
          };
          await tx.portalUser.update({
            where: { id: user.id },
            data: {
              serviceAllavsoft: false,
              plan: deriveLegacyPlan(nextServices),
            },
          });
          vipRevoked = true;
        } else {
          vipRevoked = true;
        }
      } else {
        accessKeptReason =
          "Você ainda tem outro pedido Allavsoft aprovado. Só este pedido foi estornado.";
      }
    } else if (isDeemixOrder) {
      const hasOtherDeemix = await hasAlternateDeemixCoverage(tx, input.portalUserId, order.id);
      if (!hasOtherDeemix) {
        const user = await tx.portalUser.findUnique({ where: { id: input.portalUserId } });
        if (user?.serviceDeemix) {
          const nextServices = {
            poolsVip: user.servicePoolsVip,
            deemix: false,
            allavsoft: user.serviceAllavsoft,
          };
          await tx.portalUser.update({
            where: { id: user.id },
            data: {
              serviceDeemix: false,
              plan: deriveLegacyPlan(nextServices),
            },
          });
          vipRevoked = true;
        } else {
          vipRevoked = true;
        }
      } else {
        accessKeptReason =
          "Você ainda tem outro pedido Deemix aprovado. Só este pedido foi estornado.";
      }
    } else {
      const coverage = await hasAlternateVipCoverage(
        tx,
        input.portalUserId,
        order.id,
        new Date(),
      );
      const shouldRevoke = shouldRevokeVipAfterOrderRefund(coverage);
      if (shouldRevoke) {
        const user = await tx.portalUser.findUnique({ where: { id: input.portalUserId } });
        if (user?.servicePoolsVip) {
          const nextServices = {
            poolsVip: false,
            deemix: user.serviceDeemix,
            allavsoft: user.serviceAllavsoft,
          };
          await tx.portalUser.update({
            where: { id: user.id },
            data: {
              servicePoolsVip: false,
              plan: deriveLegacyPlan(nextServices),
              // Só zera vencimento se também não houver Deemix ativo.
              ...(user.serviceDeemix ? {} : { nextDueAt: new Date() }),
            },
          });
          vipRevoked = true;
        } else {
          vipRevoked = true;
        }
      } else {
        accessKeptReason = coverage.hasActiveHotmartCoverage
          ? "Você ainda tem assinatura Hotmart ativa. Só este pedido Mercado Pago foi estornado."
          : "Você ainda tem outro pedido VIP Mercado Pago aprovado. Só este pedido foi estornado.";
        console.info("[mercadopago/webhook] estorno sem revogar VIP (cobertura alternativa)", {
          orderId: order.id,
          portalUserId: input.portalUserId,
          hasOtherApprovedMercadoPagoOrders: coverage.hasOtherApprovedMercadoPagoOrders,
          hasActiveHotmartCoverage: coverage.hasActiveHotmartCoverage,
        });
      }
    }
  }

  return {
    applied: true as const,
    order: updatedOrder,
    wasApproved,
    vipRevoked,
    accessKeptReason,
  };
}

/**
 * Processa notificação Mercado Pago (payment).
 * Sempre valida assinatura; consulta Payment.get; nunca confia só no body.
 */
export async function processMercadoPagoWebhook(request: Request): Promise<ProcessMercadoPagoWebhookResult> {
  const env = getMercadoPagoEnv();
  const url = new URL(request.url);
  const xSignature = headerValue(request.headers, "x-signature");
  const xRequestId = headerValue(request.headers, "x-request-id");

  let body: unknown = null;
  try {
    const text = await request.text();
    body = text ? JSON.parse(text) : null;
  } catch {
    body = null;
  }

  const dataId = readPaymentDataId(url, body);

  try {
    WebhookSignatureValidator.validate({
      xSignature,
      xRequestId,
      dataId,
      secret: process.env.MERCADO_PAGO_WEBHOOK_SECRET?.trim() || env.webhookSecret,
      toleranceSeconds: 300,
    });
  } catch (err) {
    const reason =
      err instanceof InvalidWebhookSignatureError ? err.reason : "SignatureMismatch";
    logWebhook("assinatura inválida", {
      reason,
      requestId: xRequestId ?? undefined,
    });
    return { ok: false, status: 401, result: "invalid_signature", reason };
  }

  const eventType = readEventType(url, body);
  if (!isPaymentWebhookEvent(eventType)) {
    logWebhook("evento ignorado", { eventType: eventType ?? "unknown" });
    return { ok: true, status: 200, result: "ignored_event" };
  }

  if (!dataId) {
    logWebhook("data.id ausente");
    return { ok: true, status: 200, result: "missing_payment_id" };
  }

  let paymentRaw;
  try {
    paymentRaw = await fetchPaymentFromApi(dataId);
  } catch (err) {
    logWebhook("falha ao consultar pagamento", {
      paymentId: dataId,
      message: sanitizeMercadoPagoErrorMessage(err),
    });
    return { ok: true, status: 200, result: "payment_fetch_failed" };
  }

  const payment = toPaymentSnapshot(
    paymentRaw as {
      id?: number | string;
      status?: string;
      status_detail?: string;
      transaction_amount?: number;
      currency_id?: string;
      live_mode?: boolean;
      external_reference?: string;
      preference_id?: string;
      collector_id?: number;
      payer?: { email?: string };
      metadata?: unknown;
      date_approved?: string;
    },
  );
  if (!payment) {
    logWebhook("pagamento incompleto na API", { paymentId: dataId });
    return { ok: true, status: 200, result: "payment_fetch_failed" };
  }

  const order = payment.externalReference
    ? await prisma.mercadoPagoOrder.findUnique({
        where: { externalReference: payment.externalReference },
      })
    : await prisma.mercadoPagoOrder.findFirst({
        where: { mercadoPagoPaymentId: payment.id },
      });

  const validation = validatePaymentAgainstOrder({
    order: order
      ? {
          id: order.id,
          portalUserId: order.portalUserId,
          planId: order.planId,
          amount: order.amount,
          currency: order.currency,
          status: order.status,
          mercadoPagoPaymentId: order.mercadoPagoPaymentId,
          mercadoPagoPreferenceId: order.mercadoPagoPreferenceId,
          externalReference: order.externalReference,
        }
      : null,
    payment,
    mode: env.mode,
    expectedCollectorId: env.collectorId,
  });

  if (!validation.ok) {
    logWebhook("validação rejeitada", {
      reason: validation.reason,
      paymentId: payment.id,
      paymentStatus: payment.status,
    });
    return {
      ok: true,
      status: 200,
      result: "validation_failed",
      reason: validation.reason,
    };
  }

  const mappedStatus = mapPaymentStatusToOrderStatus(payment.status);
  if (!mappedStatus) {
    logWebhook("status desconhecido ignorado", {
      paymentId: payment.id,
      paymentStatus: payment.status,
    });
    return { ok: true, status: 200, result: "ignored_event" };
  }

  const rawStatus = payment.statusDetail
    ? `${payment.status}:${payment.statusDetail}`
    : payment.status;

  try {
    if (shouldGrantAccessForPaymentStatus(payment.status)) {
      const approvedAt = payment.dateApproved ? new Date(payment.dateApproved) : new Date();
      const txResult = await prisma.$transaction((tx) =>
        applyApprovedAccessInTx(tx, {
          orderId: validation.order.id,
          portalUserId: validation.order.portalUserId,
          planId: validation.order.planId,
          paymentId: payment.id,
          rawStatus,
          payerEmail: payment.payerEmail ?? null,
          preferenceId: payment.preferenceId ?? null,
          approvedAt: Number.isNaN(approvedAt.getTime()) ? new Date() : approvedAt,
        }),
      );

      if (!txResult.applied) {
        logWebhook("aprovação idempotente", {
          reason: txResult.reason,
          paymentId: payment.id,
          orderId: validation.order.id,
        });
        return {
          ok: true,
          status: 200,
          result: txResult.reason,
        };
      }

      logWebhook("acesso liberado", {
        paymentId: payment.id,
        orderId: validation.order.id,
        periodEnd: toDateInputValue(txResult.periodEnd),
      });

      // E-mail fora da transação; não bloqueia o 200 do webhook.
      void (async () => {
        try {
          const fresh = await prisma.mercadoPagoOrder.findUnique({
            where: { id: validation.order.id },
            select: {
              activationEmailSentAt: true,
              planId: true,
              portalUser: { select: { email: true, name: true } },
            },
          });
          if (!fresh || fresh.activationEmailSentAt) return;

          const mail = await sendMercadoPagoAccessGrantedEmail({
            to: fresh.portalUser.email,
            name: fresh.portalUser.name,
            planId: fresh.planId,
            periodEnd: txResult.periodEnd,
          });
          if (mail.sent) {
            await prisma.mercadoPagoOrder.update({
              where: { id: validation.order.id },
              data: { activationEmailSentAt: new Date() },
            });
          }
        } catch (mailErr) {
          logWebhook("falha ao enviar e-mail de ativação", {
            message: sanitizeMercadoPagoErrorMessage(mailErr),
          });
        }
      })();

      return { ok: true, status: 200, result: "approved_access_granted" };
    }

    // pending / in_process / rejected / cancelled / refunded / charged_back
    if (
      payment.status === "pending" ||
      payment.status === "in_process" ||
      payment.status === "in_mediation"
    ) {
      const txResult = await prisma.$transaction((tx) =>
        applyNonApprovedStatusInTx(tx, {
          orderId: validation.order.id,
          portalUserId: validation.order.portalUserId,
          paymentId: payment.id,
          status: "PENDING",
          rawStatus,
          payerEmail: payment.payerEmail ?? null,
          preferenceId: payment.preferenceId ?? null,
          revokeAccess: false,
        }),
      );
      logWebhook("pagamento pendente — sem liberar acesso", {
        paymentId: payment.id,
        applied: txResult.applied,
        reason: txResult.applied ? undefined : txResult.reason,
      });
      return {
        ok: true,
        status: 200,
        result: txResult.applied ? "pending_no_access" : txResult.reason,
      };
    }

    const revoke = shouldRevokeAccessForPaymentStatus(payment.status);
    const txResult = await prisma.$transaction((tx) =>
      applyNonApprovedStatusInTx(tx, {
        orderId: validation.order.id,
        portalUserId: validation.order.portalUserId,
        paymentId: payment.id,
        status: mappedStatus,
        rawStatus,
        payerEmail: payment.payerEmail ?? null,
        preferenceId: payment.preferenceId ?? null,
        revokeAccess: revoke,
      }),
    );

    if (!txResult.applied) {
      return { ok: true, status: 200, result: txResult.reason };
    }

    logWebhook(revoke ? "pagamento estornado/chargeback — histórico mantido" : "status atualizado", {
      paymentId: payment.id,
      orderStatus: mappedStatus,
      vipRevoked: txResult.vipRevoked,
    });

    if (revoke && txResult.wasApproved) {
      const reason = describeMercadoPagoRefundReason({
        status: payment.status,
        statusDetail: payment.statusDetail,
      });
      void (async () => {
        try {
          const fresh = await prisma.mercadoPagoOrder.findUnique({
            where: { id: validation.order.id },
            select: {
              planId: true,
              amount: true,
              portalUser: { select: { email: true, name: true } },
            },
          });
          if (!fresh) return;
          await sendMercadoPagoRefundEmail({
            to: fresh.portalUser.email,
            name: fresh.portalUser.name,
            planId: fresh.planId,
            amountBrl: fresh.amount.toFixed(2),
            reasonTitle: reason.title,
            reasonDetail: reason.detail,
            paymentStatus: payment.status,
            statusDetail: payment.statusDetail,
            accessRevoked: Boolean(txResult.vipRevoked),
            accessKeptReason: txResult.accessKeptReason,
          });
        } catch (mailErr) {
          logWebhook("falha ao enviar e-mail de reembolso", {
            message: sanitizeMercadoPagoErrorMessage(mailErr),
          });
        }
      })();
    }

    return {
      ok: true,
      status: 200,
      result: revoke ? "access_revoked" : "status_updated",
    };
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      logWebhook("payment_id duplicado (unique)", { paymentId: payment.id });
      return { ok: true, status: 200, result: "payment_taken" };
    }
    logWebhook("erro ao processar", {
      paymentId: payment.id,
      message: sanitizeMercadoPagoErrorMessage(err),
    });
    return { ok: true, status: 200, result: "error" };
  }
}

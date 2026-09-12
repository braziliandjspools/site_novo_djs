import "server-only";
import type { MercadoPagoOrderStatus } from "@prisma/client";
import { getCanonicalPlanById } from "../billing/plan-catalog";
import { prisma } from "../prisma";
import { formatMonthlyValue } from "../portal-users";

export type PortalPaymentStatusUi = "pago" | "pendente" | "cancelado" | "reembolsado";

export type PortalPaymentRow = {
  id: string;
  provider: "mercadopago" | "hotmart";
  providerLabel: string;
  planId: string;
  planLabel: string;
  amount: number;
  amountLabel: string;
  currency: string;
  status: MercadoPagoOrderStatus | string;
  statusUi: PortalPaymentStatusUi;
  statusLabel: string;
  rawStatus: string | null;
  paymentId: string | null;
  externalReference: string | null;
  createdAt: string;
  approvedAt: string | null;
  updatedAt: string;
};

function mapMercadoPagoStatus(status: MercadoPagoOrderStatus): {
  statusUi: PortalPaymentStatusUi;
  statusLabel: string;
} {
  switch (status) {
    case "APPROVED":
      return { statusUi: "pago", statusLabel: "Pago" };
    case "PENDING":
      return { statusUi: "pendente", statusLabel: "Pendente" };
    case "REFUNDED":
      return { statusUi: "reembolsado", statusLabel: "Reembolsado" };
    case "CANCELLED":
    case "REJECTED":
      return { statusUi: "cancelado", statusLabel: "Cancelado" };
    default:
      return { statusUi: "pendente", statusLabel: status };
  }
}

export async function listPortalPaymentsForUser(portalUserId: number): Promise<{
  payments: PortalPaymentRow[];
  totals: {
    paidCount: number;
    pendingCount: number;
    cancelledCount: number;
    refundedCount: number;
  };
}> {
  const orders = await prisma.mercadoPagoOrder.findMany({
    where: { portalUserId },
    orderBy: [{ createdAt: "desc" }, { updatedAt: "desc" }],
    take: 100,
  });

  const payments: PortalPaymentRow[] = orders.map((order) => {
    const plan = getCanonicalPlanById(order.planId, { includeInactive: true });
    const mapped = mapMercadoPagoStatus(order.status);
    const amount = Number(order.amount);
    return {
      id: order.id,
      provider: "mercadopago",
      providerLabel: "Mercado Pago",
      planId: order.planId,
      planLabel: plan?.title ?? order.planId,
      amount,
      amountLabel: formatMonthlyValue(amount),
      currency: order.currency,
      status: order.status,
      statusUi: mapped.statusUi,
      statusLabel: mapped.statusLabel,
      rawStatus: order.rawStatus,
      paymentId: order.mercadoPagoPaymentId,
      externalReference: order.externalReference,
      createdAt: order.createdAt.toISOString(),
      approvedAt: order.approvedAt?.toISOString() ?? null,
      updatedAt: order.updatedAt.toISOString(),
    };
  });

  return {
    payments,
    totals: {
      paidCount: payments.filter((p) => p.statusUi === "pago").length,
      pendingCount: payments.filter((p) => p.statusUi === "pendente").length,
      cancelledCount: payments.filter((p) => p.statusUi === "cancelado").length,
      refundedCount: payments.filter((p) => p.statusUi === "reembolsado").length,
    },
  };
}

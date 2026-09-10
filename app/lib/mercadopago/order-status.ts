import "server-only";
import type { MercadoPagoOrderStatus } from "@prisma/client";
import { getCanonicalPlanById } from "../billing/plan-catalog";
import { prisma } from "../prisma";
import {
  isTrustedExternalReference,
  isTrustedOrderId,
  mapOrderStatusToPublicPhase,
  type PublicOrderPhase,
} from "./return-policy";

export type SafeOrderStatusDto = {
  phase: PublicOrderPhase;
  planLabel: string | null;
  accessActive: boolean;
  /** true enquanto ainda faz sentido o frontend continuar consultando */
  canPoll: boolean;
};

function toSafeDto(input: {
  status: MercadoPagoOrderStatus;
  planId: string;
  accessActive: boolean;
}): SafeOrderStatusDto {
  const phase = mapOrderStatusToPublicPhase(input.status);
  const plan = getCanonicalPlanById(input.planId);
  return {
    phase,
    planLabel: plan?.title ?? null,
    accessActive: input.accessActive && phase === "approved",
    canPoll: phase === "confirming",
  };
}

/**
 * Consulta status interno do pedido. Não aceita payment_id/status da URL.
 * Só retorna dados do próprio usuário autenticado.
 */
export async function getSafeMercadoPagoOrderStatusForUser(input: {
  portalUserId: number;
  orderId?: string | null;
  externalReference?: string | null;
}): Promise<SafeOrderStatusDto> {
  const orderId = isTrustedOrderId(input.orderId) ? input.orderId.trim() : null;
  const externalReference = isTrustedExternalReference(input.externalReference)
    ? input.externalReference.trim()
    : null;

  if (!orderId && !externalReference) {
    return {
      phase: "not_found",
      planLabel: null,
      accessActive: false,
      canPoll: false,
    };
  }

  const order = await prisma.mercadoPagoOrder.findFirst({
    where: {
      portalUserId: input.portalUserId,
      ...(orderId ? { id: orderId } : { externalReference: externalReference! }),
    },
    select: {
      status: true,
      planId: true,
      portalUser: {
        select: {
          servicePoolsVip: true,
          servicePoolsVipDueAt: true,
          nextDueAt: true,
        },
      },
    },
  });

  if (!order) {
    return {
      phase: "not_found",
      planLabel: null,
      accessActive: false,
      canPoll: Boolean(orderId || externalReference),
    };
  }

  const now = Date.now();
  const poolsDue = order.portalUser.servicePoolsVipDueAt ?? order.portalUser.nextDueAt;
  const accessActive = order.portalUser.servicePoolsVip && poolsDue.getTime() > now;

  return toSafeDto({
    status: order.status,
    planId: order.planId,
    accessActive,
  });
}

import "server-only";

import { Prisma, type PrismaClient } from "@prisma/client";
import { prisma } from "./prisma";

type WalletTx = Prisma.TransactionClient;

export const PORTAL_WALLET_TOPUP_PLAN_ID = "brs-wallet-topup";

export function walletDecimal(value: string | number | Prisma.Decimal) {
  if (value instanceof Prisma.Decimal) return value;
  const normalized = String(value).trim().replace(",", ".");
  if (!/^\d{1,8}(\.\d{1,2})?$/.test(normalized)) {
    throw new Error("Informe um valor válido para adicionar ao saldo.");
  }
  return new Prisma.Decimal(normalized).toDecimalPlaces(2);
}

export async function ensurePortalWallet(
  db: PrismaClient | WalletTx,
  portalUserId: number,
) {
  return db.portalWallet.upsert({
    where: { portalUserId },
    create: { portalUserId },
    update: {},
    select: { balance: true },
  });
}

export async function reserveWalletForOrder(
  tx: WalletTx,
  input: { portalUserId: number; orderId: string; amount: Prisma.Decimal; description: string },
) {
  if (input.amount.lte(0)) return true;
  await ensurePortalWallet(tx, input.portalUserId);
  const reserved = await tx.portalWallet.updateMany({
    where: { portalUserId: input.portalUserId, balance: { gte: input.amount } },
    data: { balance: { decrement: input.amount } },
  });
  if (reserved.count !== 1) return false;
  await tx.portalWalletTransaction.create({
    data: {
      portalUserId: input.portalUserId,
      mercadoPagoOrderId: input.orderId,
      type: "PURCHASE",
      status: "PENDING",
      amount: input.amount,
      description: input.description,
    },
  });
  return true;
}

export async function completeWalletPurchase(tx: WalletTx, orderId: string) {
  await tx.portalWalletTransaction.updateMany({
    where: { mercadoPagoOrderId: orderId, type: "PURCHASE", status: "PENDING" },
    data: { status: "COMPLETED" },
  });
}

export async function releaseWalletReservation(tx: WalletTx, orderId: string) {
  const purchase = await tx.portalWalletTransaction.findFirst({
    where: { mercadoPagoOrderId: orderId, type: "PURCHASE", status: "PENDING" },
  });
  if (!purchase) return false;
  const updated = await tx.portalWalletTransaction.updateMany({
    where: { id: purchase.id, status: "PENDING" },
    data: { status: "CANCELLED" },
  });
  if (!updated.count) return false;
  await tx.portalWallet.update({
    where: { portalUserId: purchase.portalUserId },
    data: { balance: { increment: purchase.amount } },
  });
  await tx.portalWalletTransaction.create({
    data: {
      portalUserId: purchase.portalUserId,
      mercadoPagoOrderId: orderId,
      type: "REFUND",
      amount: purchase.amount,
      description: "Saldo liberado após pagamento não aprovado",
    },
  });
  return true;
}

export async function creditWalletTopUp(
  tx: WalletTx,
  input: { portalUserId: number; orderId: string; amount: Prisma.Decimal },
) {
  const existing = await tx.portalWalletTransaction.findUnique({
    where: { mercadoPagoOrderId_type: { mercadoPagoOrderId: input.orderId, type: "TOP_UP" } },
  });
  if (existing) return false;
  await ensurePortalWallet(tx, input.portalUserId);
  await tx.portalWallet.update({
    where: { portalUserId: input.portalUserId },
    data: { balance: { increment: input.amount } },
  });
  await tx.portalWalletTransaction.create({
    data: {
      portalUserId: input.portalUserId,
      mercadoPagoOrderId: input.orderId,
      type: "TOP_UP",
      amount: input.amount,
      description: "Recarga de saldo via Mercado Pago",
    },
  });
  return true;
}

/** Reverte crédito de recarga estornado pelo Mercado Pago; saldo pode ficar negativo até nova recarga. */
export async function reverseWalletTopUp(tx: WalletTx, orderId: string) {
  const topup = await tx.portalWalletTransaction.findFirst({
    where: { mercadoPagoOrderId: orderId, type: "TOP_UP", status: "COMPLETED" },
  });
  if (!topup) return false;
  await tx.portalWalletTransaction.update({
    where: { id: topup.id },
    data: { status: "CANCELLED" },
  });
  const existingRefund = await tx.portalWalletTransaction.findFirst({
    where: { mercadoPagoOrderId: orderId, type: "REFUND" },
  });
  if (existingRefund) return false;
  await tx.portalWallet.update({
    where: { portalUserId: topup.portalUserId },
    data: { balance: { decrement: topup.amount } },
  });
  await tx.portalWalletTransaction.create({
    data: {
      portalUserId: topup.portalUserId,
      mercadoPagoOrderId: orderId,
      type: "REFUND",
      amount: topup.amount,
      description: "Recarga estornada pelo Mercado Pago",
    },
  });
  return true;
}

export async function chargebackWalletPurchase(tx: WalletTx, orderId: string) {
  const purchase = await tx.portalWalletTransaction.findFirst({
    where: { mercadoPagoOrderId: orderId, type: "PURCHASE", status: "COMPLETED" },
  });
  if (!purchase) return false;
  const existingRefund = await tx.portalWalletTransaction.findFirst({
    where: { mercadoPagoOrderId: orderId, type: "REFUND" },
  });
  if (existingRefund) return false;
  await tx.portalWalletTransaction.update({
    where: { id: purchase.id },
    data: { status: "CANCELLED" },
  });
  await tx.portalWallet.update({
    where: { portalUserId: purchase.portalUserId },
    data: { balance: { increment: purchase.amount } },
  });
  await tx.portalWalletTransaction.create({
    data: {
      portalUserId: purchase.portalUserId,
      mercadoPagoOrderId: orderId,
      type: "REFUND",
      amount: purchase.amount,
      description: "Saldo devolvido após estorno do pedido",
    },
  });
  return true;
}

export async function getPortalWalletBalance(portalUserId: number) {
  const wallet = await ensurePortalWallet(prisma, portalUserId);
  return Number(wallet.balance.toFixed(2));
}

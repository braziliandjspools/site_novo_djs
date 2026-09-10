import { NextResponse } from "next/server";
import { processMercadoPagoWebhook } from "../../../lib/mercadopago/process-webhook";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Webhook de produção Mercado Pago (Checkout Pro / payments).
 * Valida x-signature, consulta Payment.get e libera VIP só com status approved.
 */
export async function POST(request: Request) {
  const result = await processMercadoPagoWebhook(request);

  if (result.result === "invalid_signature") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Resposta rápida 200 para eventos válidos/ignorados (evita retries agressivos).
  return NextResponse.json({ received: true, result: result.result }, { status: 200 });
}

export async function GET() {
  return NextResponse.json({ ok: true });
}

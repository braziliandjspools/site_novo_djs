import { NextResponse } from "next/server";
import { getSafeMercadoPagoOrderStatusForUser } from "../../../../lib/mercadopago/order-status";
import { extractTrustedReturnLookup } from "../../../../lib/mercadopago/return-policy";
import { getAuthenticatedPortalUser } from "../../../../lib/portal";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Status seguro do pedido interno.
 * Não ativa plano. Não confia em status/payment_id/collection_status da query.
 */
export async function GET(request: Request) {
  const user = await getAuthenticatedPortalUser();
  if (!user) {
    return NextResponse.json({ error: "Faça login para ver o status do pagamento." }, { status: 401 });
  }

  const url = new URL(request.url);
  const lookup = extractTrustedReturnLookup(url.searchParams);

  const status = await getSafeMercadoPagoOrderStatusForUser({
    portalUserId: user.id,
    orderId: lookup.orderId,
    externalReference: lookup.externalReference,
  });

  return NextResponse.json(status);
}

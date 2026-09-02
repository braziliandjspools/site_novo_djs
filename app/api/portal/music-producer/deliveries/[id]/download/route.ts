import { NextResponse } from "next/server";
import { getAuthenticatedPortalUser } from "../../../../../../lib/portal";
import { getPortalUserDeliveryForPlayback } from "../../../../../../lib/music-producer-deliveries";
import {
  deliveryMediaFilename,
  fetchDeliveryMediaUpstream,
} from "../../../../../../lib/music-producer-delivery-media";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const user = await getAuthenticatedPortalUser();
  if (!user) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const id = Number((await context.params).id);
  if (!Number.isInteger(id) || id < 1) {
    return NextResponse.json({ error: "ID inválido." }, { status: 400 });
  }

  const delivery = await getPortalUserDeliveryForPlayback(user, id);
  if (!delivery) {
    return NextResponse.json({ error: "Faixa indisponível." }, { status: 403 });
  }

  try {
    const upstream = await fetchDeliveryMediaUpstream(delivery.downloadUrl);
    if ("error" in upstream) {
      return NextResponse.json({ error: upstream.error }, { status: upstream.status });
    }

    const filename = deliveryMediaFilename(delivery.title);
    const headers = new Headers();
    headers.set("Content-Type", upstream.contentType);
    headers.set("Content-Disposition", `attachment; filename="${filename}"`);
    headers.set("Cache-Control", "private, no-store, no-cache");

    if (upstream.contentLength) {
      headers.set("Content-Length", upstream.contentLength);
    }

    return new NextResponse(upstream.body, { status: 200, headers });
  } catch {
    return NextResponse.json({ error: "Falha ao baixar." }, { status: 502 });
  }
}

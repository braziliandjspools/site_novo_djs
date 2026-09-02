import { NextResponse } from "next/server";
import { isAuthorizedAdminRequest } from "../../../../lib/admin-auth";
import { listAllMusicProducerDeliveriesGrouped } from "../../../../lib/music-producer-deliveries";
import { listAllMusicProducerBriefingsGrouped } from "../../../../lib/music-producer-briefings";
import { listPortalUsersByQueue, serializePortalUser } from "../../../../lib/portal-users";

export const dynamic = "force-dynamic";

function unauthorized() {
  return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
}

export async function GET(request: Request) {
  if (!process.env.PORTAL_ADMIN_SECRET) {
    return NextResponse.json({ error: "Admin não configurado no servidor." }, { status: 503 });
  }
  if (!isAuthorizedAdminRequest(request)) return unauthorized();

  const [users, groupedDeliveries, groupedBriefings] = await Promise.all([
    listPortalUsersByQueue(),
    listAllMusicProducerDeliveriesGrouped().catch((error) => {
      console.error("Failed to load music producer deliveries:", error);
      return [] as Awaited<ReturnType<typeof listAllMusicProducerDeliveriesGrouped>>;
    }),
    listAllMusicProducerBriefingsGrouped().catch((error) => {
      console.error("Failed to load music producer briefings:", error);
      return [] as Awaited<ReturnType<typeof listAllMusicProducerBriefingsGrouped>>;
    }),
  ]);

  const deliveriesByUser = new Map(groupedDeliveries.map((entry) => [entry.userId, entry.deliveries]));
  const briefingsByUser = new Map(groupedBriefings.map((entry) => [entry.userId, entry.briefings]));

  const items = users.map((user) => ({
    ...serializePortalUser(user),
    deliveries: deliveriesByUser.get(user.id) ?? [],
    briefings: briefingsByUser.get(user.id) ?? [],
  }));

  return NextResponse.json({
    total: items.length,
    items,
  });
}

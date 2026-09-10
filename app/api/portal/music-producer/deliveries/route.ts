import { NextResponse } from "next/server";
import { getAuthenticatedPortalUser } from "../../../../lib/portal";
import { listPortalUserBriefings } from "../../../../lib/music-producer-briefings";
import { getPortalUserDeliveries } from "../../../../lib/music-producer-deliveries";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getAuthenticatedPortalUser();
  if (!user) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const [data, briefings] = await Promise.all([
    getPortalUserDeliveries(user),
    listPortalUserBriefings(user.id),
  ]);

  return NextResponse.json({
    enabled: data.enabled,
    deliveries: data.deliveries,
    briefings,
  });
}

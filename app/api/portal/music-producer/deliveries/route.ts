import { NextResponse } from "next/server";
import { getAuthenticatedPortalUser } from "../../../../lib/portal";
import { listPortalUserBriefings } from "../../../../lib/music-producer-briefings";
import { getPortalUserDeliveries } from "../../../../lib/music-producer-deliveries";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
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
  } catch (error) {
    console.error("[portal/music-producer/deliveries] Failed to load productions:", error);
    return NextResponse.json(
      { error: "Não foi possível carregar suas produções. Tente novamente em instantes." },
      { status: 500 },
    );
  }
}

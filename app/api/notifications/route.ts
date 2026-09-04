import { NextResponse } from "next/server";
import { getAuthenticatedPortalUser } from "../../lib/portal";
import { buildSiteNotifications } from "../../lib/site-notices";

export async function GET() {
  try {
    const user = await getAuthenticatedPortalUser();
    const notifications = await buildSiteNotifications(user);
    return NextResponse.json({
      authenticated: Boolean(user),
      notifications,
      unreadCount: notifications.filter((item) => !item.read).length,
    });
  } catch (error) {
    console.error("Notifications list failed:", error);
    return NextResponse.json({ error: "Erro ao carregar notificações." }, { status: 500 });
  }
}

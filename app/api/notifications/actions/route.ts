import { NextResponse } from "next/server";
import { getAuthenticatedPortalUser } from "../../../lib/portal";
import {
  dismissNotice,
  markAllNoticesRead,
  markNoticeRead,
  parseNoticeId,
} from "../../../lib/site-notices";

type Body = {
  action?: "read" | "read_all" | "dismiss";
  id?: string;
  ids?: string[];
};

export async function POST(request: Request) {
  const user = await getAuthenticatedPortalUser();
  if (!user) {
    return NextResponse.json({ error: "Faça login para sincronizar notificações." }, { status: 401 });
  }

  let body: Body = {};
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Requisição inválida" }, { status: 400 });
  }

  try {
    if (body.action === "read_all") {
      const ids = (body.ids ?? [])
        .map(parseNoticeId)
        .filter((value): value is number => value != null);
      await markAllNoticesRead(user.id, ids);
      return NextResponse.json({ ok: true });
    }

    const noticeId = parseNoticeId(body.id ?? "");
    if (!noticeId) {
      // payment/info locais — ok no client
      return NextResponse.json({ ok: true, localOnly: true });
    }

    if (body.action === "dismiss") {
      await dismissNotice(noticeId, user.id);
      return NextResponse.json({ ok: true });
    }

    await markNoticeRead(noticeId, user.id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Notifications mutate failed:", error);
    return NextResponse.json({ error: "Erro ao atualizar notificação." }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { BRIEFING_AI_COOKIE, briefingAiCookieOptions } from "../../../lib/music-producer-ai-limit";
import { createMusicProducerBriefing } from "../../../lib/music-producer-briefings";
import { getAuthenticatedPortalUser } from "../../../lib/portal";

type BriefingPayload = {
  servicePlan?: string;
  estimatedQuote?: string;
  projectType?: string;
  idea?: string;
  lyrics?: string;
  style?: string;
  sunoStyle?: string;
  occasion?: string;
  deadline?: string;
  deadlineSurcharge?: string;
  message?: string;
};

export async function POST(request: Request) {
  const user = await getAuthenticatedPortalUser();
  if (!user) {
    return NextResponse.json(
      { error: "Faça login no portal do cliente para enviar um pedido de produção." },
      { status: 401 },
    );
  }

  let body: BriefingPayload;

  try {
    body = (await request.json()) as BriefingPayload;
  } catch {
    return NextResponse.json({ error: "Requisição inválida." }, { status: 400 });
  }

  const servicePlan = body.servicePlan?.trim() || body.projectType?.trim() || "";
  const estimatedQuote = body.estimatedQuote?.trim() ?? "";
  const idea = body.idea?.trim() ?? "";
  const lyrics = body.lyrics?.trim() ?? "";
  const style = body.style?.trim() || body.sunoStyle?.trim() || "";
  const occasion = body.occasion?.trim() ?? "";
  const deadline = body.deadline?.trim() ?? "";
  const deadlineSurcharge = body.deadlineSurcharge?.trim() ?? "";
  const message = body.message?.trim() ?? "";

  if (!servicePlan || (!idea && !message)) {
    return NextResponse.json(
      { error: "Preencha o tipo de produção e a ideia do projeto." },
      { status: 400 },
    );
  }

  try {
    const briefing = await createMusicProducerBriefing({
      portalUserId: user.id,
      name: user.name,
      email: user.email,
      whatsapp: user.whatsapp,
      servicePlan,
      estimatedQuote,
      idea: idea || message,
      lyrics,
      style,
      occasion,
      deadline,
      deadlineSurcharge,
      additionalNotes: message,
    });

    const store = await cookies();
    store.set(BRIEFING_AI_COOKIE, "0", briefingAiCookieOptions());

    return NextResponse.json({
      ok: true,
      id: briefing.id,
    });
  } catch (err) {
    console.error("Briefing save failed:", err);
    return NextResponse.json(
      { error: "Não foi possível registrar o pedido. Tente novamente." },
      { status: 502 },
    );
  }
}

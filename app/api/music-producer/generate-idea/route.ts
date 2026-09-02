import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  assertCanGenerateBriefingIdea,
  BRIEFING_AI_COOKIE,
  briefingAiCookieOptions,
  getBriefingAiGenerationsUsed,
  MAX_BRIEFING_AI_GENERATIONS,
  nextBriefingAiGenerationCount,
} from "../../../lib/music-producer-ai-limit";
import { generateBriefingIdea, type BriefingIdeaInput } from "../../../lib/openrouter";

export async function GET() {
  const used = await getBriefingAiGenerationsUsed();
  const remaining = Math.max(0, MAX_BRIEFING_AI_GENERATIONS - used);

  return NextResponse.json({
    used,
    remaining,
    max: MAX_BRIEFING_AI_GENERATIONS,
    canRegenerate: remaining > 0,
  });
}

export async function POST(request: Request) {
  let body: BriefingIdeaInput;

  try {
    body = (await request.json()) as BriefingIdeaInput;
  } catch {
    return NextResponse.json({ error: "Requisição inválida." }, { status: 400 });
  }

  const idea = body.idea?.trim() ?? "";
  const projectType = body.projectType?.trim() ?? "";
  const style = body.style?.trim() ?? "";
  const occasion = body.occasion?.trim() ?? "";

  if (!idea && !projectType && !style && !occasion) {
    return NextResponse.json(
      { error: "Descreva sua ideia ou preencha ao menos um campo para a IA trabalhar." },
      { status: 400 },
    );
  }

  const limit = await assertCanGenerateBriefingIdea();
  if (!limit.allowed) {
    return NextResponse.json(
      {
        error: `Limite de gerações atingido para este pedido (${MAX_BRIEFING_AI_GENERATIONS} no total, incluindo regenerações). Envie o briefing ou recarregue após enviar.`,
        used: limit.used,
        remaining: 0,
        max: MAX_BRIEFING_AI_GENERATIONS,
      },
      { status: 429 },
    );
  }

  try {
    const result = await generateBriefingIdea({
      idea,
      projectType,
      style,
      occasion,
      regenerate: body.regenerate ?? limit.used > 0,
    });

    const used = nextBriefingAiGenerationCount(limit.used);
    const remaining = Math.max(0, MAX_BRIEFING_AI_GENERATIONS - used);

    const store = await cookies();
    store.set(BRIEFING_AI_COOKIE, String(used), briefingAiCookieOptions());

    return NextResponse.json({
      ...result,
      used,
      remaining,
      max: MAX_BRIEFING_AI_GENERATIONS,
      canRegenerate: remaining > 0,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro ao gerar ideia.";
    const status = message.includes("não configurada") ? 503 : 502;
    return NextResponse.json({ error: message }, { status });
  }
}

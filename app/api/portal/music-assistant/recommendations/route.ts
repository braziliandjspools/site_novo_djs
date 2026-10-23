import { NextResponse } from "next/server";
import { getAuthenticatedPortalUser } from "../../../../lib/portal";
import { checkRateLimit } from "../../../../lib/rate-limit";
import { canUseMusicAssistant, getMusicCurationJob, submitMusicCuration } from "../../../../lib/portal-music-assistant";

export const dynamic = "force-dynamic";

const privateHeaders = { "Cache-Control": "private, no-store", Vary: "Cookie" };

export async function POST(request: Request) {
  let user: Awaited<ReturnType<typeof getAuthenticatedPortalUser>>;
  try {
    user = await getAuthenticatedPortalUser();
  } catch (error) {
    console.error("[portal/music-assistant] session lookup failed:", error instanceof Error ? error.name : "unknown error");
    return NextResponse.json({ error: "Não foi possível validar sua sessão do Portal. Atualize a página e tente novamente." }, {
      status: 503,
      headers: privateHeaders,
    });
  }

  if (!user) {
    return NextResponse.json({ error: "Faça login no portal para usar o assistente." }, {
      status: 401,
      headers: privateHeaders,
    });
  }

  let hasAccess = false;
  try {
    hasAccess = await canUseMusicAssistant(user);
  } catch (error) {
    console.error("[portal/music-assistant] access check failed:", error instanceof Error ? error.name : "unknown error");
    return NextResponse.json({ error: "Não foi possível validar seu plano agora. Tente novamente." }, {
      status: 503,
      headers: privateHeaders,
    });
  }
  if (!hasAccess) {
    return NextResponse.json({
      error: "O Organizador Musical com IA está disponível nos planos Trimestral, Semestral e Anual, com VIP ativo.",
      code: "plan_required",
    }, { status: 403, headers: privateHeaders });
  }

  let body: { prompt?: unknown };
  try {
    body = (await request.json()) as { prompt?: unknown };
  } catch {
    return NextResponse.json({ error: "Não foi possível ler seu pedido." }, { status: 400, headers: privateHeaders });
  }

  const prompt = typeof body.prompt === "string"
    ? body.prompt.replace(/[\u0000-\u001f]/g, " ").trim()
    : "";
  if (prompt.length < 8 || prompt.length > 600) {
    return NextResponse.json({ error: "Descreva seu evento ou ideia em até 600 caracteres." }, {
      status: 400,
      headers: privateHeaders,
    });
  }

  const rate = checkRateLimit({ key: `portal-music-assistant:${user.id}`, limit: 5, windowMs: 15 * 60 * 1000 });
  if (!rate.ok) {
    return NextResponse.json({ error: "Você já fez várias buscas. Aguarde alguns minutos para tentar novamente." }, {
      status: 429,
      headers: { ...privateHeaders, "Retry-After": String(rate.retryAfterSec) },
    });
  }

  if (!process.env.OPENROUTER_API_KEY?.trim()) {
    return NextResponse.json({ error: "O assistente de curadoria ainda não está configurado." }, {
      status: 503,
      headers: privateHeaders,
    });
  }

  try {
    const job = await submitMusicCuration(prompt, user.id);
    return NextResponse.json(job, { status: 202, headers: privateHeaders });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Não foi possível iniciar a curadoria agora.";
    console.error("[portal/music-assistant] recommendation request failed:", { userId: user.id, message });
    return NextResponse.json({ error: message }, { status: 502, headers: privateHeaders });
  }
}

export async function GET(request: Request) {
  let user: Awaited<ReturnType<typeof getAuthenticatedPortalUser>>;
  try {
    user = await getAuthenticatedPortalUser();
  } catch (error) {
    console.error("[portal/music-assistant] session lookup failed:", error instanceof Error ? error.name : "unknown error");
    return NextResponse.json({ error: "Não foi possível validar sua sessão do Portal." }, { status: 503, headers: privateHeaders });
  }
  if (!user) return NextResponse.json({ error: "Faça login no portal para consultar a curadoria." }, { status: 401, headers: privateHeaders });

  let hasAccess = false;
  try {
    hasAccess = await canUseMusicAssistant(user);
  } catch (error) {
    console.error("[portal/music-assistant] access check failed:", error instanceof Error ? error.name : "unknown error");
    return NextResponse.json({ error: "Não foi possível validar seu plano agora." }, { status: 503, headers: privateHeaders });
  }
  if (!hasAccess) return NextResponse.json({ error: "Seu plano não tem acesso ao Organizador Musical com IA.", code: "plan_required" }, { status: 403, headers: privateHeaders });

  const rate = checkRateLimit({ key: `portal-music-assistant-poll:${user.id}`, limit: 20, windowMs: 60_000 });
  if (!rate.ok) {
    return NextResponse.json({ error: "Aguarde um instante antes de consultar novamente." }, {
      status: 429,
      headers: { ...privateHeaders, "Retry-After": String(rate.retryAfterSec) },
    });
  }

  const token = new URL(request.url).searchParams.get("job")?.trim() ?? "";
  if (!token || token.length > 512) return NextResponse.json({ error: "Identificador da curadoria inválido." }, { status: 400, headers: privateHeaders });

  try {
    const job = await getMusicCurationJob(token, user.id);
    if (!job) return NextResponse.json({ error: "Esta curadoria não pertence à sua sessão." }, { status: 403, headers: privateHeaders });
    return NextResponse.json(job, { headers: privateHeaders });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Não foi possível consultar a curadoria agora.";
    return NextResponse.json({ error: message }, { status: 502, headers: privateHeaders });
  }
}

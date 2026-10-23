import { NextResponse } from "next/server";
import { getAuthenticatedPortalUser } from "../../../../lib/portal";
import { checkRateLimit } from "../../../../lib/rate-limit";
import { createMusicSearchPlan, searchYouTubeMusic, type MusicAssistantSection } from "../../../../lib/portal-music-assistant";

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

  const youtubeApiKey = process.env.YOUTUBE_DATA_API_KEY?.trim();
  if (!youtubeApiKey) {
    return NextResponse.json({ error: "A busca musical ainda não está configurada. Tente novamente mais tarde." }, {
      status: 503,
      headers: privateHeaders,
    });
  }

  try {
    const plan = await createMusicSearchPlan(prompt);
    const searchResults = await Promise.allSettled(
      plan.moments.map((moment) => searchYouTubeMusic(moment.query, youtubeApiKey)),
    );
    const sections: MusicAssistantSection[] = plan.moments.map((moment, index) => {
      const result = searchResults[index];
      if (result.status === "fulfilled") return { ...moment, results: result.value };

      const message = result.reason instanceof Error
        ? result.reason.message
        : "Não foi possível pesquisar este momento no YouTube.";
      console.error("[portal/music-assistant] YouTube section search failed:", {
        userId: user.id,
        title: moment.title,
        message,
      });
      return { ...moment, results: [], searchError: message };
    });

    if (sections.every((section) => section.searchError)) {
      return NextResponse.json({ error: sections[0]?.searchError ?? "Não foi possível consultar o YouTube agora." }, {
        status: 502,
        headers: privateHeaders,
      });
    }

    return NextResponse.json({ overview: plan.overview, sections }, { headers: privateHeaders });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Não foi possível buscar músicas agora.";
    console.error("[portal/music-assistant] recommendation request failed:", { userId: user.id, message });
    return NextResponse.json({ error: message }, { status: 502, headers: privateHeaders });
  }
}

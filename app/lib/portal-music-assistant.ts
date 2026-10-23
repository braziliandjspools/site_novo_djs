import "server-only";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const YOUTUBE_SEARCH_URL = "https://www.googleapis.com/youtube/v3/search";

export type MusicSearchMoment = {
  title: string;
  reason: string;
  query: string;
};

export type YouTubeMusicResult = {
  id: string;
  kind: "video" | "playlist";
  title: string;
  channelTitle: string;
  description: string;
  thumbnailUrl: string;
  publishedAt: string;
  url: string;
  embedUrl: string;
};

export type MusicAssistantSection = MusicSearchMoment & {
  results: YouTubeMusicResult[];
};

const PLAN_PROMPT = `Você é um curador musical para DJs. Interprete o pedido do cliente e devolva SOMENTE um JSON válido, sem markdown, neste formato:
{
  "overview": "resumo acolhedor em português do Brasil, em até 2 frases",
  "moments": [
    { "title": "momento do evento em português do Brasil", "reason": "por que esta seleção combina, em português do Brasil", "query": "consulta curta e concreta para buscar vídeos e playlists reais no YouTube" }
  ]
}

Crie de 2 a 3 momentos musicais úteis para o evento (por exemplo, recepção, jantar, entrada ou pista, quando fizer sentido). Respeite o estilo, artistas, época, idioma e energia solicitados, sem impor um gênero padrão. Cada query deve ser específica, curta e pesquisável; use termos que ajudem a encontrar faixas ou playlists reais no idioma pedido. Não invente títulos, artistas nem resultados: as músicas serão retornadas pela busca do YouTube. Mantenha os títulos e motivos em português do Brasil, mas escreva cada query no idioma que melhor atende ao pedido do cliente.`;

function extractJsonObject(raw: string) {
  const text = raw
    .replace(/<think>[\s\S]*?(?:<\/think>|$)/gi, "")
    .replace(/```(?:json)?/gi, "")
    .replace(/```/g, "")
    .trim();
  const start = text.indexOf("{");
  if (start < 0) throw new Error("A IA retornou uma resposta incompleta.");

  let depth = 0;
  let quoted = false;
  let escaped = false;
  let json = "";

  for (let index = start; index < text.length; index += 1) {
    const char = text[index];
    json += char;

    if (quoted) {
      if (escaped) escaped = false;
      else if (char === "\\") escaped = true;
      else if (char === '"') quoted = false;
      continue;
    }

    if (char === '"') quoted = true;
    else if (char === "{") depth += 1;
    else if (char === "}") {
      depth -= 1;
      if (depth === 0) return JSON.parse(json) as Record<string, unknown>;
    }
  }

  throw new Error("A IA retornou uma resposta incompleta.");
}

function cleanText(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.replace(/[\u0000-\u001f]/g, " ").trim().slice(0, maxLength) : "";
}

export async function createMusicSearchPlan(prompt: string): Promise<{
  overview: string;
  moments: MusicSearchMoment[];
}> {
  const apiKey = process.env.OPENROUTER_API_KEY?.trim();
  if (!apiKey) throw new Error("A busca inteligente está temporariamente indisponível.");

  const model = process.env.PORTAL_MUSIC_ASSISTANT_MODEL?.trim() || "liquid/lfm-2.5-2.6b:free";
  const response = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.brazilianremixservice.com.br",
      "X-Title": "Brazilian Remix Service Music Assistant",
    },
    body: JSON.stringify({
      model,
      temperature: 0.45,
      max_tokens: 900,
      messages: [
        { role: "system", content: PLAN_PROMPT },
        { role: "user", content: `Pedido do cliente:\n${prompt}` },
      ],
    }),
    signal: AbortSignal.timeout(25_000),
  });

  if (!response.ok) {
    console.error("[portal/music-assistant] OpenRouter returned", response.status);
    throw new Error("Não foi possível montar as sugestões agora. Tente novamente em instantes.");
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string | null } }>;
  };
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error("A IA não retornou sugestões. Tente descrever o evento de outra forma.");

  const parsed = extractJsonObject(content);
  const moments = Array.isArray(parsed.moments)
    ? parsed.moments
        .slice(0, 3)
        .map((moment) => {
          if (!moment || typeof moment !== "object") return null;
          const item = moment as Record<string, unknown>;
          const title = cleanText(item.title, 70);
          const reason = cleanText(item.reason, 220);
          const query = cleanText(item.query, 150);
          return title && query ? { title, reason, query } : null;
        })
        .filter((moment): moment is MusicSearchMoment => moment !== null)
    : [];

  if (!moments.length) throw new Error("A IA não conseguiu transformar o pedido em buscas musicais.");

  return {
    overview: cleanText(parsed.overview, 320) || "Organizamos seu pedido em momentos para facilitar a curadoria.",
    moments,
  };
}

type YouTubeSearchResponse = {
  items?: Array<{
    id?: { kind?: string; videoId?: string; playlistId?: string };
    snippet?: {
      title?: string;
      channelTitle?: string;
      description?: string;
      publishedAt?: string;
      thumbnails?: {
        high?: { url?: string };
        medium?: { url?: string };
        default?: { url?: string };
      };
    };
  }>;
  error?: { errors?: Array<{ reason?: string }> };
};

export async function searchYouTubeMusic(query: string, apiKey: string): Promise<YouTubeMusicResult[]> {
  const url = new URL(YOUTUBE_SEARCH_URL);
  url.searchParams.set("part", "snippet");
  url.searchParams.set("q", query);
  url.searchParams.set("type", "video,playlist");
  url.searchParams.set("maxResults", "6");
  url.searchParams.set("regionCode", "BR");
  url.searchParams.set("safeSearch", "moderate");
  url.searchParams.set("key", apiKey);

  const response = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(15_000) });
  const data = (await response.json().catch(() => ({}))) as YouTubeSearchResponse;

  if (!response.ok) {
    const reason = data.error?.errors?.[0]?.reason;
    if (reason === "quotaExceeded" || reason === "dailyLimitExceeded") {
      throw new Error("A cota diária de pesquisa do YouTube foi atingida. Tente novamente mais tarde.");
    }
    if (reason === "keyInvalid" || response.status === 401 || response.status === 403) {
      throw new Error("A busca do YouTube não está configurada. Verifique a chave e a API YouTube Data v3.");
    }
    console.error("[portal/music-assistant] YouTube API returned", response.status, reason ?? "unknown");
    throw new Error("Não foi possível consultar o YouTube agora. Tente novamente em instantes.");
  }

  return (data.items ?? []).flatMap((item) => {
    const snippet = item.snippet;
    const kind = item.id?.kind === "youtube#video" ? "video" : item.id?.kind === "youtube#playlist" ? "playlist" : null;
    const id = kind === "video" ? item.id?.videoId : kind === "playlist" ? item.id?.playlistId : undefined;
    const title = cleanText(snippet?.title, 180);
    if (!kind || !id || !title) return [];

    const thumbnailUrl = snippet?.thumbnails?.medium?.url ?? snippet?.thumbnails?.high?.url ?? snippet?.thumbnails?.default?.url ?? "";
    const url = kind === "video"
      ? `https://www.youtube.com/watch?v=${encodeURIComponent(id)}`
      : `https://www.youtube.com/playlist?list=${encodeURIComponent(id)}`;
    const embedUrl = kind === "video"
      ? `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}`
      : `https://www.youtube-nocookie.com/embed/videoseries?list=${encodeURIComponent(id)}`;

    return [{
      id,
      kind,
      title,
      channelTitle: cleanText(snippet?.channelTitle, 120),
      description: cleanText(snippet?.description, 260),
      thumbnailUrl,
      publishedAt: cleanText(snippet?.publishedAt, 40),
      url,
      embedUrl,
    }];
  });
}

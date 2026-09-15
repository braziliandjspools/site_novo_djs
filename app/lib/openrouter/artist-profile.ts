const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

export type GeneratedArtistProfile = {
  name: string;
  slug?: string;
  aliases?: string[];
  bio: string;
  shortBio: string;
  genres: string[];
  origin: string;
  yearsActive: string;
  notableWorks: string[];
  spotifyUrl?: string | null;
  featured?: boolean;
};

const SYSTEM_PROMPT = `Você é um editor musical da Brazilian Remix Service (BRS), especialista em artistas brasileiros e cenas de remix/DJ.

Gere perfis factuais, elegantes e úteis para páginas de artista de um acervo VIP de remixes.

Responda SOMENTE com JSON válido (array), sem markdown, neste formato:
[
  {
    "name": "Nome canônico",
    "aliases": ["apelidos ou grafias alternativas"],
    "shortBio": "1 frase impactante (máx. 140 caracteres)",
    "bio": "Bio completa em 2 a 4 parágrafos curtos, português do Brasil, tom editorial (não enciclopédia seca). Mencione origem, estilo, relevância e presença na cultura/DJ culture quando fizer sentido.",
    "genres": ["2 a 5 gêneros/estilos"],
    "origin": "cidade/estado ou região",
    "yearsActive": "ex.: 1975–atual",
    "notableWorks": ["3 a 6 obras ou hits conhecidos"],
    "spotifyUrl": null,
    "featured": true
  }
]

Regras:
- Português do Brasil.
- Sem inventar prêmios ou datas absurdas; se incerto, omita o detalhe.
- Prefira nomes canônicos com acentuação correta (Zé Ramalho, Luísa Sonza).
- notableWorks: títulos reais e conhecidos.
- spotifyUrl: deixe null (preenchemos depois).
- featured: true para ícones nacionais / alta relevância no acervo.`;

export async function generateKnownArtistProfiles(
  artistNames: string[],
): Promise<GeneratedArtistProfile[]> {
  const apiKey = process.env.OPENROUTER_API_KEY?.trim();
  const model = process.env.OPENROUTER_MODEL?.trim() || "google/gemini-2.5-flash";

  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY não configurada.");
  }
  if (artistNames.length === 0) {
    throw new Error("Informe ao menos um artista.");
  }

  const res = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.brazilianremixservice.com.br",
      "X-Title": "Brazilian Remix Service Artist Profiles",
    },
    body: JSON.stringify({
      model,
      temperature: 0.45,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: `Gere perfis completos para estes artistas:\n${artistNames.map((name) => `- ${name}`).join("\n")}`,
        },
      ],
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    console.error("OpenRouter artist profile error:", res.status, errText);
    throw new Error("Não foi possível gerar os perfis de artista.");
  }

  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = data.choices?.[0]?.message?.content;
  if (!content?.trim()) {
    throw new Error("Resposta vazia da IA.");
  }

  const match = content.trim().match(/\[[\s\S]*\]/);
  if (!match) {
    throw new Error("Resposta da IA sem JSON válido.");
  }

  const parsed = JSON.parse(match[0]) as GeneratedArtistProfile[];
  if (!Array.isArray(parsed) || parsed.length === 0) {
    throw new Error("Lista de perfis vazia.");
  }

  return parsed.map((item) => ({
    name: String(item.name ?? "").trim(),
    aliases: Array.isArray(item.aliases)
      ? item.aliases.map((alias) => String(alias).trim()).filter(Boolean)
      : [],
    shortBio: String(item.shortBio ?? "").trim(),
    bio: String(item.bio ?? "").trim(),
    genres: Array.isArray(item.genres)
      ? item.genres.map((genre) => String(genre).trim()).filter(Boolean).slice(0, 6)
      : [],
    origin: String(item.origin ?? "").trim(),
    yearsActive: String(item.yearsActive ?? "").trim(),
    notableWorks: Array.isArray(item.notableWorks)
      ? item.notableWorks.map((work) => String(work).trim()).filter(Boolean).slice(0, 8)
      : [],
    spotifyUrl: item.spotifyUrl?.trim() || null,
    featured: item.featured !== false,
  })).filter((item) => item.name && item.bio);
}

/**
 * Gera perfis curados via OpenRouter e grava em stdout (JSON).
 * Uso: node --env-file=.env.local scripts/generate-artist-profiles.mjs
 */
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

const ARTISTS = [
  "Zé Ramalho",
  "Alok",
  "Anitta",
  "Vintage Culture",
  "Pedro Sampaio",
  "Luísa Sonza",
  "Dennis DJ",
  "Kevin o Chris",
  "DJ Jéssika Luana",
  "Ludmilla",
  "Pabllo Vittar",
  "Ivete Sangalo",
  "Caetano Veloso",
  "Gilberto Gil",
  "Marisa Monte",
  "Seu Jorge",
  "Jorge Ben Jor",
  "Tim Maia",
  "Roberto Carlos",
  "Emicida",
  "Gloria Groove",
  "Iza",
  "Jão",
  "Luan Santana",
  "Gusttavo Lima",
  "Wesley Safadão",
  "Tropkillaz",
  "Liu",
  "Illusionize",
  "Dubdogz",
  "Cat Dealers",
  "Bruno Martini",
  "MC Livinho",
  "MC Don Juan",
  "Djonga",
  "Criolo",
  "Gal Costa",
  "Elis Regina",
  "Chico Buarque",
  "Djavan",
];

const SYSTEM_PROMPT = `Você é um editor musical da Brazilian Remix Service (BRS), especialista em artistas brasileiros e cenas de remix/DJ.

Gere perfis factuais, elegantes e úteis para páginas de artista de um acervo VIP de remixes.

Responda SOMENTE com JSON válido (array), sem markdown, neste formato:
[
  {
    "name": "Nome canônico",
    "aliases": ["apelidos ou grafias alternativas"],
    "shortBio": "1 frase impactante (máx. 140 caracteres)",
    "bio": "Bio completa em 2 a 4 parágrafos curtos, português do Brasil, tom editorial. Mencione origem, estilo, relevância e presença na cultura/DJ culture quando fizer sentido.",
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
- spotifyUrl: deixe null.
- featured: true para ícones nacionais / alta relevância no acervo.`;

async function generateBatch(names) {
  const apiKey = process.env.OPENROUTER_API_KEY?.trim();
  const model = process.env.OPENROUTER_MODEL?.trim() || "google/gemini-2.5-flash";
  if (!apiKey) throw new Error("OPENROUTER_API_KEY não configurada.");

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
      temperature: 0.4,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: `Gere perfis completos para estes artistas:\n${names.map((n) => `- ${n}`).join("\n")}`,
        },
      ],
    }),
  });

  if (!res.ok) {
    throw new Error(`OpenRouter ${res.status}: ${(await res.text()).slice(0, 500)}`);
  }

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error("Resposta vazia");
  const match = content.trim().match(/\[[\s\S]*\]/);
  if (!match) throw new Error("Sem JSON array");
  return JSON.parse(match[0]);
}

function chunk(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

const all = [];
for (const batch of chunk(ARTISTS, 10)) {
  console.error(`Gerando lote: ${batch.join(", ")}`);
  const profiles = await generateBatch(batch);
  all.push(...profiles);
}

const outPath = resolve("scripts/generated-artist-profiles.json");
writeFileSync(outPath, JSON.stringify(all, null, 2), "utf8");
console.error(`OK: ${all.length} perfis → ${outPath}`);

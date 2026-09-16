/**
 * Gera perfis NOVOS via OpenRouter e mescla com scripts/generated-artist-profiles.json.
 * Uso: node --env-file=.env.local scripts/generate-more-artist-profiles.mjs
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

/** Novos nomes a escanear / curar (além dos já existentes no JSON). */
const EXTRA_ARTISTS = [
  "Paula Fernandes",
  "Marília Mendonça",
  "Henrique & Juliano",
  "Jorge & Mateus",
  "Simone & Simaria",
  "Maiara & Maraisa",
  "Zé Neto & Cristiano",
  "Ana Castela",
  "Luan Pereira",
  "Gustavo Mioto",
  "Matheus & Kauan",
  "Israel & Rodolffo",
  "Hugo & Guilherme",
  "Naiara Azevedo",
  "Pixote",
  "Exaltasamba",
  "Grupo Revelação",
  "Thiaguinho",
  "Sorriso Maroto",
  "Turma do Pagode",
  "Péricles",
  "Mumuzinho",
  "Ferrugem",
  "Dilsinho",
  "Xande de Pilares",
  "MC Pedrinho",
  "MC Ryan SP",
  "MC Hariel",
  "MC Kevin",
  "MC Poze do Rodo",
  "MC Cabelinho",
  "DJ Marlboro",
  "Mr. Catra",
  "Tati Quebra Barraco",
  "Valesca Popozuda",
  "Lexa",
  "Melody",
  "MC Pipokinha",
  "Karol Conká",
  "Racionais MC's",
  "Mano Brown",
  "Projota",
  "Hungria Hip Hop",
  "Matuê",
  "Teto",
  "Wiu",
  "Veigh",
  "Kayblack",
  "BK",
  "Filipe Ret",
  "L7nnon",
  "Orochi",
  "Chefin",
  "Tz da Coronel",
  "Vulgo FK",
  "Baco Exu do Blues",
  "Rashid",
  "Black Alien",
  "Marcelo D2",
  "Nação Zumbi",
  "Chico Science",
  "Lenine",
  "Maria Bethânia",
  "Nara Leão",
  "Cartola",
  "Noel Rosa",
  "Pixinguinha",
  "Tom Jobim",
  "João Gilberto",
  "Vinicius de Moraes",
  "Toquinho",
  "Milton Nascimento",
  "Lô Borges",
  "Belchior",
  "Fagner",
  "Alceu Valença",
  "Elba Ramalho",
  "Geraldo Azevedo",
  "Maria Gadú",
  "Ana Carolina",
  "Vanessa da Mata",
  "Céu",
  "Silva",
  "Liniker",
  "Marina Sena",
  "Jão",
  "Lagum",
  "Melim",
  "Vitor Kley",
  "TIAGO IORC",
  "Fresno",
  "NX Zero",
  "Skank",
  "Capital Inicial",
  "Legião Urbana",
  "Os Paralamas do Sucesso",
  "Titãs",
  "Barão Vermelho",
  "Cazuza",
  "Rita Lee",
  "Raul Seixas",
  "Engenheiros do Hawaii",
  "Jota Quest",
  "Charlie Brown Jr.",
  "Detonautas",
  "Pitty",
  "Negra Li",
  "Claudia Leitte",
  "Carla Perez",
  "É o Tchan",
  "Asa de Águia",
  "Bell Marques",
  "Durval Lelys",
  "Chiclete com Banana",
  "Aviões do Forró",
  "Calcinha Preta",
  "Mastruz com Leite",
  "Limão com Mel",
  "Solange Almeida",
  "Xand Avião",
  "Jonas Esticado",
  "Tarcísio do Acordeon",
  "João Gomes",
  "Vitor Fernandes",
  "Raphaela Santos",
  "Zé Vaqueiro",
  "Eric Land",
  "NATTAN",
  "Ávine Vinny",
  "Felipão",
  "Os Barões da Pisadinha",
  "Raí Saia Rodada",
  "Biá",
  "Alok",
  "Vintage Culture",
  "KVSH",
  "Chemical Surf",
  "Felguk",
  "Gabe",
  "Cool Cascavel",
  "INNDRIVE",
  "Bhaskar",
  "Fancy Inc",
  "WOAK",
  "GRINGO",
  "Malifoo",
  "GHOSTT",
  "Seakret",
  "Jetlag Music",
  "Dubdogz",
  "ALOK",
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
- Prefira nomes canônicos com acentuação correta.
- notableWorks: títulos reais e conhecidos.
- spotifyUrl: deixe null.
- featured: true.`;

function slugify(name) {
  return String(name)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

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

const outPath = resolve("scripts/generated-artist-profiles.json");
const existing = existsSync(outPath) ? JSON.parse(readFileSync(outPath, "utf8")) : [];
const existingSlugs = new Set(existing.map((p) => slugify(p.name)));

const toGenerate = [...new Set(EXTRA_ARTISTS)]
  .filter((name) => !existingSlugs.has(slugify(name)))
  .slice(0, 80);

console.error(`Já existem: ${existing.length}. Novos a gerar: ${toGenerate.length}`);

const fresh = [];
for (const batch of chunk(toGenerate, 8)) {
  console.error(`Gerando lote: ${batch.join(", ")}`);
  try {
    const profiles = await generateBatch(batch);
    for (const profile of profiles) {
      const s = slugify(profile.name);
      if (existingSlugs.has(s)) continue;
      existingSlugs.add(s);
      fresh.push({ ...profile, featured: true });
    }
  } catch (err) {
    console.error(`Falha no lote: ${err.message}`);
  }
}

const merged = [...existing, ...fresh];
writeFileSync(outPath, JSON.stringify(merged, null, 2), "utf8");
console.error(`OK: +${fresh.length} novos → total ${merged.length} em ${outPath}`);

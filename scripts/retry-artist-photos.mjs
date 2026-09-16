/**
 * Retry de fotos que falharam — usa URL original da Wikipedia sem forçar 800px.
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { resolve, join } from "node:path";

const OUT_DIR = resolve("public/images/artists");
const ARTISTS_TS = resolve("app/lib/vip-known-artists.ts");
const UA = "BrazilianRemixService/1.0 (artist-library; contact@brazilianremixservice.com.br)";

function slugify(name) {
  return String(name)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const MISSING = [
  "Alok",
  "Iza",
  "Toquinho",
  "DJ Jéssika Luana",
  "Tropkillaz",
  "Liu",
  "Illusionize",
  "Cat Dealers",
];

// Discover which still have null imageUrl
const source = readFileSync(ARTISTS_TS, "utf8");
const nullNames = [];
const blockRe = /name:\s*"([^"]+)"[\s\S]*?imageUrl:\s*([^,\n]+)/g;
let m;
while ((m = blockRe.exec(source))) {
  const name = m[1];
  const img = m[2].trim();
  if (img === "null" || img === '""') nullNames.push(name);
}

const targets = [...new Set([...MISSING, ...nullNames])];
console.error(`Retry: ${targets.length} artistas`);

async function wikiSummary(lang, title) {
  const url = `https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;
  const res = await fetch(url, { headers: { "User-Agent": UA, Accept: "application/json" } });
  if (!res.ok) return null;
  return res.json();
}

async function wikiSearch(lang, q) {
  const url = new URL(`https://${lang}.wikipedia.org/w/api.php`);
  url.searchParams.set("action", "query");
  url.searchParams.set("list", "search");
  url.searchParams.set("srsearch", q);
  url.searchParams.set("srlimit", "5");
  url.searchParams.set("format", "json");
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  if (!res.ok) return [];
  const data = await res.json();
  return (data?.query?.search ?? []).map((s) => s.title);
}

const ALIASES = {
  Alok: ["Alok (DJ)", "Alok Petrillo"],
  Iza: ["Iza (cantora)", "Isabela Cristina Correia de Lima Lima"],
  Toquinho: ["Toquinho"],
  "DJ Jéssika Luana": ["Jéssika Luana"],
  Liu: ["Liu (DJ)", "Liu DJ"],
  Illusionize: ["Illusionize"],
  "Cat Dealers": ["Cat Dealers"],
  Tropkillaz: ["Tropkillaz"],
};

async function findImage(name) {
  const tries = [name, ...(ALIASES[name] ?? [])];
  for (const lang of ["pt", "en"]) {
    for (const t of tries) {
      let summary = await wikiSummary(lang, t);
      if (!summary?.thumbnail && !summary?.originalimage) {
        const titles = await wikiSearch(lang, t);
        for (const title of titles) {
          summary = await wikiSummary(lang, title);
          if (summary?.thumbnail || summary?.originalimage) break;
        }
      }
      const src = summary?.originalimage?.source || summary?.thumbnail?.source;
      if (src) return src;
    }
  }
  return null;
}

mkdirSync(OUT_DIR, { recursive: true });
let updated = source;
let ok = 0;

for (const name of targets) {
  const slug = slugify(name);
  const dest = join(OUT_DIR, `${slug}.jpg`);
  if (existsSync(dest)) {
    const path = `/images/artists/${slug}.jpg`;
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    updated = updated.replace(
      new RegExp(`(name:\\s*"${escaped}"[\\s\\S]*?imageUrl:\\s*)([^,\\n]+)`, "m"),
      `$1${JSON.stringify(path)}`,
    );
    console.error(`= ${name}`);
    continue;
  }

  process.stderr.write(`? ${name}… `);
  const url = await findImage(name);
  if (!url) {
    console.error("sem foto");
    continue;
  }
  try {
    const res = await fetch(url, { headers: { "User-Agent": UA }, redirect: "follow" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < 1500) throw new Error("pequeno");
    writeFileSync(dest, buf);
    const path = `/images/artists/${slug}.jpg`;
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    updated = updated.replace(
      new RegExp(`(name:\\s*"${escaped}"[\\s\\S]*?imageUrl:\\s*)([^,\\n]+)`, "m"),
      `$1${JSON.stringify(path)}`,
    );
    ok += 1;
    console.error("OK");
  } catch (e) {
    console.error(`falha: ${e.message}`);
  }
}

writeFileSync(ARTISTS_TS, updated, "utf8");
console.error(`Retry OK: +${ok}`);

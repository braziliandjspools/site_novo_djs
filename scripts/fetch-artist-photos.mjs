/**
 * Busca fotos de artistas (Wikipedia/Wikimedia) e salva em public/images/artists/.
 * Depois atualiza imageUrl em app/lib/vip-known-artists.ts
 *
 * Uso: node scripts/fetch-artist-photos.mjs
 */
import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve, join } from "node:path";

const OUT_DIR = resolve("public/images/artists");
const ARTISTS_TS = resolve("app/lib/vip-known-artists.ts");
const UA =
  "BrazilianRemixService/1.0 (artist-library; contact@brazilianremixservice.com.br)";

function slugify(name) {
  return String(name)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function extractArtistNames(source) {
  const names = [];
  const re = /name:\s*"([^"]+)"/g;
  let m;
  while ((m = re.exec(source))) names.push(m[1]);
  return names;
}

async function wikiSummary(lang, title) {
  const url = `https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;
  const res = await fetch(url, {
    headers: { "User-Agent": UA, Accept: "application/json" },
  });
  if (!res.ok) return null;
  return res.json();
}

async function wikiSearchTitle(lang, query) {
  const url = new URL(`https://${lang}.wikipedia.org/w/api.php`);
  url.searchParams.set("action", "query");
  url.searchParams.set("list", "search");
  url.searchParams.set("srsearch", query);
  url.searchParams.set("srlimit", "3");
  url.searchParams.set("format", "json");
  url.searchParams.set("origin", "*");
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  if (!res.ok) return null;
  const data = await res.json();
  return data?.query?.search?.[0]?.title ?? null;
}

async function resolveThumbnail(name) {
  const queries = [
    name,
    `${name} (cantor)`,
    `${name} (cantora)`,
    `${name} (músico)`,
    `${name} (DJ)`,
    `${name} cantor`,
    `${name} música`,
  ];

  for (const lang of ["pt", "en"]) {
    for (const q of queries) {
      try {
        // tenta summary direto
        let summary = await wikiSummary(lang, q);
        if (!summary || summary.type === "disambiguation") {
          const title = await wikiSearchTitle(lang, q);
          if (!title) continue;
          summary = await wikiSummary(lang, title);
        }
        if (!summary || summary.type === "disambiguation") continue;
        const src =
          summary.originalimage?.source ||
          summary.thumbnail?.source ||
          null;
        if (src) {
          const big = src.replace(/\/\d+px-/, "/800px-");
          return { url: big, source: `${lang}.wikipedia`, title: summary.title };
        }
      } catch {
        /* tenta próximo */
      }
      await sleep(120);
    }
  }
  return null;
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function downloadImage(url, destPath) {
  const res = await fetch(url, {
    headers: { "User-Agent": UA, Accept: "image/*" },
    redirect: "follow",
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const ctype = res.headers.get("content-type") || "";
  if (!ctype.includes("image") && !url.match(/\.(jpe?g|png|webp)/i)) {
    throw new Error(`Not an image: ${ctype}`);
  }
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < 2000) throw new Error("Arquivo muito pequeno");
  writeFileSync(destPath, buf);
  return buf.length;
}

mkdirSync(OUT_DIR, { recursive: true });

const source = readFileSync(ARTISTS_TS, "utf8");
const names = extractArtistNames(source);
console.error(`Artistas no catálogo: ${names.length}`);

const mapping = {};
let ok = 0;
let skip = 0;
let fail = 0;

for (const name of names) {
  const slug = slugify(name);
  const jpg = join(OUT_DIR, `${slug}.jpg`);
  const png = join(OUT_DIR, `${slug}.png`);
  const webp = join(OUT_DIR, `${slug}.webp`);

  if (existsSync(jpg) || existsSync(png) || existsSync(webp)) {
    const existing = existsSync(jpg) ? jpg : existsSync(png) ? png : webp;
    const ext = existing.endsWith(".png") ? "png" : existing.endsWith(".webp") ? "webp" : "jpg";
    mapping[name] = `/images/artists/${slug}.${ext}`;
    skip += 1;
    console.error(`= já existe: ${name}`);
    continue;
  }

  process.stderr.write(`? buscando: ${name}… `);
  const hit = await resolveThumbnail(name);
  if (!hit) {
    fail += 1;
    console.error("sem foto");
    continue;
  }

  try {
    // força jpg no nome local
    await downloadImage(hit.url, jpg);
    mapping[name] = `/images/artists/${slug}.jpg`;
    ok += 1;
    console.error(`OK (${hit.source})`);
  } catch (err) {
    fail += 1;
    console.error(`falha download: ${err.message}`);
  }

  await sleep(200);
}

// Atualiza imageUrl no TS: substitui null ou paths antigos genéricos quando temos foto nova
let updated = source;
for (const [name, imagePath] of Object.entries(mapping)) {
  // encontra bloco do artista e troca imageUrl
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const blockRe = new RegExp(
    `(name:\\s*"${escaped}"[\\s\\S]*?imageUrl:\\s*)([^,\\n]+)`,
    "m",
  );
  if (blockRe.test(updated)) {
    updated = updated.replace(blockRe, `$1${JSON.stringify(imagePath)}`);
  }
}

writeFileSync(ARTISTS_TS, updated, "utf8");
writeFileSync(
  resolve("scripts/artist-photo-map.json"),
  JSON.stringify(mapping, null, 2),
  "utf8",
);

console.error(`\nPronto: ${ok} baixadas, ${skip} existentes, ${fail} sem foto.`);
console.error(`Mapa: scripts/artist-photo-map.json`);

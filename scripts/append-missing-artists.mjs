/**
 * Acrescenta stubs featured em vip-known-artists.ts para nomes ainda ausentes.
 * Uso: node scripts/append-missing-artists.mjs
 */
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

function slugify(name) {
  return String(name)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function esc(value) {
  return JSON.stringify(value ?? null);
}

const knownPath = resolve("app/lib/vip-known-artists.ts");
const knownSrc = readFileSync(knownPath, "utf8");
const knownNames = [...knownSrc.matchAll(/name:\s*"([^"]+)"/g)].map((m) => m[1]);
const knownSlugs = new Set(knownNames.map(slugify));

const extrasSrc = readFileSync(resolve("scripts/generate-more-artist-profiles.mjs"), "utf8");
const extrasMatch = extrasSrc.match(/const EXTRA_ARTISTS = \[([\s\S]*?)\];/);
const extras = extrasMatch
  ? [...extrasMatch[1].matchAll(/"([^"]+)"/g)].map((m) => m[1])
  : [];

const missing = [];
const seen = new Set();
for (const name of extras) {
  const slug = slugify(name);
  if (!slug || seen.has(slug) || knownSlugs.has(slug)) continue;
  seen.add(slug);
  // Canonicalize display casing a bit
  const display =
    name === name.toUpperCase() && name.length > 3
      ? name
          .toLowerCase()
          .replace(/\b\w/g, (c) => c.toUpperCase())
          .replace(/\bMc\b/g, "MC")
          .replace(/\bDj\b/g, "DJ")
      : name;
  missing.push(display);
}

if (missing.length === 0) {
  console.log("Nenhum artista ausente.");
  process.exit(0);
}

const stubs = missing
  .map(
    (name) => `  {
    name: ${esc(name)},
    aliases: [],
    shortBio: ${esc(`${name} no acervo BRS — remixes, edits e versões para DJs.`)},
    bio: ${esc(`${name} integra o catálogo VIP da Brazilian Remix Service, com remixes, extended mixes e edits organizados para DJs.\n\nExplore o perfil para ouvir faixas relacionadas no acervo e enviar packs ao BRS Downloader.`)},
    genres: [],
    origin: null,
    yearsActive: null,
    notableWorks: [],
    imageUrl: null,
    spotifyUrl: null,
    featured: true,
  }`,
  )
  .join(",\n");

const markerLf = "\n];\n\nexport function knownArtistSlug";
const markerCrlf = "\r\n];\r\n\r\nexport function knownArtistSlug";
const insertAt = knownSrc.includes(markerCrlf)
  ? markerCrlf
  : knownSrc.includes(markerLf)
    ? markerLf
    : null;
if (!insertAt) {
  console.error("Marcador de inserção não encontrado em vip-known-artists.ts");
  process.exit(1);
}

const joiner = insertAt.includes("\r\n") ? "\r\n" : "\n";
const next = knownSrc.replace(
  insertAt,
  `,${joiner}${stubs}${joiner}];${joiner}${joiner}export function knownArtistSlug`,
);
writeFileSync(knownPath, next, "utf8");
console.log(`Adicionados ${missing.length} artistas stub em vip-known-artists.ts`);
console.log(missing.join("\n"));

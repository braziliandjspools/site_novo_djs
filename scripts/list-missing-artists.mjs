/**
 * Lista artistas do EXTRA_ARTISTS / generated JSON que ainda não estão em vip-known-artists.ts
 * Uso: node scripts/list-missing-artists.mjs
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

function slugify(name) {
  return String(name)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const knownSrc = readFileSync(resolve("app/lib/vip-known-artists.ts"), "utf8");
const knownNames = [...knownSrc.matchAll(/name:\s*"([^"]+)"/g)].map((m) => m[1]);
const knownSlugs = new Set(knownNames.map(slugify));

const extrasPath = resolve("scripts/generate-more-artist-profiles.mjs");
const extrasSrc = readFileSync(extrasPath, "utf8");
const extrasMatch = extrasSrc.match(/const EXTRA_ARTISTS = \[([\s\S]*?)\];/);
const extras = extrasMatch
  ? [...extrasMatch[1].matchAll(/"([^"]+)"/g)].map((m) => m[1])
  : [];

let generated = [];
const genPath = resolve("scripts/generated-artist-profiles.json");
if (existsSync(genPath)) {
  generated = JSON.parse(readFileSync(genPath, "utf8"));
}

const candidates = [
  ...extras,
  ...generated.map((p) => p.name).filter(Boolean),
];

const missing = [];
const seen = new Set();
for (const name of candidates) {
  const slug = slugify(name);
  if (!slug || seen.has(slug) || knownSlugs.has(slug)) continue;
  seen.add(slug);
  missing.push(name);
}

console.log(JSON.stringify({ known: knownNames.length, missingCount: missing.length, missing }, null, 2));

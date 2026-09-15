import { readFileSync, writeFileSync } from "node:fs";

const profiles = JSON.parse(readFileSync("scripts/generated-artist-profiles.json", "utf8"));

const legacyImages = {
  "DJ Jéssika Luana": {
    imageUrl: "/images/spotify-dj-banner.jpg",
    spotifyUrl: "https://open.spotify.com/intl-pt/artist/5NdJcuUWBt4pNGJC2sI6iZ",
  },
  Alok: { imageUrl: "/images/music-producer.png" },
  "Vintage Culture": { imageUrl: "/images/curadoria-brs-v3.jpg" },
  Anitta: { imageUrl: "/images/musicas-portal.png" },
  "Pedro Sampaio": { imageUrl: "/images/folder.jpg" },
  "Luísa Sonza": { imageUrl: "/images/curadoria-brs.jpg" },
  "Dennis DJ": { imageUrl: "/images/brs-default-cover.png" },
  "Kevin o Chris": { imageUrl: "/images/brs-logo.jpg" },
};

function esc(value) {
  return JSON.stringify(value ?? null);
}

function indentArr(arr, pad = "    ") {
  if (!arr?.length) return "[]";
  return `[\n${arr.map((item) => `${pad}  ${esc(item)},`).join("\n")}\n${pad}]`;
}

const entries = profiles
  .map((profile) => {
    const legacy = legacyImages[profile.name] ?? {};
    const aliases = Array.isArray(profile.aliases) ? profile.aliases : [];
    const genres = Array.isArray(profile.genres) ? profile.genres : [];
    const works = Array.isArray(profile.notableWorks) ? profile.notableWorks : [];
    const imageUrl = legacy.imageUrl ?? null;
    const spotifyUrl = legacy.spotifyUrl ?? profile.spotifyUrl ?? null;
    return `  {
    name: ${esc(profile.name)},
    aliases: ${indentArr(aliases)},
    shortBio: ${esc(profile.shortBio)},
    bio: ${esc(profile.bio)},
    genres: ${indentArr(genres)},
    origin: ${esc(profile.origin)},
    yearsActive: ${esc(profile.yearsActive)},
    notableWorks: ${indentArr(works)},
    imageUrl: ${esc(imageUrl)},
    spotifyUrl: ${esc(spotifyUrl)},
    featured: ${profile.featured !== false},
  }`;
  })
  .join(",\n");

const file = `import { slugifyFolderName } from "./vip-music-slugs";

export type VipKnownArtist = {
  /** Nome canônico de exibição */
  name: string;
  /** Slug estável (gerado do name se omitido) */
  slug?: string;
  /** Nomes alternativos que batem no mesmo perfil */
  aliases?: string[];
  /** Frase curta para cards / listagens */
  shortBio?: string | null;
  /** Bio completa (parágrafos) */
  bio?: string | null;
  /** Gêneros / estilos associados */
  genres?: string[];
  /** Cidade/estado ou região de origem */
  origin?: string | null;
  /** Ex.: 1975–atual */
  yearsActive?: string | null;
  /** Hits / obras de referência */
  notableWorks?: string[];
  /** Foto do perfil (local ou URL remota permitida no next.config) */
  imageUrl?: string | null;
  spotifyUrl?: string | null;
  /** Destacar na grade /musicas/artistas */
  featured?: boolean;
};

/**
 * Catálogo curado de artistas conhecidos no acervo VIP.
 * Bios geradas/editadas com apoio de OpenRouter (editorial BRS).
 * Sem entrada aqui o perfil ainda existe (via slug), mas sem foto/bio oficiais.
 */
export const VIP_KNOWN_ARTISTS: VipKnownArtist[] = [
${entries}
];

export function knownArtistSlug(artist: VipKnownArtist): string {
  return artist.slug?.trim() || slugifyFolderName(artist.name);
}

export function listFeaturedKnownArtists(): Array<VipKnownArtist & { slug: string }> {
  return VIP_KNOWN_ARTISTS.filter((artist) => artist.featured !== false).map((artist) => ({
    ...artist,
    slug: knownArtistSlug(artist),
  }));
}

export function findKnownArtistBySlug(slug: string): (VipKnownArtist & { slug: string }) | null {
  const normalized = slugifyFolderName(slug);
  if (!normalized) return null;

  for (const artist of VIP_KNOWN_ARTISTS) {
    const canonical = knownArtistSlug(artist);
    if (canonical === normalized) {
      return { ...artist, slug: canonical };
    }
    for (const alias of artist.aliases ?? []) {
      if (slugifyFolderName(alias) === normalized) {
        return { ...artist, slug: canonical };
      }
    }
  }
  return null;
}

/** Resolve slug canônico quando o crédito bate com um artista conhecido (ou aliases). */
export function resolveKnownArtistFromCredit(
  displayArtist: string,
): (VipKnownArtist & { slug: string }) | null {
  const parts = splitArtistCredits(displayArtist);
  for (const part of parts) {
    const hit = findKnownArtistBySlug(slugifyFolderName(part));
    if (hit) return hit;
  }
  return null;
}

export function splitArtistCredits(displayArtist: string): string[] {
  return displayArtist
    .split(/\\s*(?:,|&|\\/|\\bx\\b|\\bfeat\\.?\\b|\\bft\\.?\\b|\\bvs\\.?\\b)\\s*/i)
    .map((part) => part.trim())
    .filter(Boolean);
}
`;

writeFileSync("app/lib/vip-known-artists.ts", file, "utf8");
console.log(`Wrote ${profiles.length} artists to app/lib/vip-known-artists.ts`);

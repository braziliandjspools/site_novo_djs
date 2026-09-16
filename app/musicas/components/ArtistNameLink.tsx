"use client";

import Link from "next/link";
import type { MouseEvent, ReactNode } from "react";
import { UNKNOWN_ARTIST_LABEL } from "../../lib/track-display-metadata";
import { artistsHref, slugifyArtistName } from "../../lib/vip-music-slugs";
import {
  resolveKnownArtistFromCredit,
  splitArtistCredits,
} from "../../lib/vip-known-artists";

type ArtistNameLinkProps = {
  artist: string;
  className?: string;
  /** Quando true, só o primeiro crédito vira link (restante em texto). */
  splitCredits?: boolean;
};

const LINK_HOVER =
  "transition-colors duration-150 hover:text-[#1ed760] hover:underline underline-offset-2 decoration-[#1ed760]/80";

function stopRow(event: MouseEvent) {
  event.stopPropagation();
}

function mergeClass(base: string, extra: string) {
  return `${base} ${extra}`.trim();
}

/**
 * Link para `/musicas/artistas/[slug]`.
 * Não linka "Artista desconhecido".
 */
export function ArtistNameLink({
  artist,
  className = "truncate text-[12px] leading-snug text-white/50",
  splitCredits = true,
}: ArtistNameLinkProps) {
  const label = artist.trim();
  if (!label || label === UNKNOWN_ARTIST_LABEL) {
    return <span className={className}>{label || UNKNOWN_ARTIST_LABEL}</span>;
  }

  if (!splitCredits) {
    const known = resolveKnownArtistFromCredit(label);
    const href = artistsHref(known?.slug ?? slugifyArtistName(label));
    return (
      <Link
        href={href}
        prefetch={false}
        className={mergeClass(className, LINK_HOVER)}
        onClick={stopRow}
        title={`Ver perfil de ${known?.name ?? label}`}
      >
        {label}
      </Link>
    );
  }

  const parts = splitArtistCredits(label);
  if (parts.length <= 1) {
    const known = resolveKnownArtistFromCredit(label);
    const href = artistsHref(known?.slug ?? slugifyArtistName(label));
    return (
      <Link
        href={href}
        prefetch={false}
        className={mergeClass(className, LINK_HOVER)}
        onClick={stopRow}
        title={`Ver perfil de ${known?.name ?? label}`}
      >
        {label}
      </Link>
    );
  }

  const nodes: ReactNode[] = [];
  parts.forEach((part, index) => {
    if (index > 0) {
      nodes.push(
        <span key={`sep-${index}`} className="text-white/35">
          {", "}
        </span>,
      );
    }
    const known = resolveKnownArtistFromCredit(part);
    const href = artistsHref(known?.slug ?? slugifyArtistName(part));
    nodes.push(
      <Link
        key={`${part}-${index}`}
        href={href}
        prefetch={false}
        className={LINK_HOVER}
        onClick={stopRow}
        title={`Ver perfil de ${known?.name ?? part}`}
      >
        {part}
      </Link>,
    );
  });

  return <span className={className}>{nodes}</span>;
}

export function artistProfileHrefFromName(artist: string): string | null {
  const label = artist.trim();
  if (!label || label === UNKNOWN_ARTIST_LABEL) return null;
  const known = resolveKnownArtistFromCredit(label);
  return artistsHref(known?.slug ?? slugifyArtistName(splitArtistCredits(label)[0] ?? label));
}

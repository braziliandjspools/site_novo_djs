"use client";

import Image from "next/image";
import type { ReactNode } from "react";
import { MUSICAS_HERO_BG_SRC, MUSICAS_HERO_COVER_SRC } from "../lib/musicas-hero-art";

export type CollectionHeroStat = {
  label: string;
  accent?: boolean;
};

type CollectionHeroProps = {
  title: string;
  eyebrow?: string;
  description?: string;
  coverUrl?: string | null;
  /** Metadados dinâmicos (coleções / álbuns / faixas / premium). */
  stats?: CollectionHeroStat[];
  /** @deprecated use stats */
  albumCount?: number;
  /** @deprecated use stats */
  trackCount?: number;
  hasVip: boolean;
  badgeActions?: ReactNode;
  actions?: ReactNode;
};

/** Hero de coleção — capa em destaque, texto alinhado à esquerda no mobile, ações de streaming. */
export function CollectionHero({
  title,
  eyebrow = "Coleção",
  description,
  coverUrl,
  stats,
  albumCount,
  trackCount,
  hasVip,
  badgeActions,
  actions,
}: CollectionHeroProps) {
  const cover = coverUrl?.trim() || MUSICAS_HERO_COVER_SRC;

  const resolvedStats: CollectionHeroStat[] =
    stats ??
    [
      typeof albumCount === "number"
        ? { label: `${albumCount} ${albumCount === 1 ? "álbum" : "álbuns"}` }
        : null,
      typeof trackCount === "number"
        ? { label: `${trackCount} ${trackCount === 1 ? "faixa" : "faixas"}` }
        : null,
      {
        label: hasVip ? "Premium ativo" : "Prévia 1 min",
        accent: hasVip,
      },
    ].filter(Boolean) as CollectionHeroStat[];

  return (
    <section className="relative mb-6 overflow-hidden rounded-2xl">
      <Image
        src={MUSICAS_HERO_BG_SRC}
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover object-center"
        aria-hidden
      />
      <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/60 to-black/35" aria-hidden />
      <div className="absolute inset-0 bg-gradient-to-t from-[#121212] via-transparent to-black/30" aria-hidden />

      <div className="relative flex flex-col gap-5 px-4 py-7 sm:flex-row sm:items-end sm:gap-7 sm:px-8 sm:py-9">
        <div className="relative mx-auto h-40 w-40 flex-shrink-0 overflow-hidden rounded-lg shadow-[0_18px_40px_rgba(0,0,0,0.55)] ring-1 ring-white/15 sm:mx-0 sm:h-48 sm:w-48 md:h-52 md:w-52">
          <Image
            src={cover}
            alt={title}
            fill
            className="object-cover"
            sizes="208px"
            priority
            unoptimized={cover.startsWith("/api/")}
          />
        </div>

        <div className="min-w-0 flex-1 text-left">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/70">{eyebrow}</p>
          <h1 className="mt-1.5 break-words text-3xl font-black tracking-tight text-white sm:text-4xl md:text-5xl">
            {title}
          </h1>
          {description ? (
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/65">{description}</p>
          ) : null}

          {resolvedStats.length > 0 ? (
            <p className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-zinc-300">
              {resolvedStats.map((stat, index) => (
                <span key={`${stat.label}-${index}`} className="inline-flex items-center gap-2">
                  {index > 0 ? <span className="text-zinc-600" aria-hidden>·</span> : null}
                  <span
                    className={
                      stat.accent ? "font-semibold text-[#1ed760]" : "font-medium tabular-nums text-zinc-300"
                    }
                  >
                    {stat.label}
                  </span>
                </span>
              ))}
              {badgeActions}
            </p>
          ) : null}

          {actions ? (
            <div className="mt-5 flex flex-wrap items-center gap-2 sm:gap-3">{actions}</div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

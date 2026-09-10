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
  stats?: CollectionHeroStat[];
  albumCount?: number;
  trackCount?: number;
  hasVip: boolean;
  badgeActions?: ReactNode;
  actions?: ReactNode;
};

/** Hero de coleção — minimalista, alinhado a Atualizações. */
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
    ([
      typeof albumCount === "number"
        ? { label: `${albumCount} ${albumCount === 1 ? "álbum" : "álbuns"}` }
        : null,
      typeof trackCount === "number"
        ? { label: `${trackCount} ${trackCount === 1 ? "faixa" : "faixas"}` }
        : null,
      {
        label: hasVip ? "Premium ativo" : "Só navegação",
        accent: hasVip,
      },
    ].filter(Boolean) as CollectionHeroStat[]);

  return (
    <section className="relative mb-6 overflow-hidden rounded-xl">
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <Image
          src={MUSICAS_HERO_BG_SRC}
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/70 to-black/40" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#121212] via-transparent to-black/30" />
      </div>

      <div className="relative z-10 flex flex-col gap-5 px-4 py-8 sm:flex-row sm:items-end sm:gap-7 sm:px-7 sm:py-10">
        <div className="relative mx-auto h-40 w-40 flex-shrink-0 overflow-hidden rounded-md shadow-[0_16px_40px_rgba(0,0,0,0.55)] ring-1 ring-white/10 sm:mx-0 sm:h-48 sm:w-48 md:h-52 md:w-52">
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

        <div className="min-w-0 flex-1 text-center sm:text-left">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-400">{eyebrow}</p>
          <h1 className="mt-1.5 text-page-title break-words text-white">{title}</h1>
          {description ? <p className="mt-2 max-w-2xl text-sm text-zinc-400">{description}</p> : null}

          {resolvedStats.length > 0 ? (
            <p className="mt-4 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-sm text-zinc-400 sm:justify-start">
              {resolvedStats.map((stat, index) => (
                <span key={`${stat.label}-${index}`} className="inline-flex items-center gap-2">
                  {index > 0 ? (
                    <span className="text-zinc-700" aria-hidden>
                      ·
                    </span>
                  ) : null}
                  <span className={stat.accent ? "text-[#1ed760]" : "tabular-nums text-zinc-300"}>
                    {stat.label}
                  </span>
                </span>
              ))}
              {badgeActions}
            </p>
          ) : null}

          {actions ? <div className="mt-5 flex flex-wrap justify-center gap-2 sm:justify-start">{actions}</div> : null}
        </div>
      </div>
    </section>
  );
}

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

/** Hero de coleção — mesma linguagem BR suave de Atualizações. */
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
    <section className="relative mb-6 overflow-hidden rounded-2xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.4)]">
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <Image
          src={MUSICAS_HERO_BG_SRC}
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-[#009739]/28 via-[#002776]/25 to-black/70" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-black/25" />
        <div className="absolute -left-10 top-0 h-36 w-36 rounded-full bg-[#1ed760]/10 blur-3xl" />
        <div className="absolute -right-6 bottom-0 h-32 w-32 rounded-full bg-[#6B9FFF]/10 blur-3xl" />
      </div>

      <div className="br-stripe-thin relative z-10" />

      <div className="relative z-10 flex flex-col gap-5 overflow-visible px-4 py-7 sm:flex-row sm:items-end sm:gap-7 sm:px-8 sm:py-9">
        <div className="relative mx-auto h-40 w-40 flex-shrink-0 sm:mx-0 sm:h-48 sm:w-48 md:h-52 md:w-52">
          <div
            className="absolute -inset-[2px] rounded-lg bg-gradient-to-br from-[#009739]/75 to-[#002776]/75 opacity-80"
            aria-hidden
          />
          <div className="relative h-full w-full overflow-hidden rounded-[8px] shadow-[0_18px_40px_rgba(0,0,0,0.55)] ring-1 ring-white/15">
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
        </div>

        <div className="min-w-0 flex-1 overflow-visible text-center sm:text-left">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#7dffb0]">{eyebrow}</p>
          <h1 className="mt-1.5 text-page-title break-words text-white">{title}</h1>
          {description ? <p className="mt-2 max-w-2xl text-sm text-zinc-300">{description}</p> : null}
          <div className="mt-3 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
            {resolvedStats.map((stat) => (
              <span
                key={stat.label}
                className={`text-badge rounded-full px-3 py-1.5 ring-1 ${
                  stat.accent
                    ? "bg-[#1ed760]/18 text-[#1ed760] ring-[#1ed760]/35"
                    : "bg-[#009739]/18 text-[#7dffb0] ring-[#1ed760]/30"
                }`}
              >
                {stat.label}
              </span>
            ))}
            {badgeActions}
          </div>
          {actions ? <div className="mt-4 flex flex-wrap justify-center gap-2 sm:justify-start">{actions}</div> : null}
        </div>
      </div>
    </section>
  );
}

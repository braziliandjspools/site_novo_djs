import Image from "next/image";
import type { ReactNode } from "react";
import { MUSICAS_HERO_BG_SRC, MUSICAS_HERO_COVER_SRC } from "../lib/musicas-hero-art";

type CollectionHeroProps = {
  title: string;
  eyebrow?: string;
  description?: string;
  coverUrl?: string | null;
  albumCount?: number;
  trackCount?: number;
  hasVip: boolean;
  badgeActions?: ReactNode;
  actions?: ReactNode;
};

/** Hero de coleção no mesmo padrão visual de Atualizações. */
export function CollectionHero({
  title,
  eyebrow = "Coleção",
  description = "Ouça os volumes e envie a coletânea ao BRS Downloader.",
  coverUrl,
  albumCount,
  trackCount,
  hasVip,
  badgeActions,
  actions,
}: CollectionHeroProps) {
  const cover = coverUrl?.trim() || MUSICAS_HERO_COVER_SRC;

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
      <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/55 to-black/30" aria-hidden />
      <div className="absolute inset-0 bg-gradient-to-t from-[#121212] via-transparent to-black/25" aria-hidden />

      <div className="relative flex flex-col gap-5 px-4 py-7 sm:flex-row sm:items-end sm:gap-7 sm:px-8 sm:py-9">
        <div className="relative mx-auto h-36 w-36 flex-shrink-0 overflow-hidden rounded-lg shadow-[0_18px_40px_rgba(0,0,0,0.5)] ring-1 ring-white/15 sm:mx-0 sm:h-44 sm:w-44">
          <Image
            src={cover}
            alt={title}
            fill
            className="object-cover"
            sizes="176px"
            priority
            unoptimized={cover.startsWith("/api/")}
          />
        </div>

        <div className="min-w-0 flex-1 text-center sm:text-left">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/75">{eyebrow}</p>
          <h1 className="mt-1.5 break-words text-3xl font-black tracking-tight text-white sm:text-4xl md:text-5xl">
            {title}
          </h1>
          {description ? <p className="mt-2 max-w-2xl text-sm text-white/65">{description}</p> : null}
          <div className="mt-3 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
            {typeof albumCount === "number" && (
              <span className="rounded-full bg-black/35 px-3 py-1.5 text-xs font-semibold tabular-nums text-white ring-1 ring-white/15">
                {albumCount} {albumCount === 1 ? "álbum" : "álbuns"}
              </span>
            )}
            {typeof trackCount === "number" && (
              <span className="rounded-full bg-black/35 px-3 py-1.5 text-xs font-semibold tabular-nums text-white ring-1 ring-white/15">
                {trackCount} {trackCount === 1 ? "faixa" : "faixas"}
              </span>
            )}
            <span
              className={`rounded-full px-3 py-1.5 text-xs font-bold ring-1 ${
                hasVip
                  ? "bg-[#1ed760]/20 text-[#1ed760] ring-[#1ed760]/40"
                  : "bg-black/35 text-zinc-300 ring-white/15"
              }`}
            >
              {hasVip ? "Premium ativo" : "Prévia 1 min"}
            </span>
            {badgeActions}
          </div>
          {actions ? <div className="mt-4 flex flex-wrap justify-center gap-2 sm:justify-start">{actions}</div> : null}
        </div>
      </div>
    </section>
  );
}

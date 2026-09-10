import Image from "next/image";
import type { ReactNode } from "react";
import { displayFolderName, parseMonthStatus, type MonthStatus } from "../../lib/vip-music-slugs";
import { MUSICAS_HERO_BG_SRC, MUSICAS_HERO_COVER_SRC } from "../lib/musicas-hero-art";

export function monthStatusClass(status: MonthStatus) {
  if (status === "completo") return "text-[#1ed760]";
  if (status === "em-atualizacao") return "text-amber-300";
  if (status === "em-breve") return "text-zinc-500";
  return "text-zinc-600";
}

type HeroMode = "weeks" | "week-styles" | "styles" | "tracks";

type AtualizacoesMonthHeroProps = {
  folderName: string;
  itemCount: number;
  hasVip: boolean;
  mode?: HeroMode;
  coverUrl?: string | null;
  badgeActions?: ReactNode;
  actions?: ReactNode;
};

/** Hero de pasta — minimalista; modo tracks com capa atmosférica. */
export function AtualizacoesMonthHero({
  folderName,
  itemCount,
  hasVip,
  mode = "styles",
  coverUrl,
  badgeActions,
  actions,
}: AtualizacoesMonthHeroProps) {
  const title = displayFolderName(folderName);
  const { label, status } = parseMonthStatus(folderName);
  const cover = coverUrl?.trim() || MUSICAS_HERO_COVER_SRC;
  const isTracks = mode === "tracks";

  const eyebrow =
    mode === "weeks"
      ? "Pack do mês"
      : mode === "tracks"
        ? "Pack"
        : mode === "week-styles"
          ? "Semana"
          : "Estilos";
  const description =
    mode === "weeks"
      ? "Escolha a semana e continue até as faixas."
      : mode === "tracks"
        ? "Ouça no navegador ou envie ao BRS Downloader."
        : mode === "week-styles"
          ? "Abra uma pasta para ouvir as faixas."
          : "Abra a pasta e continue até as faixas.";
  const countLabel =
    mode === "weeks"
      ? itemCount === 1
        ? "semana"
        : "semanas"
      : mode === "tracks"
        ? itemCount === 1
          ? "faixa"
          : "faixas"
        : itemCount === 1
          ? "pasta"
          : "pastas";

  const coverSize = isTracks
    ? "h-44 w-44 sm:h-56 sm:w-56 md:h-60 md:w-60"
    : "h-36 w-36 sm:h-44 sm:w-44";

  return (
    <section
      className={`relative mb-6 overflow-hidden ${isTracks ? "rounded-2xl" : "rounded-xl"}`}
    >
      {isTracks ? (
        <>
          <Image
            src={cover}
            alt=""
            fill
            priority
            sizes="100vw"
            className="scale-110 object-cover object-center blur-2xl saturate-125"
            aria-hidden
            unoptimized={cover.startsWith("/api/")}
          />
          <div className="absolute inset-0 bg-black/55" aria-hidden />
          <div className="absolute inset-0 bg-gradient-to-t from-[#121212] via-[#121212]/75 to-black/25" aria-hidden />
        </>
      ) : (
        <>
          <Image
            src={MUSICAS_HERO_BG_SRC}
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover object-center"
            aria-hidden
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/88 via-black/65 to-black/35" aria-hidden />
          <div className="absolute inset-0 bg-gradient-to-t from-[#121212] via-transparent to-black/25" aria-hidden />
        </>
      )}

      <div
        className={`relative z-10 flex flex-col gap-5 px-4 sm:flex-row sm:items-end sm:gap-7 sm:px-7 ${
          isTracks ? "py-9 sm:py-12" : "py-7 sm:py-9"
        }`}
      >
        <div
          className={`relative mx-auto flex-shrink-0 overflow-hidden rounded-md shadow-[0_24px_60px_rgba(0,0,0,0.55)] ring-1 ring-white/12 sm:mx-0 ${coverSize}`}
        >
          <Image
            src={cover}
            alt={title}
            fill
            className="object-cover"
            sizes={isTracks ? "240px" : "176px"}
            priority
            unoptimized={cover.startsWith("/api/")}
          />
        </div>

        <div className="min-w-0 flex-1 text-center sm:text-left">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-400">{eyebrow}</p>
          <div className="mt-1.5 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 sm:justify-start">
            <h1
              className={`break-words font-extrabold tracking-tight text-white ${
                isTracks
                  ? "font-display text-3xl sm:text-4xl md:text-5xl"
                  : "text-page-title"
              }`}
            >
              {title}
            </h1>
            {label && mode === "weeks" && (
              <span className={`text-xs font-semibold uppercase ${monthStatusClass(status)}`}>{label}</span>
            )}
          </div>
          <p className={`mt-2 max-w-2xl text-sm ${isTracks ? "text-zinc-300" : "text-zinc-400"}`}>
            {description}
          </p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5 text-sm text-zinc-400 sm:justify-start">
            <span className="tabular-nums text-zinc-300">
              {itemCount} {countLabel}
            </span>
            <span className="text-zinc-700" aria-hidden>
              ·
            </span>
            <span className={hasVip ? "text-[#1ed760]" : "text-zinc-500"}>
              {hasVip ? "Premium ativo" : "Só navegação"}
            </span>
            {badgeActions ? <span className="inline-flex items-center gap-2">{badgeActions}</span> : null}
          </div>
          {actions ? (
            <div className={`mt-5 flex flex-wrap justify-center gap-2 sm:justify-start ${isTracks ? "gap-3" : ""}`}>
              {actions}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

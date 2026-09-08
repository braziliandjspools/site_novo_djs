import Image from "next/image";
import type { ReactNode } from "react";
import { displayFolderName, parseMonthStatus, type MonthStatus } from "../../lib/vip-music-slugs";
import { MUSICAS_HERO_BG_SRC, MUSICAS_HERO_COVER_SRC } from "../lib/musicas-hero-art";

export function monthStatusClass(status: MonthStatus) {
  if (status === "completo") return "bg-[#1ed760]/20 text-[#1ed760] ring-[#1ed760]/40";
  if (status === "em-atualizacao") return "bg-amber-500/20 text-amber-200 ring-amber-400/40";
  if (status === "em-breve") return "bg-zinc-800/80 text-zinc-400 ring-zinc-600";
  return "bg-zinc-900 text-zinc-500 ring-zinc-700";
}

type HeroMode = "weeks" | "week-styles" | "styles" | "tracks";

type AtualizacoesMonthHeroProps = {
  folderName: string;
  /** Contagem contextual: semanas, estilos ou faixas. */
  itemCount: number;
  hasVip: boolean;
  mode?: HeroMode;
  coverUrl?: string | null;
  /** Ex.: botão Sincronizar ao lado dos badges. */
  badgeActions?: ReactNode;
  actions?: ReactNode;
};

/** Hero de pasta estilo capa de playlist. */
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
        ? "Ouça as faixas e envie packs ao BRS Downloader."
        : mode === "week-styles"
          ? "Abra uma pasta para ouvir e enviar packs ao Downloader."
          : "Abra a pasta, ouça e envie packs ao BRS Downloader.";
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
          <div className="mt-1.5 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
            <h1 className="break-words text-3xl font-black tracking-tight text-white sm:text-4xl md:text-5xl">
              {title}
            </h1>
            {label && mode === "weeks" && (
              <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ring-1 ${monthStatusClass(status)}`}>
                {label}
              </span>
            )}
          </div>
          <p className="mt-2 max-w-2xl text-sm text-white/65">{description}</p>
          <div className="mt-3 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
            <span className="rounded-full bg-black/35 px-3 py-1.5 text-xs font-semibold tabular-nums text-white ring-1 ring-white/15">
              {itemCount} {countLabel}
            </span>
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

import Image from "next/image";
import type { ReactNode } from "react";
import { FolderOpen, Music2, Sparkles } from "lucide-react";
import { displayFolderName, parseMonthStatus, type MonthStatus } from "../../lib/vip-music-slugs";
import { MUSICAS_HERO_BG_SRC, MUSICAS_HERO_COVER_SRC } from "../lib/musicas-hero-art";

export function monthStatusClass(status: MonthStatus) {
  if (status === "completo") return "text-[#1ed760]";
  if (status === "em-atualizacao") return "text-amber-300";
  if (status === "em-breve") return "text-zinc-500";
  return "text-zinc-600";
}

type HeroMode = "weeks" | "week-styles" | "styles" | "tracks" | "months";

type AtualizacoesMonthHeroProps = {
  folderName: string;
  itemCount: number;
  hasVip: boolean;
  mode?: HeroMode;
  coverUrl?: string | null;
  badgeActions?: ReactNode;
  /** @deprecated Preferir `actions` com botões no rodapé do hero. */
  coverAction?: ReactNode;
  actions?: ReactNode;
};

/** Hero de pasta/subpasta — mesmo painel e CTAs do hero da raiz. */
export function AtualizacoesMonthHero({
  folderName,
  itemCount,
  hasVip,
  mode = "styles",
  coverUrl,
  badgeActions,
  coverAction,
  actions,
}: AtualizacoesMonthHeroProps) {
  const title = displayFolderName(folderName);
  const { label, status } = parseMonthStatus(folderName);
  const cover = coverUrl?.trim() || MUSICAS_HERO_COVER_SRC;
  const hasFolderCover = Boolean(coverUrl?.trim());

  const eyebrow =
    mode === "weeks"
      ? "Pack do mês"
      : mode === "months"
        ? "Pack anual"
        : mode === "tracks"
          ? "Pack"
          : mode === "week-styles"
            ? "Mês"
            : "Acervo";
  const description =
    mode === "weeks"
      ? "Escolha a pasta do mês e continue até as subpastas e faixas."
      : mode === "months"
        ? "Escolha o mês (ex.: 04- ABRIL 2024) e avance para as pastas."
        : mode === "tracks"
          ? "Ouça no navegador ou envie ao BRS Downloader."
          : mode === "week-styles"
            ? "Abra uma pasta — pode ter subpastas ou MP3s diretos."
            : "Abra um estilo em acordeão. Pastas internas podem ser baixadas; o acervo inteiro não.";
  const countLabel =
    mode === "weeks"
      ? itemCount === 1
        ? "semana"
        : "semanas"
      : mode === "months"
        ? itemCount === 1
          ? "mês"
          : "meses"
        : mode === "tracks"
          ? itemCount === 1
            ? "faixa"
            : "faixas"
          : itemCount === 1
            ? "pasta"
            : "pastas";

  const countText = `${itemCount.toLocaleString("pt-BR")} ${countLabel}`;

  return (
    <section className="relative mb-6 overflow-hidden rounded-[24px] bg-[#17191d] shadow-2xl shadow-black/40 ring-1 ring-white/[0.06] sm:mb-8 sm:rounded-[28px]">
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        {hasFolderCover ? (
          <>
            <Image
              src={cover}
              alt=""
              fill
              priority
              sizes="100vw"
              className="scale-110 object-cover object-center opacity-45 blur-2xl"
              unoptimized={cover.startsWith("/api/")}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/60 to-black/40" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#101412] via-transparent to-black/15" />
          </>
        ) : (
          <>
            <Image
              src={MUSICAS_HERO_BG_SRC}
              alt=""
              fill
              priority
              sizes="100vw"
              className="object-cover object-center opacity-90"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-black/30" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#1e1e1e] via-transparent to-black/10" />
          </>
        )}
      </div>
      <div className="relative z-20 h-px w-full bg-gradient-to-r from-[#1ed760] via-[#1ed760]/40 to-transparent" />

      <div className="relative z-10 flex flex-col gap-4 p-4 sm:flex-row sm:items-end sm:gap-7 sm:p-7 lg:p-8">
        <div className="mx-auto w-full max-w-[160px] flex-shrink-0 sm:mx-0 sm:max-w-[200px] lg:max-w-[220px]">
          <div className="relative aspect-square overflow-hidden rounded-2xl shadow-[0_24px_60px_rgba(0,0,0,0.55)] ring-1 ring-white/10">
            <Image
              src={cover}
              alt={title}
              fill
              priority
              className="object-cover"
              sizes="220px"
              unoptimized={cover.startsWith("/api/")}
            />
            {coverAction ? (
              <div className="absolute inset-x-0 bottom-0 z-10 flex justify-center bg-gradient-to-t from-black/85 via-black/50 to-transparent px-2 pb-2.5 pt-8">
                {coverAction}
              </div>
            ) : null}
          </div>
        </div>

        <div className="min-w-0 flex-1 text-center sm:text-left">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/55">
            {eyebrow}
          </p>
          <div className="mt-1.5 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 sm:justify-start">
            <h1 className="break-words font-display text-3xl font-extrabold uppercase tracking-tight text-white sm:text-5xl">
              {title}
            </h1>
            {label && mode === "weeks" ? (
              <span className={`text-xs font-semibold uppercase ${monthStatusClass(status)}`}>
                {label}
              </span>
            ) : null}
          </div>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-white/65 sm:mx-0 md:text-base">
            {description}
          </p>

          <div className="mt-5 flex justify-center sm:justify-start">
            <div className="flex flex-wrap justify-center gap-2 sm:justify-start">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-black/35 px-3 py-1.5 text-sm tabular-nums text-white/75">
                {mode === "tracks" ? (
                  <Music2 className="h-3.5 w-3.5 opacity-60" aria-hidden />
                ) : (
                  <FolderOpen className="h-3.5 w-3.5 opacity-60" aria-hidden />
                )}
                {countText}
              </span>
              <span
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm tabular-nums ${
                  hasVip
                    ? "border-[#1ed760]/30 bg-[#1ed760]/10 text-[#1ed760]"
                    : "border-white/10 bg-black/35 text-white/75"
                }`}
              >
                {hasVip ? <Sparkles className="h-3.5 w-3.5" aria-hidden /> : null}
                {hasVip ? "Premium ativo" : "Só navegação"}
              </span>
              {badgeActions ? (
                <span className="inline-flex items-center gap-2">{badgeActions}</span>
              ) : null}
            </div>
          </div>

          {actions ? (
            <div className="mt-5 grid grid-cols-1 gap-2 sm:flex sm:flex-wrap sm:justify-start">
              {actions}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

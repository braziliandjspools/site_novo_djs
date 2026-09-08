import type { ReactNode } from "react";
import { FolderOpen, Music2 } from "lucide-react";
import { displayFolderName, parseMonthStatus, type MonthStatus } from "../../lib/vip-music-slugs";
import { MusicasHeroDownloader } from "./MusicasHeroDownloader";

export function monthStatusClass(status: MonthStatus) {
  if (status === "completo") return "bg-[#1ed760]/20 text-[#1ed760] ring-[#1ed760]/40";
  if (status === "em-atualizacao") return "bg-amber-500/20 text-amber-200 ring-amber-400/40";
  if (status === "em-breve") return "bg-zinc-800/80 text-zinc-400 ring-zinc-600";
  return "bg-zinc-900 text-zinc-500 ring-zinc-700";
}

type HeroMode = "weeks" | "week-styles" | "styles";

type AtualizacoesMonthHeroProps = {
  folderName: string;
  styleCount: number;
  hasVip: boolean;
  mode?: HeroMode;
  actions?: ReactNode;
};

/** Hero de pasta estilo capa de playlist. */
export function AtualizacoesMonthHero({
  folderName,
  styleCount,
  hasVip,
  mode = "styles",
  actions,
}: AtualizacoesMonthHeroProps) {
  const title = displayFolderName(folderName);
  const { label, status } = parseMonthStatus(folderName);

  const eyebrow =
    mode === "weeks" ? "Pack do mês" : mode === "week-styles" ? "Semana" : "Estilos";
  const description =
    mode === "weeks"
      ? "Escolha a semana e continue até as faixas."
      : mode === "week-styles"
        ? "Abra um estilo para ouvir e enviar ao Downloader."
        : "Abra a pasta, ouça e envie packs ao BRS Downloader.";
  const countLabel =
    mode === "weeks"
      ? styleCount === 1
        ? "semana"
        : "semanas"
      : styleCount === 1
        ? "estilo"
        : "estilos";

  const gradient =
    mode === "weeks"
      ? "from-[#1ed760]/40 via-[#12382a] to-[#121212]"
      : mode === "week-styles"
        ? "from-sky-500/35 via-[#152536] to-[#121212]"
        : "from-amber-500/30 via-[#2a2114] to-[#121212]";

  return (
    <section className="relative mb-6 overflow-hidden rounded-2xl">
      <div className={`absolute inset-0 bg-gradient-to-b ${gradient}`} aria-hidden />
      <div className="relative flex flex-col gap-5 px-4 py-7 sm:flex-row sm:items-end sm:gap-7 sm:px-8 sm:py-9">
        <div className="relative mx-auto flex h-36 w-36 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg bg-black/30 shadow-[0_18px_40px_rgba(0,0,0,0.5)] ring-1 ring-white/10 sm:mx-0 sm:h-44 sm:w-44">
          {mode === "styles" || mode === "week-styles" ? (
            <FolderOpen className="h-16 w-16 text-[#1ed760]/90" strokeWidth={1.25} />
          ) : (
            <Music2 className="h-16 w-16 text-[#1ed760]/90" strokeWidth={1.25} />
          )}
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
            <span className="rounded-full bg-black/35 px-3 py-1.5 text-xs font-semibold text-white ring-1 ring-white/15">
              {styleCount} {countLabel}
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
          </div>
          {actions ? <div className="mt-4 flex flex-wrap justify-center gap-2 sm:justify-start">{actions}</div> : null}
        </div>

        <div className="mx-auto w-full max-w-sm flex-shrink-0 sm:mx-0 sm:self-end">
          <MusicasHeroDownloader />
        </div>
      </div>
    </section>
  );
}

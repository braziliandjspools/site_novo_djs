"use client";

import Image from "next/image";
import { Music2, FolderOpen, Sparkles } from "lucide-react";
import { MUSICAS_HERO_BG_SRC, MUSICAS_HERO_COVER_SRC } from "../lib/musicas-hero-art";
import { AtualizacoesDriveSyncButton } from "./AtualizacoesDriveSyncButton";

export type UpdatesHeroStat = {
  label: string;
  accent?: boolean;
};

type UpdatesHeroProps = {
  folderCount?: number | null;
  trackCount?: number | null;
  totalSizeLabel?: string | null;
  updatedAt?: string | null;
  premium: boolean;
  statsLoading?: boolean;
  onSynced?: (result?: { syncedAt?: string; folderCount?: number }) => void | Promise<void>;
  exploreHref?: string;
};

function formatRelativeUpdate(iso: string): string | null {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  const diffMs = Date.now() - date.getTime();
  if (diffMs < 0) return null;
  const mins = Math.max(1, Math.round(diffMs / 60_000));
  if (mins < 60) return `há ${mins} min`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `há ${hours} h`;
  const startToday = new Date();
  startToday.setHours(0, 0, 0, 0);
  const startThat = new Date(date);
  startThat.setHours(0, 0, 0, 0);
  const diffDays = Math.round((startToday.getTime() - startThat.getTime()) / 86_400_000);
  if (diffDays === 0) {
    return `hoje às ${date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`;
  }
  if (diffDays === 1) return "ontem";
  return `em ${date.toLocaleDateString("pt-BR")}`;
}

function formatCount(n: number) {
  return n.toLocaleString("pt-BR");
}

function StatsSkeleton() {
  return (
    <div className="flex flex-wrap gap-2" aria-busy="true" aria-label="Carregando estatísticas">
      <div className="h-8 w-24 animate-pulse rounded-full bg-white/10" />
      <div className="h-8 w-28 animate-pulse rounded-full bg-white/10" />
      <div className="h-8 w-28 animate-pulse rounded-full bg-white/10" />
    </div>
  );
}

/** Hero da raiz /musicas/atualizacoes — painel de entrada do acervo. */
export function UpdatesHero({
  folderCount,
  trackCount,
  totalSizeLabel,
  updatedAt,
  premium,
  statsLoading = false,
  onSynced,
  exploreHref = "#atualizacoes-pastas",
}: UpdatesHeroProps) {
  const stats: UpdatesHeroStat[] = [];
  if (typeof folderCount === "number" && folderCount >= 0) {
    stats.push({
      label: `${formatCount(folderCount)} ${folderCount === 1 ? "pasta" : "pastas"}`,
    });
  }
  if (typeof trackCount === "number" && trackCount > 0) {
    stats.push({
      label: `${formatCount(trackCount)} ${trackCount === 1 ? "faixa" : "faixas"}`,
    });
  }
  if (totalSizeLabel?.trim()) {
    stats.push({ label: totalSizeLabel.trim() });
  }
  stats.push({
    label: premium ? "Premium ativo" : "Só navegação",
    accent: premium,
  });

  function explore() {
    const target = document.querySelector(exploreHref);
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    window.location.hash = exploreHref.replace(/^#/, "");
  }

  return (
    <section className="relative mb-6 overflow-hidden rounded-[24px] bg-[#17191d] shadow-2xl shadow-black/40 ring-1 ring-white/[0.06] sm:mb-8 sm:rounded-[28px]">
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <Image
          src={MUSICAS_HERO_BG_SRC}
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-center opacity-90"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/45 to-black/25" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#1e1e1e] via-transparent to-black/10" />
      </div>
      <div className="relative z-20 h-px w-full bg-gradient-to-r from-[#1ed760] via-[#1ed760]/40 to-transparent" />

      <div className="relative z-10 flex flex-col gap-4 p-4 sm:flex-row sm:items-end sm:gap-7 sm:p-7 lg:p-8">
        <div className="mx-auto w-full max-w-[160px] flex-shrink-0 sm:mx-0 sm:max-w-[200px] lg:max-w-[220px]">
          <div className="relative aspect-square overflow-hidden rounded-2xl shadow-[0_24px_60px_rgba(0,0,0,0.55)] ring-1 ring-white/10">
            <Image
              src={MUSICAS_HERO_COVER_SRC}
              alt="BRS — Brazilian Remix Service"
              fill
              priority
              className="object-cover"
              sizes="220px"
            />
          </div>
        </div>

        <div className="min-w-0 flex-1 text-center sm:text-left">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/55">
            Acervo VIP
          </p>
          <h1 className="mt-1.5 font-display text-3xl font-extrabold tracking-tight text-white sm:text-5xl">
            Atualizações
          </h1>
          <div className="mx-auto mt-3 max-w-xl space-y-1.5 text-sm leading-relaxed text-white/70 sm:mx-0 md:text-base">
            <p className="font-medium text-white/90">Seu acervo sempre atualizado.</p>
            <p className="hidden sm:block">
              Lançamentos VIP frescos quase todo dia — packs, coleções e faixas prontos para o set.
            </p>
            <p className="text-white/55">
              Ouça no navegador ou envie em um toque para o BRS Downloader.
            </p>
          </div>

          <div className="mt-5 flex justify-center sm:justify-start">
            <div className="flex flex-wrap justify-center gap-2 sm:justify-start">
              {stats.map((stat) => (
                <span
                  key={stat.label}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm tabular-nums ${
                    stat.accent
                      ? "border-[#1ed760]/30 bg-[#1ed760]/10 text-[#1ed760]"
                      : "border-white/10 bg-black/35 text-white/75"
                  }`}
                >
                  {stat.label.includes("pasta") ? (
                    <FolderOpen className="h-3.5 w-3.5 opacity-60" aria-hidden />
                  ) : null}
                  {stat.label.includes("faixa") ? (
                    <Music2 className="h-3.5 w-3.5 opacity-60" aria-hidden />
                  ) : null}
                  {stat.accent ? <Sparkles className="h-3.5 w-3.5" aria-hidden /> : null}
                  {stat.label}
                </span>
              ))}
              {statsLoading && !(typeof trackCount === "number" && trackCount > 0) ? (
                <span className="h-8 w-28 animate-pulse rounded-full bg-white/10" aria-hidden />
              ) : null}
            </div>
          </div>

          {updatedAt && formatRelativeUpdate(updatedAt) ? (
            <p className="mt-3 text-center text-xs text-white/40 sm:text-left">
              Atualizado {formatRelativeUpdate(updatedAt)}
            </p>
          ) : statsLoading ? (
            <div className="mx-auto mt-3 h-3 w-40 animate-pulse rounded bg-white/10 sm:mx-0" />
          ) : null}

          <div className="mt-5 grid grid-cols-1 gap-2 sm:flex sm:flex-wrap sm:justify-start">
            <button
              type="button"
              onClick={explore}
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-[#1ed760] px-5 text-sm font-bold text-black transition-transform hover:scale-[1.01] hover:bg-[#1fdf67] sm:w-auto"
            >
              Explorar agora
            </button>
            <AtualizacoesDriveSyncButton onSynced={onSynced} className="w-full sm:w-auto" />
          </div>
        </div>
      </div>
    </section>
  );
}

export function UpdatesHeroSkeleton() {
  return (
    <section
      className="relative mb-8 overflow-hidden rounded-[28px] bg-[#17191d] p-5 ring-1 ring-white/[0.06] sm:p-7 lg:p-8"
      aria-busy="true"
      aria-label="Carregando acervo"
    >
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end">
        <div className="mx-auto aspect-square w-full max-w-[200px] animate-pulse rounded-2xl bg-white/10 sm:mx-0 sm:max-w-[220px]" />
        <div className="min-w-0 flex-1 space-y-3">
          <div className="h-3 w-20 animate-pulse rounded bg-white/10" />
          <div className="h-12 w-3/4 max-w-sm animate-pulse rounded bg-white/10" />
          <div className="h-4 w-full max-w-lg animate-pulse rounded bg-white/10" />
          <div className="h-4 w-2/3 max-w-md animate-pulse rounded bg-white/10" />
          <StatsSkeleton />
          <div className="flex gap-2 pt-2">
            <div className="h-11 w-36 animate-pulse rounded-full bg-white/10" />
            <div className="h-11 w-32 animate-pulse rounded-full bg-white/10" />
          </div>
        </div>
      </div>
    </section>
  );
}

/** @deprecated Use UpdatesHero */
export { UpdatesHero as AtualizacoesAcervoHero };

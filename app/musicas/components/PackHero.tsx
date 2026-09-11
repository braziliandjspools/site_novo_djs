"use client";

import Image from "next/image";
import {
  Download,
  Loader2,
  MonitorDown,
  Pause,
  Play,
} from "lucide-react";
import type { ReactNode } from "react";
import { MUSICAS_HERO_COVER_SRC } from "../lib/musicas-hero-art";
import { AtualizacoesDriveSyncButton } from "./AtualizacoesDriveSyncButton";

export type PackHeroStat = {
  label: string;
  /** Destaque verde (ex.: Premium ativo). */
  accent?: boolean;
};

type PackHeroProps = {
  title: string;
  eyebrow?: string;
  description?: string;
  coverUrl?: string | null;
  /** Imagem de fundo desfocada; padrão = capa. */
  backgroundImage?: string | null;
  stats?: PackHeroStat[];
  playing?: boolean;
  playBusy?: boolean;
  canPlay?: boolean;
  canDownload?: boolean;
  downloading?: boolean;
  sendingToDownloader?: boolean;
  onPlay?: () => void;
  onSendToDownloader?: () => void;
  onDownload?: () => void;
  onSynced?: () => void | Promise<void>;
  /** Slot extra após os botões padrão (raro). */
  extraActions?: ReactNode;
};

const btnBase =
  "inline-flex h-11 items-center justify-center gap-2 rounded-full px-4 text-sm font-bold transition-colors transition-transform hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:scale-100";

/** Hero premium de pack (Atualizações / pastas com faixas). */
export function PackHero({
  title,
  eyebrow = "Pack",
  description = "Ouça no navegador, baixe no dispositivo ou envie direto ao BRS Downloader.",
  coverUrl,
  backgroundImage,
  stats = [],
  playing = false,
  playBusy = false,
  canPlay = false,
  canDownload = false,
  downloading = false,
  sendingToDownloader = false,
  onPlay,
  onSendToDownloader,
  onDownload,
  onSynced,
  extraActions,
}: PackHeroProps) {
  const cover = coverUrl?.trim() || MUSICAS_HERO_COVER_SRC;
  const bg = backgroundImage?.trim() || cover;

  return (
    <section className="relative mb-6 overflow-hidden rounded-[28px] border border-white/5 bg-[#0d0f0f] shadow-2xl shadow-black/40">
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <Image
          src={bg}
          alt=""
          fill
          priority
          sizes="100vw"
          className="scale-110 object-cover object-center opacity-35 blur-3xl saturate-125"
          unoptimized={bg.startsWith("/api/")}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/90 to-emerald-950/40" />
        <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-48 w-96 bg-green-500/5 blur-3xl" />
        <div className="absolute inset-0 bg-black/35" />
      </div>

      <div className="relative z-10 grid gap-6 p-5 sm:p-7 lg:grid-cols-[280px_minmax(0,1fr)] lg:items-end lg:gap-8 lg:p-8">
        <div className="mx-auto w-full max-w-[220px] sm:max-w-[240px] lg:mx-0 lg:max-w-none">
          <div className="group/cover relative aspect-square overflow-hidden rounded-2xl shadow-[0_24px_60px_rgba(0,0,0,0.55)] ring-1 ring-white/10">
            <Image
              src={cover}
              alt={title}
              fill
              priority
              className="object-cover"
              sizes="(max-width: 1024px) 240px, 280px"
              unoptimized={cover.startsWith("/api/")}
            />
            <div className="pointer-events-none absolute inset-0 bg-black/25" aria-hidden />
            <button
              type="button"
              onClick={onPlay}
              disabled={!canPlay || playBusy || !onPlay}
              aria-label={playing ? `Pausar ${title}` : `Ouvir agora ${title}`}
              className="absolute inset-0 z-10 flex cursor-pointer items-center justify-center opacity-60 transition-opacity hover:opacity-100 disabled:cursor-not-allowed disabled:opacity-30"
            >
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-black/55 text-white shadow-lg backdrop-blur-sm transition-transform group-hover/cover:scale-105 sm:h-16 sm:w-16">
                {playBusy ? (
                  <Loader2 className="h-6 w-6 animate-spin sm:h-7 sm:w-7" />
                ) : playing ? (
                  <Pause className="h-6 w-6 sm:h-7 sm:w-7" fill="currentColor" />
                ) : (
                  <Play className="ml-0.5 h-6 w-6 sm:h-7 sm:w-7" fill="currentColor" />
                )}
              </span>
            </button>
          </div>
        </div>

        <div className="min-w-0 text-left">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/50">
            {eyebrow}
          </p>
          <h1 className="mt-1.5 break-words text-4xl font-bold tracking-tight text-white md:text-5xl lg:text-6xl">
            {title}
          </h1>
          {description ? (
            <p className="mt-3 max-w-2xl text-sm text-white/65 md:text-base">{description}</p>
          ) : null}

          {stats.length > 0 ? (
            <div className="mt-5 flex flex-wrap gap-2">
              {stats.map((stat) => (
                <span
                  key={stat.label}
                  className={`rounded-full border px-3 py-1.5 text-sm tabular-nums ${
                    stat.accent
                      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                      : "border-white/10 bg-white/5 text-white/70"
                  }`}
                >
                  {stat.label}
                </span>
              ))}
            </div>
          ) : null}

          <div className="mt-6 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:flex lg:flex-wrap">
            <button
              type="button"
              onClick={onPlay}
              disabled={!canPlay || playBusy || !onPlay}
              aria-label={playing ? `Pausar ${title}` : `Ouvir agora ${title}`}
              className={`${btnBase} w-full bg-emerald-500 text-black hover:bg-emerald-400 sm:col-span-2 lg:w-auto lg:min-w-[9.5rem]`}
            >
              {playBusy ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : playing ? (
                <Pause className="h-4 w-4" fill="currentColor" />
              ) : (
                <Play className="ml-0.5 h-4 w-4" fill="currentColor" />
              )}
              {playing ? "Pausar" : "Ouvir agora"}
            </button>

            <button
              type="button"
              onClick={onSendToDownloader}
              disabled={!canDownload || sendingToDownloader || !onSendToDownloader}
              aria-label={`Enviar ${title} ao Downloader`}
              className={`${btnBase} w-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 lg:w-auto`}
            >
              {sendingToDownloader ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <MonitorDown className="h-4 w-4" />
              )}
              <span className="truncate">
                {sendingToDownloader ? "Enviando…" : (
                  <>
                    <span className="sm:hidden">Enviar ao Downloader</span>
                    <span className="hidden sm:inline">Downloader</span>
                  </>
                )}
              </span>
            </button>

            <button
              type="button"
              onClick={onDownload}
              disabled={!canDownload || downloading || !onDownload}
              aria-label={`Baixar pack ${title}`}
              className={`${btnBase} w-full border border-white/10 bg-white/5 text-white hover:bg-white/10 lg:w-auto`}
            >
              {downloading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              {downloading ? "Baixando…" : (
                <>
                  <span className="sm:hidden">Baixar pack</span>
                  <span className="hidden sm:inline">Baixar</span>
                </>
              )}
            </button>

            {onSynced ? (
              <AtualizacoesDriveSyncButton onSynced={onSynced} className="w-full lg:w-auto" />
            ) : null}
            {extraActions}
          </div>
        </div>
      </div>
    </section>
  );
}

function SkeletonPulse({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-white/10 ${className}`} />;
}

/** Skeleton alinhado ao PackHero para evitar layout shift. */
export function PackHeroSkeleton() {
  return (
    <section
      className="relative mb-6 overflow-hidden rounded-[28px] border border-white/5 bg-[#0d0f0f] p-5 sm:p-7 lg:p-8"
      aria-busy="true"
      aria-label="Carregando pack"
    >
      <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)] lg:items-end lg:gap-8">
        <SkeletonPulse className="mx-auto aspect-square w-full max-w-[220px] rounded-2xl sm:max-w-[240px] lg:mx-0 lg:max-w-none" />
        <div className="min-w-0 space-y-4">
          <SkeletonPulse className="h-3 w-16" />
          <SkeletonPulse className="h-12 w-3/4 max-w-md" />
          <SkeletonPulse className="h-4 w-full max-w-lg" />
          <div className="flex flex-wrap gap-2 pt-1">
            <SkeletonPulse className="h-8 w-24 rounded-full" />
            <SkeletonPulse className="h-8 w-28 rounded-full" />
            <SkeletonPulse className="h-8 w-32 rounded-full" />
          </div>
          <div className="grid grid-cols-1 gap-2 pt-2 sm:grid-cols-2 lg:flex">
            <SkeletonPulse className="h-11 w-full rounded-full lg:w-36" />
            <SkeletonPulse className="h-11 w-full rounded-full lg:w-32" />
            <SkeletonPulse className="h-11 w-full rounded-full lg:w-28" />
            <SkeletonPulse className="h-11 w-full rounded-full lg:w-32" />
          </div>
        </div>
      </div>
    </section>
  );
}
